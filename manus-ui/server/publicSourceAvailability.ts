import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";

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
type SourceResponse = { status: number; location?: string };
type ProbeDependencies = {
  resolve?: (hostname: string) => Promise<Address[]>;
  headers?: (
    url: URL,
    address: Address,
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

async function pinnedAddress(
  url: URL,
  signal: AbortSignal,
  resolve: NonNullable<ProbeDependencies["resolve"]>
): Promise<Address | null> {
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
      ? { address: hostname, family: literal as 4 | 6 }
      : null;
  const answers = await Promise.race([
    resolve(hostname),
    new Promise<null>(done =>
      signal.addEventListener("abort", () => done(null), { once: true })
    ),
  ]);
  if (!answers || signal.aborted) return null;
  if (!answers.length || answers.some(answer => !publicAddress(answer.address)))
    return null;
  return answers[0] as Address;
}

function responseHeaders(
  url: URL,
  address: Address,
  signal: AbortSignal
): Promise<SourceResponse> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "GET",
        signal,
        timeout: 3_500,
        headers: {
          Accept: "text/html,application/pdf,application/xhtml+xml,*/*;q=0.1",
          Range: "bytes=0-0",
          "User-Agent": "AMC-Evidence-Source-Check/1.0",
        },
        // Reuse the already validated address; a second DNS lookup could resolve privately.
        lookup: pinnedSourceLookup(address),
      },
      response => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        response.destroy(); // No source body is read or retained.
        resolve({ status, ...(location ? { location } : {}) });
      }
    );
    req.on("timeout", () => req.destroy(new Error("source timeout")));
    req.on("error", reject);
    req.end();
  });
}

/** Node may request either a scalar or an all-address DNS callback. */
export function pinnedSourceLookup(address: Address): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all)
      callback(null, [
        { address: address.address, family: address.family },
      ] as never);
    else callback(null, address.address, address.family);
  };
}

/** Availability only: this cannot establish whether the page supports a claim. */
export async function publicSourceAvailable(
  sourceUrl: string,
  parentSignal: AbortSignal,
  dependencies: ProbeDependencies = {}
): Promise<boolean> {
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
      if (signal.aborted) return false;
      const address = await pinnedAddress(url, signal, resolve);
      if (!address || signal.aborted) return false;
      const response = await headers(url, address, signal);
      if (response.status >= 200 && response.status < 300) return true;
      if (
        response.status < 300 ||
        response.status >= 400 ||
        !response.location ||
        redirect === 3
      )
        return false;
      url = new URL(response.location, url);
    }
  } catch {
    // DNS, TLS, timeout, denied destination, and definitive HTTP failures fail closed.
  }
  return false;
}
