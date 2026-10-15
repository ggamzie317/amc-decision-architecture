import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Vercel functions run as Node ESM: a runtime relative import must end in ".js".
 * A missing suffix crashed every evidence search in production (2026-10-15,
 * FUNCTION_INVOCATION_FAILED). This walks everything the API entry points load.
 */
const root = path.resolve(__dirname, "..");
function runtimeImports(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  const out: string[] = [];
  const re = /^\s*(import|export)\s+(?!type\b)([^;]*?)\s+from\s+["'](\.{1,2}\/[^"']+)["']/gm;
  for (const m of src.matchAll(re)) {
    // `import { type A, type B } from` is erased at runtime.
    const names = m[2].replace(/^\{|\}$/g, "");
    if (/^\{[^}]*\}$/.test(m[2].trim()) && names.split(",").every(n => /^\s*type\s/.test(n) || !n.trim())) continue;
    out.push(m[3]);
  }
  for (const m of src.matchAll(/import\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g)) out.push(m[1]);
  return out;
}
function resolve(from: string, spec: string) {
  const base = path.resolve(path.dirname(from), spec.replace(/\.js$/, ""));
  for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(base + ext)) return base + ext;
  return null;
}

describe("server code is loadable as Node ESM", () => {
  it("every runtime relative import reachable from api/ ends in .js", () => {
    const entries = fs.readdirSync(path.join(root, "api/amc"), { recursive: true } as never)
      .map(String).filter(f => f.endsWith(".ts")).map(f => path.join(root, "api/amc", f));
    const seen = new Set<string>(), problems: string[] = [];
    const visit = (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const spec of runtimeImports(file)) {
        if (!spec.endsWith(".js")) problems.push(`${path.relative(root, file)} → ${spec}`);
        const next = resolve(file, spec);
        if (next) visit(next);
      }
    };
    entries.forEach(visit);
    expect(problems).toEqual([]);
  });
});
