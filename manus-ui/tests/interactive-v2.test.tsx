import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { buildProductApplicationV3 } from "../client/src/data/amcProductApplicationV3";
import {
  evaluateScenario,
  scenarioVariables,
} from "../client/src/data/amcScenario";
import {
  buildV2Input,
  buildV2Sensitivity,
  initialV2State,
  v2Choices,
  v2ExternalOptions,
  v2ModuleKeys,
  v2SwitchCandidates,
  V2_EXPERIENCE,
  V2_SCHEMA,
} from "../client/src/data/amcV2Model";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import {
  customerEvidence,
  unavailableIntelligence,
} from "../client/src/data/externalIntelligenceV2";
import { v2t, v2CaseLabel, v2FamilyLabel } from "../client/src/data/v2Language";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import { lowDensityPages } from "../client/src/data/amcV2ReportDensity";
import AmcInteractiveV2 from "../client/src/pages/AmcInteractiveV2";
import {
  caseTypes,
  completedInteractive,
  isInteractive,
  projectInteractivePatch,
  v2Identity,
} from "../shared/interactivePrivacy";
import { MemoryFounderOpsStore } from "../server/founderOpsStore";
import { trackFounderOps } from "../server/founderOpsApi";
import { buildOperationsSummary } from "../server/founderOpsAnalytics";
(globalThis as any).React = React;
const root =
  path.basename(process.cwd()) === "manus-ui"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

