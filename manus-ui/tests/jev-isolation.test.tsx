// Owner decision 2026-10-17: JEV is an auxiliary tool and must never harm the
// main analysis framework. These tests pin that boundary.
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import { buildV2Analysis } from "../client/src/data/amcV2Analysis";
import {
  buildV2Input,
  buildV2Sensitivity,
  v2Scenario,
  v2SwitchCandidates,
} from "../client/src/data/amcV2Model";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { baselineBands, type ScenarioOverrides } from "../client/src/data/amcScenario";
import { unavailableIntelligence } from "../client/src/data/externalIntelligenceV2";
import {
  limitV2Overrides,
  selectV2SimulatorVariables,
} from "../client/src/data/amcV2SensitivityView";
import {
  createJevSession,
  createServerJevProvider,
  makeJevInput,
  type JevProvider,
  type JevResult,
} from "../client/src/data/amcJevAdvisory";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import V2Simulator from "../client/src/components/V2Simulator";
import { V2JevAdvisoryPanel } from "../client/src/components/V2JevAdvisory";
import { createJevScenarioHandler } from "../server/jevScenario";
import { metrics } from "../server/jevScenarioContract";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { identity, projectInteractivePatch } from "../shared/interactivePrivacy";
(globalThis as any).React = React;

const root =
  path.basename(process.cwd()) === "manus-ui"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
const src = (p: string) => path.join(root, "manus-ui", p);
const read = (p: string) => fs.readFileSync(src(p), "utf8");

const advisory = {
  scenarioPlausibility: "high",
  evidenceSupport: "low",
  scenarioSensitivity: "high",
  changingFeasibility: "medium",
  safetyMarginContribution: "high",
  assumptions: ["Support remains available"],
  uncertainties: ["Execution burden remains unclear"],
  conditionalReading: "If support holds, the scenario may be more defensible.",
};

// Every way JEV can answer, from the browser's point of view.
const outcomes: Record<string, JevProvider | undefined> = {
  available: { assess: async () => structuredClone(advisory) },
  unavailable: {
    assess: async () => {
      throw new Error("unavailable");
    },
  },
  throws: {
    assess: () => {
      throw new TypeError("boom");
    },
  },
  timeout: { assess: () => new Promise(() => {}) },
  malformed: { assess: async () => ({ percentage: 72, recommend: "B" }) },
  absent: undefined,
};

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

function scenarioFor(kind: "entrepreneurship" | "industry", language: "en" | "ko") {
  const f = v2DemoFixture(kind, language);
  const visibleVariables = selectV2SimulatorVariables(
    f.sensitivity,
    baselineBands(f.input)
  );
  const first = visibleVariables[0];
  const current = baselineBands(f.input)[first];
  const overrides: ScenarioOverrides = {
    [first]: current === "weak" ? "strong" : "weak",
  } as ScenarioOverrides;
  return { ...f, visibleVariables, overrides };
}

