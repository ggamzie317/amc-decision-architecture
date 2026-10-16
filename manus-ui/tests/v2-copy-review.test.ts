import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { v2CustomerPosture } from "../client/src/data/v2ReportPresentation";
import { v2t } from "../client/src/data/v2Language";

// Owner-approved wording review 2026-10-16 (docs/copy-review-2026-10-16.md):
// the reading is a conditional structural reading, never an action command,
// and the notices must match what the app does.

const root = path.resolve(import.meta.dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

describe("reading names are states, not commands (W1, W2)", () => {
  it.each([
    ["ko", "보존하며 검증", "옮기기 전에 확인이 더 필요함"],
    ["ko", "기반을 보호하며 재구성", "안전 여유를 지키며 경로 조정"],
    ["ko", "더 강해진 전환 근거", "옮겨 갈 근거가 더 강해짐"],
    ["en", "Preserve and Validate", "More to confirm before a move"],
    ["en", "Protect and Reconfigure", "Adjusting the path while protecting your margin"],
    ["en", "Stronger Transition Case", "A stronger case for moving"],
  ] as const)("%s %s → %s", (language, engine, customer) => {
    expect(v2CustomerPosture(language, engine, "", "A", "B").label).toBe(customer);
  });

  it("no customer surface keeps the old directive names", () => {
    const files = [
      "client/src/data/v2ReportPresentation.ts",
      "client/src/components/V2ScenarioExplain.tsx",
      "client/src/data/v2Readings.ts",
      "client/src/trace/traceSchema.ts",
      "client/src/data/amcProductApplicationV3.ts",
      "client/src/data/amcV2Analysis.ts",
      "client/src/components/V2Dashboard.tsx",
      "client/src/components/V2Report.tsx",
    ].map(read).join("\n");
    for (const old of [
      "현재 계획 유지",
      "Keep the current plan",
      "keep the current plan",
      "현재 계획을 유지",
      "Adjust the path while",
      "가장 잘 맞는 움직임",
      "Which move fits",
      "keep moving in stages",
      "keep more of your footing",
      "Keep your current role as your base",
      "Stay in your current role",
      "Hold off on a fixed move date",
      "Do not fix a date first",
      "Keep the goal, change how you get there",
      "검토하세요.`",
    ]) expect(files).not.toContain(old);
  });
});

describe("notices match what the app does (N1–N4)", () => {
  it("does not claim the search uses the target only, or that sources never change a level", () => {
    const text = [read("client/src/pages/AmcInteractiveV2.tsx"), read("client/src/components/V2Processing.tsx")].join("\n");
    expect(text).not.toContain("검색 대상만");
    expect(text).not.toMatch(/target only|Only the search target is used/);
    expect(text).not.toContain("출처는 점수를 바꾸지 않습니다");
    expect(text).not.toContain("Sources do not change scores");
    expect(text).toContain("확인된 출처는 ‘시장 근거’ 단계에만 반영되고");
  });

  it("says when the search runs, in both languages", () => {
    expect(v2t("ko", "privacy")).toContain("‘공개 자료를 찾아 분석하기’를 누를 때만 실행합니다");
    expect(v2t("en", "privacy")).toContain("‘Search public sources and analyze’");
  });

  it("the evidence disclosure says the same thing in KO and EN", () => {
    expect(v2t("ko", "evidenceDisclosure")).toContain("공개된 직무·기관·산업 키워드");
    expect(v2t("en", "evidenceDisclosure")).toContain("public role, institution or industry keywords");
  });
});

describe("search instructions (W11)", () => {
  it("tells the provider not to direct the career decision", () => {
    const service = read("server/externalIntelligenceV2Service.ts");
    expect(service).toContain("never about whether to stay, leave, move, apply, enroll, start, quit or give up");
    expect(service).toContain("must not tell the person to keep, leave, switch to, proceed with or give up a career option");
    expect(service).not.toContain("polite form (~합니다/~하세요)");
  });
});
