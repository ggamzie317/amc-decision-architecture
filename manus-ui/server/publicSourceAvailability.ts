import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP, type LookupFunction, type TcpNetConnectOpts } from "node:net";
import type { v2SourceFailures } from "../shared/v2EvidenceProtocol.js";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(address, prefix, "ipv4");
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const)
  blocked.addSubnet(address, prefix, "ipv6");

type Address = { address: string; family: 4 | 6 };
type PinnedAddresses = Address | readonly Address[];
// HTTPS forwards these socket options; older RequestOptions typings omit them.
const addressSelection: Pick<TcpNetConnectOpts, "autoSelectFamily" | "autoSelectFamilyAttemptTimeout"> = {
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 250,
};
type SourceResponse = { status: number; location?: string; contentGate?: boolean };
export type SourceProbeFailure = (typeof v2SourceFailures)[number];
export type SourceProbeResult = { available: true } | { available: false; category: SourceProbeFailure };
type ProbeDependencies = {
  resolve?: (hostname: string) => Promise<Address[]>;
  headers?: (
    url: URL,
    addresses: PinnedAddresses,
    signal: AbortSignal
  ) => Promise<SourceResponse>;
};

function publicAddress(address: string): boolean {
  const family = isIP(address);
  return (
    family !== 0 &&
    !address.toLowerCase().startsWith("::ffff:") &&
    !blocked.check(address, family === 4 ? "ipv4" : "ipv6")
  );
}

async function pinnedAddresses(
  url: URL,
  signal: AbortSignal,
  resolve: NonNullable<ProbeDependencies["resolve"]>
): Promise<readonly Address[] | null> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    url.username ||
    url.password ||
    !hostname ||
    /(^|\.)(localhost|local|internal|test|invalid|onion)$/.test(hostname)
  )
    return null;
  const literal = isIP(hostname);
  if (literal)
    return publicAddress(hostname)
      ? [{ address: hostname, family: literal as 4 | 6 }]
      : null;
  let onAbort: () => void = () => {};
  let answers: Address[] | null;
  try {
    answers = await Promise.race([
      resolve(hostname),
      new Promise<null>(done => {
        onAbort = () => done(null);
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted) onAbort();
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
  if (!answers || signal.aborted) return null;
  // Validate the entire set before dialing any address, including alternatives.
  if (!answers.length || answers.some(answer =>
    isIP(answer.address) !== answer.family || !publicAddress(answer.address)))
    return null;
  return answers;
}

export function responseHeaders(
  url: URL,
  addresses: PinnedAddresses,
  signal: AbortSignal,
  // A test-only trust anchor lets the bounded reader run against a local TLS server.
  ca?: string
): Promise<SourceResponse> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "GET",
        // A proxy/global pooled agent may resolve the hostname again and ignore
        // our pinned lookup. Each check must use only the validated destinations.
        agent: false,
        ...addressSelection,
        signal,
        timeout: 3_500,
        headers: {
          Accept: "text/html,application/pdf,application/xhtml+xml,*/*;q=0.1",
          Range: "bytes=0-4095",
          "User-Agent": "AMC-Evidence-Source-Check/1.0",
        },
        // Node can try the other validated addresses if one family is unreachable.
        // This is transport fallback, not another HTTP/provider request.
        lookup: pinnedSourceLookup(addresses),
        ...(ca ? { ca } : {}),
      },
      response => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        const base = { status, ...(location ? { location } : {}) };
        if (status < 200 || status >= 300 ||
            !String(response.headers["content-type"] ?? "").includes("text/html")) {
          response.destroy();
          resolve(base);
          return;
        }
        // Some sources return HTTP 200 with only a script that alerts and
        // navigates away. Read at most 4 KiB in memory to reject that gate;
        // never retain or log the public response body.
        const chunks: Buffer[] = [];
        let bytes = 0;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve({
            ...base,
            contentGate: sourceHtmlLooksUnavailable(Buffer.concat(chunks, bytes).toString("utf8"), url),
          });
        };
        response.on("data", (chunk: Buffer) => {
          if (settled) return;
          const prefix = chunk.subarray(0, 4096 - bytes);
          if (prefix.length) chunks.push(prefix);
          bytes += prefix.length;
          if (bytes === 4096) {
            // Inspect the retained prefix even when Range is ignored or one
            // network chunk crosses the cap. Never keep the remainder.
            finish();
            response.destroy();
          }
        });
        response.on("end", finish);
        response.on("aborted", () => {
          if (!settled) reject(new Error("source response aborted"));
          settled = true;
        });
        response.on("error", error => {
          if (!settled) reject(error);
          settled = true;
        });
        response.on("close", () => {
          if (!settled) reject(new Error("source response closed before completion"));
          settled = true;
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("source timeout")));
    req.on("error", reject);
    req.end();
  });
}

