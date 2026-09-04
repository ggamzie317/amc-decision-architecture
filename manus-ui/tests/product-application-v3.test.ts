import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  AMC_ANALYSIS_SEQUENCE,
  buildProductApplicationV3,
  type ProductApplicationBuildInput,
} from "../client/src/data/amcProductApplicationV3";
import {
  AMC_FRAMEWORK_VERSION,
  AMC_PRODUCT_VERSION,
} from "../server/founderOpsTypes";

const input = (answers: Record<number, string> = {}): ProductApplicationBuildInput => ({
  language: "en",
  caseType: "Entrepreneurship",
  optionA: "current role",
  optionB: "advisory practice",
  answers,
  missingPoint: "The stated choice hides an unvalidated demand assumption.",
  missingPointWhy: "Without buyer evidence, the transition case cannot carry its exposure.",
  changingMove: "Package the existing government-project experience into one advisory pilot and test it with real buyers.",
  primaryRisk: "Premature conversion",
  primaryRiskMeaning: "Income and credibility could be exposed before demand is established.",
  decisionConditions: [
    "Three relevant buyers confirm the problem is urgent enough to fund.",
    "A repeatable pilot can be delivered inside the protected weekly time boundary.",
    "The current role stops providing sufficient runway for a bounded test.",
  ],
  validationFocus: "Whether relevant buyers will commit time or budget to a pilot.",
  externalImplication: "Current market evidence supports a bounded test, but not full conversion.",
  plan: [
    { period: "30 days", title: "Frame", action: "Interview relevant buyers.", output: "A documented demand pattern." },
    { period: "60 days", title: "Test", action: "Run one bounded pilot.", output: "Observed delivery and buyer evidence." },
    { period: "90 days", title: "Reassess", action: "Compare evidence with the switches.", output: "A refreshed structural posture." },
  ],
});

describe("AMC Product Application Layer V3", () => {
  it("keeps the internal analysis structure-first and earns posture after FIFWM and the missing point", () => {
    expect(AMC_ANALYSIS_SEQUENCE).toEqual([
      "User Input",
      "Live External Evidence",
      "FIFWM / Decision Structure",
      "What You May Be Missing",
      "Current Structural Posture",
      "Changing",
      "Safety Margin",
      "Decision Switches",
      "Next Experiment",
    ]);
    const result = buildProductApplicationV3(input());
    expect(result.fifwm.insideReality).toBeTruthy();
    expect(result.fifwm.outsideEvidence).toContain("market evidence");
    expect(result.missingPoint).toContain("unvalidated demand");
    expect(result.currentStructuralPosture.sentence).toContain("better supports");
    expect(result.currentStructuralPosture.sentence).not.toMatch(/\b(should|choose|recommend|wins?)\b/i);
    expect(result.currentStructuralPosture.sentence).not.toMatch(/both options|advantages and disadvantages/i);
  });

  it("limits why, exposes uncertainty, and creates only a justified case-specific Changing Play", () => {
    const result = buildProductApplicationV3(input());
    expect(result.why.topDrivers).toHaveLength(3);
    expect(result.why.biggestRisk).toContain("Premature conversion");
    expect(result.why.strongestCounterargument).toBeTruthy();
    expect(result.changingPlays).toHaveLength(1);
    expect(result.changingPlays[0].move).toContain("government-project experience");
    expect(result.changingPlays[0].move).not.toContain("Option C");
  });

  it("lets validated evidence strengthen transition and lets Safety Margin enable experimentation", () => {
    const result = buildProductApplicationV3(input({
      14: "Three paid pilots validated strong demand.",
      17: "Delivery is ready and repeatable.",
      19: "Eighteen months of runway is secured.",
      20: "A credible re-entry path is confirmed.",
      21: "Exposure is limited to protected evenings and the pilot budget.",
    }));
    expect(result.currentStructuralPosture.label).toBe("Stronger Transition Case");
    expect(result.currentStructuralPosture.sentence).toContain("in stages");
    expect(result.safetyMargin.reading).toContain("enables bounded experimentation");
    expect(result.safetyMargin.roomToBeWrong).toContain("runway");
  });

  it("connects observable switches and experiment continuation, pause, and reassessment to one posture", () => {
    const result = buildProductApplicationV3(input());
    expect(result.decisionSwitches).toHaveLength(3);
    expect(result.decisionSwitches.every((item) => item.signal && item.direction)).toBe(true);
    expect(result.nextStepExperiment.continueCondition).toBe(result.decisionSwitches[0].signal);
    expect(result.nextStepExperiment.pauseCondition).toContain("Pause or redesign");
    expect(result.nextStepExperiment.reassessAt).toContain("Current Structural Posture");
  });

  it("uses one intelligence object for dashboard and detailed report and redirects legacy product routes", () => {
    const root = path.basename(process.cwd()) === "manus-ui" ? path.resolve(process.cwd(), "..") : path.resolve(process.cwd());
    const page = fs.readFileSync(path.join(root, "manus-ui/client/src/pages/AmcWebMvp.tsx"), "utf8");
    const app = fs.readFileSync(path.join(root, "manus-ui/client/src/App.tsx"), "utf8");
    expect(page.match(/<ProductApplicationSections intelligence=\{productApplicationV3\}/g)).toHaveLength(2);
    expect(page).toContain("buildProductApplicationV3");
    for (const route of ["/intake", "/format-handoff", "/payment-handoff", "/payment-success"]) {
      expect(app).toContain(`path={"${route}"} component={LegacyProductRedirect}`);
    }
    expect(app).not.toMatch(/import .*?(Intake|FormatHandoff|PaymentHandoff|PaymentSuccess)/);
    expect(page).not.toContain("Payment is not active");
    expect([...page.matchAll(/\bid:\s*(\d+),/g)].map((match) => Number(match[1])).filter((id) => id >= 1 && id <= 29)).toEqual(
      Array.from({ length: 29 }, (_, index) => index + 1),
    );
    for (const file of [
      "manus-ui/client/src/pages/Intake.tsx",
      "manus-ui/client/src/pages/FormatHandoff.tsx",
      "manus-ui/client/src/pages/PaymentHandoff.tsx",
      "manus-ui/client/src/pages/PaymentSuccess.tsx",
      "manus-ui/client/src/data/intakeHandoff.ts",
      "prompts/amc_chatbot_system_prompt_v1.txt",
      "prompts/amc_chatbot_fallbacks_v1.json",
    ]) {
      expect(fs.existsSync(path.join(root, file))).toBe(false);
    }
  });

  it("stamps only new records with V3 versions", () => {
    expect(AMC_PRODUCT_VERSION).toBe("AMC-LAUNCH-V3");
    expect(AMC_FRAMEWORK_VERSION).toBe("FIFWM-SM-V2");
  });
});