/** Everything the customer reads from the main framework for one scenario. */
function coreOutput(s: ReturnType<typeof scenarioFor>) {
  const intelligence = unavailableIntelligence(s.state.caseType, s.state.language);
  const input = buildV2Input(s.state, intelligence);
  const baseline = buildProductApplicationV3(input);
  const active = limitV2Overrides(input, s.visibleVariables, s.overrides);
  const scenario = v2Scenario(input, active);
  const props = {
    state: s.state,
    input,
    sensitivity: s.sensitivity,
    visibleVariables: s.visibleVariables,
    intelligence,
  };
  return JSON.stringify({
    baseline,
    scenario: scenario.result,
    posture: [baseline.currentStructuralPosture, scenario.result.currentStructuralPosture],
    safetyMargin: [baseline.safetyMargin, scenario.result.safetyMargin],
    changing: [baseline.changingPlays, scenario.result.changingPlays],
    analysis: buildV2Analysis(s.state, baseline, intelligence),
    scenarioAnalysis: buildV2Analysis(s.state, scenario.result, intelligence),
    sensitivity: buildV2Sensitivity(input, baseline),
    switches: v2SwitchCandidates(s.state, intelligence),
    dashboard: renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: s.state,
        core: baseline,
        intelligence,
        onReport: () => {},
      })
    ),
    simulator: renderToStaticMarkup(
      React.createElement(V2Simulator, {
        ...props,
        baseline,
        overrides: s.overrides,
        onScenarioChange: () => {},
      })
    ),
    report: renderToStaticMarkup(
      React.createElement(V2Report, {
        ...props,
        core: baseline,
        scenarioOverrides: s.overrides,
        onClose: () => {},
        onPrint: () => {},
      })
    ),
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("JEV never affects the main analysis (a)", () => {
  for (const kind of ["entrepreneurship", "industry"] as const)
    for (const language of ["en", "ko"] as const)
      it(`${kind}/${language}: core output is identical for every JEV outcome`, async () => {
        const s = scenarioFor(kind, language);
        const reference = coreOutput(s);
        expect(reference).not.toMatch(/JEV|v2-jev|conditionalReading|Support remains available/);
        for (const [name, provider] of Object.entries(outcomes)) {
          const intelligence = unavailableIntelligence(s.state.caseType, language);
          const input = deepFreeze(buildV2Input(s.state, intelligence));
          const baseline = deepFreeze(buildProductApplicationV3(input));
          const scenario = deepFreeze(v2Scenario(input, s.overrides));
          // Frozen inputs: any write by the JEV path would throw here.
          const request = makeJevInput(input, scenario.input, baseline, scenario.result, s.overrides);
          const result = await createJevSession(provider, 5).assess(request);
          expect(result.status).toBe(name === "available" ? "available" : "unavailable");
          expect(coreOutput(s), name).toBe(reference);
        }
      });

  it("is identical whether the server route answers available, unavailable, errors or times out", async () => {
    const s = scenarioFor("entrepreneurship", "en");
    const reference = coreOutput(s);
    const input = buildV2Input(s.state, unavailableIntelligence(s.state.caseType, "en"));
    const baseline = buildProductApplicationV3(input);
    const scenario = v2Scenario(input, s.overrides);
    const request = makeJevInput(input, scenario.input, baseline, scenario.result, s.overrides);
    const responses: Record<string, () => Promise<Response>> = {
      available: async () => Response.json({ status: "available", advisory }),
      unavailable: async () => Response.json({ status: "unavailable" }),
      http: async () => new Response("", { status: 500 }),
      network: async () => {
        throw new TypeError("network");
      },
      timeout: () => new Promise(() => {}),
    };
    for (const [name, respond] of Object.entries(responses)) {
      vi.stubGlobal("fetch", vi.fn(respond));
      const session = createJevSession(createServerJevProvider("interactive-v2"), 5);
      const result = await session.assess(request);
      expect(result.status, name).toBe(name === "available" ? "available" : "unavailable");
      expect(coreOutput(s), name).toBe(reference);
    }
  });

  it("no core analysis module can reach the JEV code (import graph)", () => {
    const seen = new Set<string>();
    const resolve = (from: string, spec: string) => {
      const base = path.resolve(path.dirname(from), spec.replace(/\.js$/, ""));
      for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`])
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
      return null;
    };
    const walk = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const text = fs.readFileSync(file, "utf8");
      for (const m of text.matchAll(/(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g)) {
        const next = resolve(file, m[1]);
        if (next && /\.(ts|tsx)$/.test(next)) walk(next);
      }
    };
    for (const entry of [
      "client/src/data/amcProductApplicationV3.ts",
      "client/src/data/amcV2Analysis.ts",
      "client/src/data/amcV2Model.ts",
      "client/src/data/amcScenario.ts",
      "client/src/data/amcV2SensitivityView.ts",
      "client/src/components/V2Dashboard.tsx",
      "client/src/components/V2Report.tsx",
      "client/src/components/V2AnalysisView.tsx",
      "client/src/components/V2SwitchList.tsx",
      "client/src/components/V2ScenarioExplain.tsx",
      "client/src/components/V2SensitivityMatrix.tsx",
      "server/founderOpsApi.ts",
    ])
      walk(src(entry));
    const reached = [...seen].map(f => path.relative(src(""), f));
    expect(reached.length).toBeGreaterThan(20);
    expect(reached.filter(f => /jev/i.test(f))).toEqual([]);
  });

  it("JEV is consumed only by the advisory panel, the legacy V1 simulator and ops analytics", () => {
    const files: string[] = [];
    const list = (dir: string) => {
      for (const e of fs.readdirSync(src(dir), { withFileTypes: true })) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory()) list(p);
        else if (/\.(ts|tsx)$/.test(e.name)) files.push(p);
      }
    };
    list("client/src");
    list("server");
    list("shared");
    list("api");
    const importers = (re: RegExp) =>
      files.filter(f => re.test(read(f))).sort();
    expect(importers(/from\s+["'][^"']*amcJevAdvisory["']/)).toEqual([
      "client/src/components/InteractiveSimulator.tsx",
      "client/src/components/V2JevAdvisory.tsx",
    ]);
    expect(importers(/from\s+["'][^"']*V2JevAdvisory["']/)).toEqual([
      "client/src/components/V2Simulator.tsx",
    ]);
    expect(importers(/from\s+["'][^"']*jevScenario(\.js)?["']/)).toEqual([
      "api/amc/jev-scenario.ts",
      "server/index.ts",
    ]);
    // The legacy V1 simulator is not reachable: its route redirects to V2.
    expect(read("client/src/App.tsx")).toMatch(
      /path=\{"\/amc-web-mvp"\} component=\{LegacyProductRedirect\}/
    );
    expect(importers(/from\s+["'][^"']*InteractiveSimulator["']/)).toEqual([
      "client/src/pages/AmcWebMvp.tsx",
    ]);
    expect(importers(/from\s+["'][^"']*pages\/AmcWebMvp["']/)).toEqual([]);
  });

  it("the simulator hands JEV read-only data and takes nothing back", () => {
    const sim = read("client/src/components/V2Simulator.tsx");
    const element = sim.match(/<V2JevAdvisory\b[\s\S]*?\/>/)?.[0] ?? "";
    const props = [...element.matchAll(/(\w+)=\{/g)].map(m => m[1]).sort();
    expect(props).toEqual(["baseline", "input", "language", "overrides", "scenario", "scenarioInput"]);
    const jev = read("client/src/components/V2JevAdvisory.tsx") + read("client/src/data/amcJevAdvisory.ts");
    // No callbacks, ops tracking, storage or shared state leave the advisory.
    expect(jev).not.toMatch(/onScenarioChange|onEvent|track[A-Z]\w*\(|localStorage\.|sessionStorage\.setItem|setScenario/);
  });
});

describe("a JEV failure or slow answer never blocks or alters the journey (b)", () => {
  it("the simulator renders synchronously while a JEV request is still pending, and the session resolves unavailable on its own timeout", async () => {
    vi.useFakeTimers();
    const s = scenarioFor("entrepreneurship", "en");
    const reference = coreOutput(s);
    const input = buildV2Input(s.state, unavailableIntelligence(s.state.caseType, "en"));
    const baseline = buildProductApplicationV3(input);
    const scenario = v2Scenario(input, s.overrides);
    const pending = createJevSession({ assess: () => new Promise(() => {}) }).assess(
      makeJevInput(input, scenario.input, baseline, scenario.result, s.overrides)
    );
    let settled: JevResult | null = null;
    void pending.then(r => (settled = r));
    // Core output is ready while JEV has not answered.
    expect(coreOutput(s)).toBe(reference);
    expect(settled).toBeNull();
    await vi.advanceTimersByTimeAsync(28_000);
    expect(settled).toEqual({ status: "unavailable" });
    expect(coreOutput(s)).toBe(reference);
  });

  it.each(["available", "http", "network", "timeout", "disabled", "guard"])(
    "server %s: only jev_* events are written and the stored journey is untouched",
    async mode => {
      vi.spyOn(console, "info").mockImplementation(() => {});
      const bands = {
        financialRoom: "developing",
        reversibility: "strong",
        downsideExposure: "low",
        internalReadiness: "developing",
        optionBSupport: "weak",
        constraintLoad: "material",
        externalValidation: "unknown",
      };
      const store = new MemoryFounderOpsStore(
        mode === "guard" ? { perJourney: 0, daily: 200 } : undefined
      );
      const s = await store.createSubmission("en", true);
      await store.updateSubmission(
        s.submissionId,
        projectInteractivePatch({
          caseType: "Entrepreneurship",
          fullIntakeCompletedAt: new Date().toISOString(),
          structuralOutputJson: {
            ...identity,
            baselineBands: bands,
            currentStructuralPosture: { label: "Preserve and Validate" },
            safetyMargin: { band: "developing" },
            changingPlays: [{ family: "resource" }],
          },
        })
      );
      const before = structuredClone(store.submissions.get(s.submissionId));
      const reply = {
        model: "typesafe-ai/jev",
        provider_metadata: {
          gateway: {
            routing: {
              originalModelId: "typesafe-ai/jev",
              canonicalSlug: "typesafe-ai/jev",
              resolvedProvider: "typesafe-ai",
              finalProvider: "typesafe-ai",
            },
          },
        },
        answers: Object.fromEntries(
          metrics.map(k => [
            k,
            { type: "choice", choice: "medium", confidence: 0.7, probabilities: { low: 0.1, medium: 0.7, high: 0.2 } },
          ])
        ),
      };
      const fetcher = vi.fn(async (_u: unknown, init: any) => {
        if (mode === "network") throw new TypeError("network");
        if (mode === "timeout")
          return new Promise<Response>((_, reject) =>
            init.signal.addEventListener("abort", () => {
              const e = new Error("aborted");
              e.name = "AbortError";
              reject(e);
            })
          );
        return new Response(JSON.stringify(reply), { status: mode === "http" ? 500 : 200 });
      });
      const handler = createJevScenarioHandler({
        store,
        enabled: mode !== "disabled",
        credential: () => "TEST_ONLY",
        fetcher: fetcher as any,
        timeoutMs: 5,
      });
      let value: any;
      await handler(
        {
          method: "POST",
          body: {
            caseType: "Entrepreneurship",
            baselineBands: bands,
            scenarioBands: { ...bands, financialRoom: "strong" },
            changedVariables: ["financialRoom"],
            baselinePosture: "Preserve and Validate",
            scenarioPosture: "Preserve and Validate",
            safetyMargin: ["developing", "strong"],
            changingFamilies: [["resource"], ["resource"]],
          },
          headers: { "x-amc-submission-id": s.submissionId },
        },
        {
          setHeader: vi.fn(),
          status() {
            return this;
          },
          json(v: unknown) {
            value = v;
          },
          end: vi.fn(),
          send: vi.fn(),
        } as any
      );
      expect(value.status).toBe(mode === "available" ? "available" : "unavailable");
      expect(store.submissions.get(s.submissionId)).toEqual(before);
      expect(store.events.length).toBeGreaterThan(0);
      expect(store.events.every(e => e.eventType.startsWith("jev_"))).toBe(true);
    }
  );
});

describe("JEV shows only in the simulator side panel and only when available (c)", () => {
  const render = (changed: boolean, result: JevResult | null, language: "en" | "ko" = "en") =>
    renderToStaticMarkup(
      React.createElement(V2JevAdvisoryPanel, { language, changed, result })
    );
  it("renders nothing for no answer yet, unavailable, or an unchanged scenario", () => {
    expect(render(true, null)).toBe("");
    expect(render(true, { status: "unavailable" })).toBe("");
    expect(render(false, { status: "available", advisory } as JevResult)).toBe("");
  });
  it("renders the labelled reference panel only for an available advisory", () => {
    const html = render(true, { status: "available", advisory } as JevResult);
    expect(html).toContain('data-testid="v2-jev-advisory"');
    expect(html).toContain("for reference");
    expect(html).toContain("It does not change the allofmycareer reading or scores.");
    expect(render(true, { status: "available", advisory } as JevResult, "ko")).toContain("참고용");
  });
  it("is absent from the dashboard and the report, and from the simulator until JEV answers", () => {
    const s = scenarioFor("entrepreneurship", "en");
    expect(coreOutput(s)).not.toMatch(/v2-jev|JEV/);
    for (const file of ["V2Dashboard.tsx", "V2Report.tsx"])
      expect(read(`client/src/components/${file}`)).not.toMatch(/jev/i);
  });
});
