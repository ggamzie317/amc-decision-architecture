import { createHash } from "node:crypto";
import { getVercelOidcTokenSync } from "@vercel/oidc";
import { z } from "zod";
import {
  caseTypes,
  postures,
  families,
  variables,
  completedInteractive,
} from "../shared/interactivePrivacy.js";
import {
  buildOfflineScenarioPacket,
  parseOfflineGatewayAdvisory,
} from "./jevScenarioContract.js";
import { getFounderOpsStore } from "./founderOpsStore.js";
import type { FounderOpsStore } from "./founderOpsTypes.js";
import type { ApiRequest, ApiResponse } from "./vercelFounderOps.js";
const strength = z.enum(["strong", "developing", "weak", "unknown"]);
const bands = z
  .object({
    financialRoom: strength,
    reversibility: strength,
    downsideExposure: z.enum(["low", "moderate", "high", "unknown"]),
    internalReadiness: strength,
    optionBSupport: strength,
    constraintLoad: z.enum(["light", "material", "heavy", "unknown"]),
    externalValidation: strength,
  })
  .strict();
export const jevInputSchema = z
  .object({
    caseType: z.enum(caseTypes),
    baselineBands: bands,
    scenarioBands: bands,
    changedVariables: z
      .array(z.enum(variables))
      .min(1)
      .max(7)
      .refine(a => new Set(a).size === a.length),
    baselinePosture: z.enum(postures),
    scenarioPosture: z.enum(postures),
    safetyMargin: z.tuple([strength, strength]),
    changingFamilies: z.tuple([
      z.array(z.enum(families)).max(5),
      z.array(z.enum(families)).max(5),
    ]),
  })
  .strict()
  .superRefine((input, ctx) => {
    const changed = variables
      .filter(k => input.baselineBands[k] !== input.scenarioBands[k])
      .sort();
    if (
      JSON.stringify(changed) !==
      JSON.stringify([...input.changedVariables].sort())
    )
      ctx.addIssue({
        code: "custom",
        message: "Changed variables must match bands",
      });
  });
export function gatewayCredential() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    return getVercelOidcTokenSync() || undefined;
  } catch {
    return undefined;
  }
}
const unavailable = { status: "unavailable" } as const;
type Options = {
  store?: FounderOpsStore;
  credential?: () => string | undefined;
  fetcher?: typeof fetch;
  enabled?: boolean;
  timeoutMs?: number;
};
export function createJevScenarioHandler(options: Options = {}) {
  const inFlight = new Map<string, Promise<unknown>>();
  return async (req: ApiRequest, res: ApiResponse) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.status(405).json(unavailable);
      return;
    }
    const parsed = jevInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(unavailable);
      return;
    }
    const id = req.headers?.["x-amc-submission-id"];
    if (typeof id !== "string" || !/^AMC-\d{8}-[A-F0-9]{8}$/.test(id)) {
      res.status(200).json(unavailable);
      return;
    }
    const store = options.store ?? getFounderOpsStore();
    try {
      if (!store.available) {
        res.status(200).json(unavailable);
        return;
      }
      const baseline = (await store.getSubmission(id))?.submission;
      if (
        !baseline?.serviceStorageConsent ||
        !baseline.fullIntakeCompletedAt ||
        !completedInteractive(baseline.structuralOutputJson)
      ) {
        res.status(200).json(unavailable);
        return;
      }
      const input = {
        ...parsed.data,
        changedVariables: [...parsed.data.changedVariables].sort(),
      };
      const body = JSON.stringify(buildOfflineScenarioPacket(input));
      const fingerprint = createHash("sha256")
        .update(id + body)
        .digest("hex");
      let work = inFlight.get(fingerprint);
      if (!work) {
        if (inFlight.size >= 32) {
          res.status(200).json(unavailable);
          return;
        }
        work = (async () => {
          let reserved = false;
          try {
            const enabled =
              options.enabled ??
              (process.env.VERCEL_ENV === "preview" &&
                process.env.VERCEL_GIT_COMMIT_REF ===
                  "experiment/allofmycareer-interactive-v1");
            const credential = enabled
              ? (options.credential ?? gatewayCredential)()
              : undefined;
            if (
              !credential ||
              Buffer.byteLength(body) > 48 * 1024 ||
              !store.reserveJevScenario
            )
              throw new Error("unavailable");
            reserved = await store.reserveJevScenario(id, fingerprint);
            if (!reserved) throw new Error("guard");
            const controller = new AbortController();
            const timeout = setTimeout(
              () => controller.abort(),
              options.timeoutMs ?? 3000
            );
            try {
              const response = await (options.fetcher ?? fetch)(
                "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${credential}`,
                    "Content-Type": "application/json",
                  },
                  body,
                  signal: controller.signal,
                  redirect: "error",
                }
              );
              if (
                !response.ok ||
                [
                  "x-ai-gateway-evaluation-fallback-triggered",
                  "x-ai-gateway-decision-fallback-triggered",
                ].some(h => response.headers.get(h) === "true")
              )
                throw new Error("routing");
              if (!response.body) throw new Error("body");
              const reader = response.body.getReader();
              let size = 0;
              const chunks: Uint8Array[] = [];
              try {
                for (;;) {
                  const part = await reader.read();
                  if (part.done) break;
                  size += part.value.byteLength;
                  if (size > 8192) {
                    await reader.cancel();
                    throw new Error("size");
                  }
                  chunks.push(part.value);
                }
              } finally {
                reader.releaseLock();
              }
              const advisory = parseOfflineGatewayAdvisory(
                JSON.parse(Buffer.concat(chunks).toString("utf8"))
              );
              if (!advisory) throw new Error("contract");
              await store.addEvent(id, "jev_assessment_completed", {
                scenarioPlausibility: advisory.scenarioPlausibility,
                evidenceSupport: advisory.evidenceSupport,
                scenarioSensitivity: advisory.scenarioSensitivity,
              });
              return { status: "available", advisory };
            } finally {
              clearTimeout(timeout);
            }
          } catch {
            if (!reserved) await store.addEvent(id, "jev_assessment_requested");
            await store.addEvent(id, "jev_assessment_unavailable");
            return unavailable;
          }
        })();
        inFlight.set(fingerprint, work);
      }
      try {
        res.status(200).json(await work);
      } finally {
        inFlight.delete(fingerprint);
      }
    } catch {
      res.status(200).json(unavailable);
    }
  };
}
export const handleJevScenario = createJevScenarioHandler();