describe("AMC interactive V2 experience", () => {
  it("has eight guided modules, exactly three required prose fields and nine existing case families", () => {
    expect(v2ModuleKeys).toHaveLength(8);
    expect(new Set(v2ModuleKeys).size).toBe(8);
    expect(caseTypes).toHaveLength(9);
    const html = renderToStaticMarkup(React.createElement(AmcInteractiveV2));
    expect(html.match(/ required=""/g) || []).toHaveLength(3);
    expect(html).toContain("Decision Setup");
    expect(html).not.toContain("15 questions");
  });
  it("keeps case-relevant external choices and central Korean vocabulary", () => {
    expect(v2ExternalOptions("Entrepreneurship")).toEqual(
      v2Choices.entrepreneurExternal
    );
    expect(v2ExternalOptions("MBA / EMBA / PhD Decision")).toEqual(
      v2Choices.educationExternal
    );
    expect(v2ExternalOptions("Industry Transition")).toEqual(
      v2Choices.careerExternal
    );
    expect(v2t("ko", "posture")).toBe("현재 구조 판단");
    expect(v2t("ko", "missing")).toBe("놓치고 있는 핵심 변수");
    expect(v2t("ko", "scenarioPlausibility")).toBe("시나리오 현실성");
    expect(v2CaseLabel("ko", "Entrepreneurship")).toBe("창업");
    expect(v2FamilyLabel("ko", "resource")).toBe("자원 조정");
  });
  it("maps selected bands to the unchanged core contract without scoring prose", () => {
    const state = initialV2State();
    state.decision = "Private decision sentence";
    state.optionA = "A";
    state.optionB = "B";
    state.bands = {
      internalReadiness: "developing",
      financialRoom: "weak",
      reversibility: "strong",
      downsideExposure: "high",
      optionBSupport: "developing",
      constraintLoad: "heavy",
    };
    state.optionalNote = "I feel ready";
    const input = buildV2Input(state);
    expect(input.structuralSignals.internalReadiness.band).toBe("developing");
    expect(input.safetyMarginInputs.financialRoom.band).toBe("weak");
    expect(input.safetyMarginInputs.reversibility.band).toBe("strong");
    expect(input.safetyMarginInputs.downsideExposure.band).toBe("high");
    expect(input.structuralSignals.optionBSupport.band).toBe("developing");
    expect(input.structuralSignals.constraintLoad.band).toBe("heavy");
    expect(input.structuralSignals.externalValidation.band).toBe("unknown");
    expect(JSON.stringify(input.structuralSignals)).not.toContain(
      "I feel ready"
    );
    expect(buildProductApplicationV3(input).safetyMargin.band).toBeDefined();
  });
  it("keeps normal external intelligence unavailable with no template market claims", () => {
    const state = initialV2State();
    const input = buildV2Input(state),
      core = buildProductApplicationV3(input);
    const intelligence = unavailableIntelligence(
      state.caseType,
      state.language
    );
    const html = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state,
        core,
        intelligence,
        onReport: () => {},
      })
    );
    expect(intelligence.status).toBe("unavailable");
    expect(intelligence.evidenceBlocks).toEqual([]);
    expect(html).toContain("Current external evidence is not verified.");
    expect(html).not.toContain("Pilot interest appears uneven");
    expect(html).not.toContain("DEMO DATA");
  });
  it("gates synthetic evidence behind explicit demo mode and provenance", () => {
    const fixture = v2DemoFixture("entrepreneurship", "en");
    expect(fixture.intelligence.status).toBe("demo");
    expect(customerEvidence(fixture.intelligence, false).status).toBe(
      "unavailable"
    );
    expect(customerEvidence(fixture.intelligence, true).status).toBe("demo");
    expect(
      fixture.intelligence.evidenceBlocks.every(
        b => b.provenance === "EXTERNAL_EVIDENCE" && b.sourceLabel.length > 0
      )
    ).toBe(true);
    expect(fixture.intelligence.metrics).toEqual([]);
    const html = renderToStaticMarkup(
      React.createElement(V2Dashboard, {
        state: fixture.state,
        core: fixture.baseline,
        intelligence: fixture.intelligence,
        onReport: () => {},
      })
    );
    expect(html).toContain("DEMO DATA — NOT LIVE EVIDENCE");
    expect(html).toContain("Synthetic scenario fixture");
    expect(html).toContain('data-provenance="EXTERNAL_EVIDENCE"');
  });
  it("creates two complete demo fixtures with baseline, scenario and all seven sensitivity variables", () => {
    for (const kind of ["entrepreneurship", "industry"] as const) {
      const fixture = v2DemoFixture(kind, "ko");
      expect(fixture.state.decision).not.toBe("");
      expect(fixture.baseline.currentStructuralPosture.label).not.toBe("");
      expect(fixture.scenario.currentStructuralPosture.label).not.toBe("");
      expect(new Set(fixture.sensitivity.map(row => row.variable))).toEqual(
        new Set(scenarioVariables)
      );
      expect(fixture.sensitivity).toHaveLength(21);
    }
  });
  it("evaluates each sensitivity cell with the same deterministic scenario engine", () => {
    const f = v2DemoFixture("entrepreneurship", "en");
    const matrix = buildV2Sensitivity(f.input, f.baseline);
    for (const row of matrix) {
      const output = evaluateScenario(f.input, { [row.variable]: row.band });
      expect(row.scenario.currentStructuralPosture.label).toBe(
        output.currentStructuralPosture.label
      );
      expect(row.posture).toBe(
        output.currentStructuralPosture.label !==
          f.baseline.currentStructuralPosture.label
      );
      expect(row.safety).toBe(
        output.safetyMargin.band !== f.baseline.safetyMargin.band
      );
      expect(row.nextTest).toBe(
        output.nextStepExperiment.whatToTest !==
          f.baseline.nextStepExperiment.whatToTest
      );
    }
  });
  it("generates bounded decision switches from structured state, without optional prose", () => {
    const f = v2DemoFixture("industry", "en");
    const switches = v2SwitchCandidates(f.state, f.intelligence);
    expect(switches.length).toBeGreaterThanOrEqual(4);
    expect(switches.length).toBeLessThanOrEqual(6);
    expect(
      switches.every(
        sw =>
          sw.provenance === "DERIVED_CORE_RULE" && ["A", "B"].includes(sw.side)
      )
    ).toBe(true);
    expect(new Set(switches.map(sw => sw.side))).toEqual(new Set(["A", "B"]));
    expect(buildV2Input(f.state).decisionConditions).toHaveLength(3);
  });
  it("builds eight normal report sections and a ninth explicitly synthetic source page in demo", () => {
    const f = v2DemoFixture("industry", "en");
    const normal = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: f.state,
        input: f.input,
        core: f.baseline,
        intelligence: unavailableIntelligence(f.state.caseType, "en"),
        onClose: () => {},
        onPrint: () => {},
      })
    );
    const demo = renderToStaticMarkup(
      React.createElement(V2Report, {
        state: f.state,
        input: f.input,
        core: f.baseline,
        intelligence: f.intelligence,
        onClose: () => {},
        onPrint: () => {},
      })
    );
    expect(normal.match(/class="v2-paper-page"/g) || []).toHaveLength(8);
    expect(demo.match(/class="v2-paper-page"/g) || []).toHaveLength(9);
    expect(normal).not.toContain("Synthetic scenario fixture");
    expect(demo).toContain("DEMO DATA — NOT LIVE EVIDENCE");
  });
  it("projects V2 founder data to bounded structural fields, dropping private prose", () => {
    const patch = projectInteractivePatch({
      language: "en",
      caseType: "Entrepreneurship",
      fullIntakeCompletedAt: new Date().toISOString(),
      answersJson: { 1: "Secret written answer" },
      missingPoint: "Private concern",
      structuralOutputJson: {
        ...v2Identity,
        baselineBands: { financialRoom: "strong" },
        currentStructuralPosture: { label: "Preserve and Validate" },
        safetyMargin: { band: "strong" },
        changingPlays: [{ family: "resource" }],
        externalEvidenceStatus: "unavailable",
        raw: "Secret written answer",
      },
    });
    expect(patch.structuralOutputJson).toMatchObject({
      ...v2Identity,
      completedIntakeQuestionCount: 8,
      externalEvidenceStatus: "unavailable",
    });
    expect(patch.answersJson).toEqual({});
    expect(JSON.stringify(patch)).not.toContain("Secret written answer");
    expect(JSON.stringify(patch)).not.toContain("Private concern");
    expect(isInteractive(patch.structuralOutputJson)).toBe(true);
    expect(completedInteractive(patch.structuralOutputJson)).toBe(true);
    expect(V2_EXPERIENCE).toBe(v2Identity.experienceVersion);
    expect(V2_SCHEMA).toBe(v2Identity.intakeSchemaVersion);
  });
  it("enforces V2 privacy again on the server even if an event includes raw prose", async () => {
    const store = new MemoryFounderOpsStore();
    const result = await trackFounderOps(
      {
        language: "ko",
        serviceStorageConsent: true,
        eventType: "preview_started",
        newSubmission: true,
        metadata: v2Identity,
        patch: {
          caseType: "Entrepreneurship",
          answersJson: { 1: "PRIVATE PROSE" },
          missingPoint: "PRIVATE PROSE",
          structuralOutputJson: {
            ...v2Identity,
            raw: "PRIVATE PROSE",
            externalEvidenceStatus: "unavailable",
          },
        },
      },
      store
    );
    const detail = await store.getSubmission(result.submissionId!);
    expect(detail?.submission.answersJson).toEqual({});
    expect(detail?.submission.structuralOutputJson).toMatchObject({
      ...v2Identity,
      externalEvidenceStatus: "unavailable",
    });
    expect(JSON.stringify(detail)).not.toContain("PRIVATE PROSE");
  });
  it("keeps separate legacy, V1 and V2 founder funnels", async () => {
    const store = new MemoryFounderOpsStore();
    const ids = [] as string[];
    for (const identity of [
      { experienceVersion: "legacy" },
      {
        experienceVersion: "interactive-v1",
        intakeSchemaVersion: "AMC-INTAKE-V4-15",
      },
      v2Identity,
    ]) {
      const result = await trackFounderOps(
        {
          language: "en",
          serviceStorageConsent: true,
          eventType: "preview_started",
          newSubmission: true,
          metadata: identity,
          patch: { structuralOutputJson: identity },
        },
        store
      );
      ids.push(result.submissionId!);
      await trackFounderOps(
        {
          submissionId: result.submissionId,
          language: "en",
          serviceStorageConsent: true,
          eventType: "dashboard_generated",
          metadata: identity,
          patch: { structuralOutputJson: identity },
        },
        store
      );
    }
    const records = await Promise.all(ids.map(id => store.getSubmission(id)));
    const summary = buildOperationsSummary(
      records.map(x => x!.submission),
      records.flatMap(x => x!.events)
    );
    expect(summary.experienceDistribution).toMatchObject({
      legacy: 1,
      "interactive-v1": 1,
      "interactive-v2": 1,
    });
    for (const experience of ["legacy", "interactive-v1", "interactive-v2"])
      expect(summary.experienceFunnels[experience].dashboard_generated).toBe(1);
  });
  it("flags intentionally sparse report pages in print QA", () => {
    expect(
      lowDensityPages([
        { page: 1, occupied: 90, available: 600, ratio: 0.15 },
        { page: 2, occupied: 450, available: 600, ratio: 0.75 },
      ]).map(p => p.page)
    ).toEqual([1]);
  });
  it("keeps legacy and V1 routes and protected core files unchanged by V2 imports", () => {
    const app = fs.readFileSync(
      path.join(root, "manus-ui/client/src/App.tsx"),
      "utf8"
    );
    expect(app).toContain('path={"/amc-web-mvp"}');
    expect(app).toContain('path="/amc-interactive-v1"');
    expect(app).toContain('path="/amc-interactive-v2"');
    const page = fs.readFileSync(
      path.join(root, "manus-ui/client/src/pages/AmcInteractiveV2.tsx"),
      "utf8"
    );
    expect(page).not.toContain("/api/amc/jev-scenario");
    expect(page).not.toContain("/api/amc/external");
  });
});
