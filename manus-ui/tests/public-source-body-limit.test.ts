import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:https";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probePublicSource, responseHeaders } from "../server/publicSourceAvailability";

describe("public source bounded HTTPS body reader", () => {
  let server: Server;
  let port: number;
  let certificate: string;
  let directory: string;
  const gate = '<html><script>alertHistory("source unavailable")</script></html>';
  const padded = (length: number) => gate.padEnd(length, " ");

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "amc-source-tls-"));
    const key = join(directory, "key.pem");
    const cert = join(directory, "cert.pem");
    execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key,
      "-out", cert, "-subj", "/CN=source.example", "-addext", "subjectAltName=DNS:source.example",
      "-days", "1"], { stdio: "ignore" });
    certificate = readFileSync(cert, "utf8");
    server = createServer({ key: readFileSync(key), cert: certificate }, (request, response) => {
      const path = request.url ?? "";
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      if (path === "/short") response.end(padded(108));
      else if (path === "/limit") response.end(padded(4096));
      else if (path === "/one-chunk") response.end(padded(5108));
      else if (path === "/many-chunks") {
        const html = padded(5108);
        for (let index = 0; index < html.length; index += 300) response.write(html.slice(index, index + 300));
        response.end();
      } else if (path === "/normal") response.end('<html><body><article>Public source</article></body></html>'.padEnd(12000, "x"));
      else if (path === "/pricing-gate") response.end('<html><head><title>Plans and Pricing</title></head><body><main>Subscription options</main></body></html>'.padEnd(5108, " "));
      else if (path === "/interrupted") {
        response.write("<html><script>");
        response.destroy();
      } else if (path === "/timeout") response.write("<html>");
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test TLS port");
    port = address.port;
  });
  afterAll(async () => {
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    if (directory) rmSync(directory, { recursive: true, force: true });
  });
  const read = (path: string, signal = new AbortController().signal) =>
    responseHeaders(new URL(`https://source.example:${port}${path}`),
      { address: "127.0.0.1", family: 4 }, signal, certificate);
  const probe = (path: string) => probePublicSource("https://source.example/check", new AbortController().signal, {
    resolve: async () => [{ address: "8.8.8.8", family: 4 }],
    headers: (_url, _address, signal) => read(path, signal),
  });

  it.each(["short", "limit", "one-chunk", "many-chunks"])("rejects %s gate through the real TLS body path", async path => {
    expect(await read(`/${path}`)).toEqual({ status: 200, contentGate: true });
    expect(await probe(`/${path}`)).toEqual({ available: false, category: "content_gate" });
  });

  it("accepts a large normal HTML document after inspecting its bounded prefix", async () => {
    expect(await read("/normal")).toEqual({ status: 200, contentGate: false });
    expect(await probe("/normal")).toEqual({ available: true });
  });

  it("rejects a deep citation served as an HTTP-200 pricing page through the real TLS reader", async () => {
    expect(await read("/pricing-gate")).toEqual({ status: 200, contentGate: true });
    expect(await probe("/pricing-gate")).toEqual({ available: false, category: "content_gate" });
  });

  it("fails closed on an interrupted body or abort", async () => {
    await expect(read("/interrupted")).rejects.toThrow();
    const controller = new AbortController();
    const pending = read("/timeout", controller.signal);
    controller.abort();
    await expect(pending).rejects.toThrow();
  });
});