export function sourceHtmlLooksUnavailable(html: string, requestedUrl?: URL): boolean {
  const title = html.match(/<title\b[^>]*>([^<]{1,160})<\/title>/i)?.[1]
    ?.replace(/&amp;/gi, "&").trim() ?? "";
  // A deep citation that returns a generic sales/authentication page with
  // HTTP 200 does not expose the cited text, even if that page has a body.
  if (requestedUrl &&
      !/^\/(?:pricing|plans?|login|log-in|sign-?in|subscribe)(?:\/|$)/i.test(requestedUrl.pathname) &&
      /^(?:plans? (?:and|&) pricing|pricing plans?|sign[ -]?in|log[ -]?in|access denied|just a moment)(?:[.!\s|-]|$)/i.test(title))
    return true;
  return !/<(?:body|main|article)\b/i.test(html) &&
    /<script(?:\s|>)/i.test(html) &&
    /\b(?:alertHistory|alertpopclose(?:Reload|NewTab)?|alterloc)\s*\(\s*["'`]/i.test(html);
}

/** Node may request either a scalar or an all-address DNS callback. */
export function pinnedSourceLookup(pinned: PinnedAddresses): LookupFunction {
  const addresses = Array.isArray(pinned) ? pinned : [pinned as Address];
  return (_hostname, options, callback) => {
    if (options.all)
      callback(null, addresses.map(address => ({
        address: address.address, family: address.family,
      })) as never);
    else callback(null, addresses[0].address, addresses[0].family);
  };
}

/** Availability only: this cannot establish whether the page supports a claim.
 * Returns a category, never a URL, response body, or customer content. */
export async function probePublicSource(
  sourceUrl: string,
  parentSignal: AbortSignal,
  dependencies: ProbeDependencies = {}
): Promise<SourceProbeResult> {
  const signal = AbortSignal.any([parentSignal, AbortSignal.timeout(4_000)]);
  const resolve =
    dependencies.resolve ??
    (async (hostname: string) =>
      (await lookup(hostname, { all: true })).map(answer => ({
        address: answer.address,
        family: answer.family as 4 | 6,
      })));
  const headers = dependencies.headers ?? responseHeaders;
  try {
    let url = new URL(sourceUrl);
    for (let redirect = 0; redirect <= 3; redirect++) {
      if (signal.aborted) return { available: false, category: "timeout" };
      const addresses = await pinnedAddresses(url, signal, resolve);
      if (!addresses) return { available: false, category: signal.aborted ? "timeout" : "invalid_destination" };
      if (signal.aborted) return { available: false, category: "timeout" };
      const response = await headers(url, addresses, signal);
      if (response.contentGate) return { available: false, category: "content_gate" };
      if (response.status >= 200 && response.status < 300) return { available: true };
      if (response.status === 401 || response.status === 403) return { available: false, category: "http_denied" };
      if (response.status === 404 || response.status === 410) return { available: false, category: "http_gone" };
      if (response.status === 405 || response.status === 416) return { available: false, category: "http_method" };
      if (
        response.status < 300 ||
        response.status >= 400
      )
        return { available: false, category: "http_other" };
      if (!response.location || redirect === 3)
        return { available: false, category: "redirect" };
      const next = new URL(response.location, url);
      // A deep citation redirected to a generic landing, login or sales page
      // no longer exposes the cited material, even if that page returns 200.
      const gate = /^\/(?:pricing|plans?|login|log-in|sign-?in|sign-?up|register|subscribe|upgrade|paywall)(?:\/|$)/i;
      if ((next.pathname === "/" && url.pathname !== "/") ||
          (gate.test(next.pathname) && !gate.test(url.pathname)))
        return { available: false, category: "redirect" };
      url = next;
    }
  } catch (error) {
    if (signal.aborted) return { available: false, category: "timeout" };
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (/^(ENOTFOUND|EAI_AGAIN|ENODATA|ESERVFAIL)$/.test(code))
      return { available: false, category: "dns" };
    if (/CERT|TLS|SSL|UNABLE_TO_VERIFY/i.test(code))
      return { available: false, category: "tls" };
    if (code === "ETIMEDOUT" || error instanceof Error && /timeout/i.test(error.message))
      return { available: false, category: "timeout" };
    if (error instanceof TypeError) return { available: false, category: "invalid_destination" };
    return { available: false, category: "network" };
  }
  return { available: false, category: "redirect" };
}

export async function publicSourceAvailable(
  sourceUrl: string,
  parentSignal: AbortSignal,
  dependencies: ProbeDependencies = {}
): Promise<boolean> {
  return (await probePublicSource(sourceUrl, parentSignal, dependencies)).available;
}
