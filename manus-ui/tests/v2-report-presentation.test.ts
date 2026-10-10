import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import { baselineBands } from "../client/src/data/amcScenario";
import { selectV2SimulatorVariables } from "../client/src/data/amcV2SensitivityView";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import {
  prepareV2PrintTitle,
  v2EvidenceCheckedDate,
  v2LocalDate,
  v2ReportFileName,
  v2ReportSubject,
  v2SafeFileStem,
} from "../client/src/data/v2ReportPresentation";

afterEach(() => vi.unstubAllGlobals());
(globalThis as any).React = React;

describe("V2 report presentation", () => {
  it("uses the same customer-local evidence day at a UTC midnight boundary in EN and KO", () => {
    const checked = "2026-10-09T16:30:00.000Z";
    expect(v2EvidenceCheckedDate(checked, "en", "Asia/Shanghai")).toBe(
      "2026-10-10"
    );
    expect(v2EvidenceCheckedDate(checked, "ko", "Asia/Shanghai")).toBe(
      "2026-10-10"
    );
    expect(v2EvidenceCheckedDate(checked, "ko", "UTC")).toBe("2026-10-09");
    expect(v2LocalDate("2026-10-09T16:30:00.000Z", "Asia/Shanghai")).toBe(
      "2026-10-10"
    );
  });

  it("shows one evidence check day on the dashboard and report pages 3 and 9", () => {
    const priorTZ = process.env.TZ;
    process.env.TZ = "Asia/Shanghai";
    try {
      for (const language of ["en", "ko"] as const) {
        const fixture = v2DemoFixture("industry", language);
        const intelligence = {
          ...fixture.intelligence,
          status: "live" as const,
          generatedAt: "2026-10-09T16:30:00.000Z",
        };
        const variables = selectV2SimulatorVariables(
          fixture.sensitivity,
          baselineBands(fixture.input)
        );
        const dashboard = renderToStaticMarkup(
          React.createElement(V2Dashboard, {
            state: fixture.state,
            core: fixture.baseline,
            intelligence,
            evidencePhase: "live",
            onReport: () => {},
          })
        );
        const report = renderToStaticMarkup(
          React.createElement(V2Report, {
            state: fixture.state,
            input: fixture.input,
            core: fixture.baseline,
            sensitivity: fixture.sensitivity,
            visibleVariables: variables,
            intelligence,
            evidencePhase: "live",
            onClose: () => {},
            onPrint: () => {},
          })
        );
        expect(dashboard).toContain("2026-10-10");
        expect(report.match(/2026-10-10/g)?.length).toBeGreaterThanOrEqual(3);
        expect(report).not.toContain("2026-10-09T16:30");
      }
    } finally {
      if (priorTZ === undefined) delete process.env.TZ;
      else process.env.TZ = priorTZ;
    }
  });

  it("uses a fixed safe topic rather than names or private details from the inquiry", () => {
    const day = new Date("2026-10-10T09:00:00+08:00");
    expect(
      v2ReportFileName(
        "김민수의 Acme 창업, abc@example.com, 010-1234-5678",
        "Entrepreneurship",
        "ko",
        day
      )
    ).toBe("창업_검토_allofmycareer_2026-10-10.pdf");
    expect(
      v2ReportFileName(
        "Acme IT industry transition with a private salary",
        "Industry Transition",
        "ko",
        day
      )
    ).toBe("IT_산업_전환_allofmycareer_2026-10-10.pdf");
    expect(
      v2ReportFileName(
        "MBA application with family health details",
        "MBA / EMBA / PhD Decision",
        "ko",
        day
      )
    ).toBe("MBA_진학_allofmycareer_2026-10-10.pdf");
    expect(
      v2ReportFileName("Change jobs", "Industry Transition", "en", day)
    ).toBe("Career_Transition_allofmycareer_2026-10-10.pdf");
    expect(v2ReportSubject("private name", "unrecognized", "ko")).toBe(
      "결정_보고서"
    );
  });

  it("uses the customer's language for all three degree topics", () => {
    const day = new Date("2026-10-10T09:00:00+08:00");
    for (const [degree, english, korean] of [
      ["MBA", "MBA_Study", "MBA_진학"],
      ["EMBA", "EMBA_Study", "EMBA_진학"],
      ["PhD", "PhD_Study", "박사_진학"],
    ]) {
      for (const [language, subject] of [
        ["en", english],
        ["ko", korean],
      ] as const) {
        expect(
          v2ReportFileName(
            `${degree} application; private@example.com`,
            "MBA / EMBA / PhD Decision",
            language,
            day
          )
        ).toBe(`${subject}_allofmycareer_2026-10-10.pdf`);
      }
    }
  });

  it("keeps Korean but strips unsafe filename characters and overlong suffixes", () => {
    expect(v2SafeFileStem("  창업: 검토*/.  ")).toBe("창업_검토");
    expect(v2SafeFileStem("x".repeat(100))).toHaveLength(64);
    expect(v2SafeFileStem("\u0000<> ")).toBe("Decision_Report");
  });

  it("restores the page title after completed or cancelled printing and on report close", () => {
    const page = { title: "allofmycareer | Career Decision Report" };
    const browser = new EventTarget();
    vi.stubGlobal("document", page);
    vi.stubGlobal("window", browser);
    const restore = prepareV2PrintTitle(
      "창업_검토_allofmycareer_2026-10-10.pdf"
    );
    expect(page.title).toBe("창업_검토_allofmycareer_2026-10-10");
    browser.dispatchEvent(new Event("afterprint"));
    expect(page.title).toBe("allofmycareer | Career Decision Report");
    restore();
    expect(page.title).toBe("allofmycareer | Career Decision Report");

    const cancel = prepareV2PrintTitle("MBA_진학_allofmycareer_2026-10-10.pdf");
    expect(page.title).toBe("MBA_진학_allofmycareer_2026-10-10");
    cancel();
    expect(page.title).toBe("allofmycareer | Career Decision Report");
    browser.dispatchEvent(new Event("afterprint"));
    expect(page.title).toBe("allofmycareer | Career Decision Report");
  });
});
