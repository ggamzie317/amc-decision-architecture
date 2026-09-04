import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
const pagePath = path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx");
const fixturePath = path.join(root, "manus-ui/client/src/data/reportPayload.json");
const publicAssetsPath = path.join(root, "manus-ui/dist/public/assets");

function filesBelow(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

function markerId(key: string) {
  return createHash("sha256").update(key).digest("hex").slice(0, 12);
}

describe("AMC public bundle privacy gate", () => {
  it("keeps historical report fixtures out of the live customer runtime", () => {
    const source = fs.readFileSync(pagePath, "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*(?:reportPayload|rawResponse)[^"']*["']/i);
  });

  it("contains no known raw historical response markers in built public assets", () => {
    expect(fs.existsSync(publicAssetsPath), "Build the production frontend before running the privacy gate.").toBe(true);
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    const sensitiveKeys = [
      "Full_Name",
      "2. Email address",
      "Q27_raw",
      "Q28_raw",
      "6. What is the main career decision you are considering right now? \n(Paragraph)",
      "11. In your own words, what is your #1 non‑negotiable in this decision? \n(Paragraph, 2–4 sentences)",
    ];
    const markers = sensitiveKeys
      .map((key) => ({ id: markerId(key), value: fixture[key] }))
      .filter((marker): marker is { id: string; value: string } => typeof marker.value === "string" && marker.value.length >= 6);
    expect(markers.length).toBeGreaterThan(0);

    const bundle = filesBelow(publicAssetsPath)
      .filter((file) => /\.(?:js|css|html)$/i.test(file))
      .map((file) => fs.readFileSync(file, "utf8"))
      .join("\n");
    const leakedMarkerIds = markers.filter((marker) => bundle.includes(marker.value)).map((marker) => marker.id);
    expect(leakedMarkerIds, "Public assets contain one or more hashed historical-fixture markers.").toEqual([]);
  });
});
