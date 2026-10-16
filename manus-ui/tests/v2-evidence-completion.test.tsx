/**
 * Evidence completion: dashboard_generated waits for every topic, printing is
 * blocked while topics collect, and a partial result can re-search only the
 * failed topics.
 *
 * There is no DOM library in this repo, so the page is driven by a tiny hook
 * runner: `react` hooks are swapped for a slot-based implementation while the
 * page function runs. The page's own JSX tree is inspected (child components
 * are not expanded) and its handlers are called directly. Child components are
 * rendered with the real React (renderToStaticMarkup) to check their output.
 * fetch and the ops tracker are mocked: no network call is made.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runner = vi.hoisted(() => ({
  active: false,
  slots: [] as any[],
  index: 0,
  effects: [] as { slot: any; fn: () => void | (() => void) }[],
  dirty: false,
}));

vi.mock("react", async importOriginal => {
  const real = await importOriginal<typeof import("react")>();
  const changed = (a?: unknown[], b?: unknown[]) =>
    !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const slot = (init: () => any) => {
    const i = runner.index++;
    if (!(i in runner.slots)) runner.slots[i] = init();
    return runner.slots[i];
  };
  return {
    ...real,
    useState: (initial: unknown) => {
      if (!runner.active) return real.useState(initial);
      const s = slot(() => ({ value: typeof initial === "function" ? (initial as () => unknown)() : initial }));
      s.set ??= (next: unknown) => {
        const value = typeof next === "function" ? (next as (v: unknown) => unknown)(s.value) : next;
        if (!Object.is(value, s.value)) {
          s.value = value;
          runner.dirty = true;
        }
      };
      return [s.value, s.set];
    },
    useRef: (initial: unknown) => {
      if (!runner.active) return real.useRef(initial);
      return slot(() => ({ current: initial }));
    },
    useMemo: (fn: () => unknown, deps: unknown[]) => {
      if (!runner.active) return real.useMemo(fn, deps);
      const s = slot(() => ({ deps: undefined, value: undefined, init: true }));
      if (s.init || changed(s.deps, deps)) {
        s.value = fn();
        s.deps = deps;
        s.init = false;
      }
      return s.value;
    },
    useEffect: (fn: () => void | (() => void), deps?: unknown[]) => {
      if (!runner.active) return real.useEffect(fn, deps);
      const s = slot(() => ({ deps: undefined, init: true, cleanup: undefined }));
      if (s.init || changed(s.deps, deps)) {
        s.deps = deps;
        s.init = false;
        runner.effects.push({ slot: s, fn });
      }
    },
  };
});

const tracked = vi.hoisted(() => [] as { eventType: string; patch: Record<string, unknown> }[]);
vi.mock("../client/src/data/amcFounderOps", async importOriginal => ({
  ...(await importOriginal<object>()),
  trackV2Journey: (input: { eventType: string; patch: Record<string, unknown> }) => {
    tracked.push({ eventType: input.eventType, patch: input.patch });
    return Promise.resolve();
  },
  activeAmcSubmissionId: () => null,
}));

import AmcInteractiveV2 from "../client/src/pages/AmcInteractiveV2";
import V2Dashboard from "../client/src/components/V2Dashboard";
import V2Report from "../client/src/components/V2Report";
import V2Processing from "../client/src/components/V2Processing";
import V2DecisionTracePanel from "../client/src/trace/V2DecisionTracePanel";
import { v2DemoFixture } from "../client/src/data/amcV2Demos";
import { buildV2EvidenceRequest } from "../client/src/data/v2ExternalEvidenceClient";
import { v2EvidenceGroups } from "../shared/v2EvidenceMerge";
import { v2t, type V2CopyKey } from "../client/src/data/v2Language";
import { selfCheckIds } from "../client/src/data/v2SelfDiagnostic";

(globalThis as any).React = React;

let tree: any = null;
function render() {
  for (let pass = 0; pass < 50; pass++) {
    runner.dirty = false;
    runner.active = true;
    runner.index = 0;
    try {
      tree = (AmcInteractiveV2 as () => unknown)();
    } finally {
      runner.active = false;
    }
    const effects = runner.effects.splice(0);
    for (const { slot, fn } of effects) {
      if (typeof slot.cleanup === "function") slot.cleanup();
      slot.cleanup = fn();
    }
    if (!runner.dirty) return;
  }
  throw new Error("render did not settle");
}
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check: () => boolean, timeout = 4000) {
  const end = Date.now() + timeout;
  for (;;) {
    await sleep(15);
    render();
    if (check()) return;
    if (Date.now() > end) throw new Error("waitFor timed out");
  }
}

function walk(node: any, visit: (el: any) => void) {
  if (Array.isArray(node)) return node.forEach(child => walk(child, visit));
  if (!node || typeof node !== "object" || !("props" in node)) return;
  visit(node);
  walk(node.props.children, visit);
}
function findAll(predicate: (el: any) => boolean) {
  const found: any[] = [];
  walk(tree, el => predicate(el) && found.push(el));
  return found;
}
const textOf = (node: any): string =>
  Array.isArray(node) ? node.map(textOf).join("")
    : node == null || typeof node === "boolean" ? ""
      : typeof node === "object" ? textOf(node.props?.children)
        : String(node);
const button = (label: string) => {
  const match = findAll(el => el.type === "button" && textOf(el.props.children).includes(label));
  expect(match, `button "${label}"`).toHaveLength(1);
  return match[0];
};
const one = (type: unknown) => findAll(el => el.type === type)[0];
const slotWith = (test: (value: any) => boolean) => {
  const s = runner.slots.find(slot => slot && "value" in slot && test(slot.value));
  expect(s).toBeTruthy();
  return s;
};
const events = (type: string) => tracked.filter(event => event.eventType === type);

// --- mocked evidence endpoint ---------------------------------------------
type Call = { areas: string[]; resolve: (response: Response) => void };
let calls: Call[] = [];
function liveResponse(body: { caseType: string; externalAreas: string[] }) {
  const area = body.externalAreas[0];
  return Response.json({
    status: "live",
    caseType: body.caseType,
    generatedAt: "2026-10-16T09:00:00.000Z",
    evidenceBlocks: [{
      provenance: "EXTERNAL_EVIDENCE",
      area,
      dimension: v2t("en", area as V2CopyKey),
      direction: "supportive",
      headline: `Headline for ${area}`,
      fact: `A checked fact about ${area}.`,
      whyItMatters: "It changes how the option reads.",
      sourceLabel: "Example source",
      sourceUrl: `https://example.org/${area}`,
    }],
    metrics: [],
    opportunitySignals: [],
    frictionSignals: [],
    uncertainties: ["Scope still needs checking."],
    implication: "Compare the source with your own conditions.",
  }, { headers: { "X-AMC-Evidence-Reason": "live" } });
}
// 400 is a permanent failure: the client does not retry it automatically.
const failedResponse = () =>
  Response.json({ status: "unavailable" }, { status: 400, headers: { "X-AMC-Evidence-Reason": "invalid_request" } });

beforeEach(() => {
  runner.slots = [];
  runner.effects = [];
  tracked.length = 0;
  calls = [];
  tree = null;
  vi.stubGlobal("window", {
    location: { search: "?lang=en" },
    scrollTo: () => {},
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (id: ReturnType<typeof setInterval>) => clearInterval(id),
    print: vi.fn(),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  vi.stubGlobal("document", { title: "allofmycareer" });
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body));
    return new Promise<Response>(resolve => calls.push({ areas: body.externalAreas, resolve: r => resolve(r), body } as Call & { body: unknown }));
  }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const completedState = () => ({
  ...v2DemoFixture("industry", "en").state,
  publicSearchTarget: "Product manager roles in fintech",
  serviceConsent: true,
});
const bodyOf = (call: Call) => (call as Call & { body: { caseType: string; externalAreas: string[] } }).body;

/** Puts the page on step 8 with every answer complete. */
function atLastStep() {
  render();
  const state = completedState();
  slotWith(v => v && typeof v === "object" && "bandSelections" in v).set(state);
  render(); // case-type effects run here and may reset self-checks
  slotWith(v => v && typeof v === "object" && "public" in v && "capacity" in v)
    .set(Object.fromEntries(selfCheckIds.map(id => [id, { status: "notChecked", detail: "" }])));
  const phase = slotWith(v => v === "setup");
  phase.set("modules");
  runner.slots[runner.slots.indexOf(phase) + 1].set(7); // step follows phase
  render();
  const request = buildV2EvidenceRequest(state)!;
  expect(request).not.toBeNull();
  return v2EvidenceGroups(request);
}
const searchButton = () => button("Search public sources and analyze");
const reportPrint = () => {
  const report = one(V2Report);
  expect(report).toBeTruthy();
  const html = renderToStaticMarkup(React.createElement(V2Report, report.props));
  const toolbar = html.slice(html.indexOf("v2-report-toolbar"), html.indexOf("v2-report-toolbar") + 600);
  const print = toolbar.match(/<button[^>]*>[^<]*<\/button>\s*<\/div>/)![0];
  return { print, disabled: /disabled=""/.test(print) };
};

describe("dashboard_generated waits for every topic", () => {
  it("opens early but records once, after the last topic, with the final mode; print is blocked meanwhile", async () => {
    const groups = atLastStep();
    expect(groups.length).toBeGreaterThanOrEqual(2);
    searchButton().props.onClick();
    render();
    await waitFor(() => calls.length === 1);
    calls[0].resolve(liveResponse(bodyOf(calls[0])));
    await waitFor(() => !!one(V2Dashboard) && calls.length === groups.length);

    // Dashboard is visible while the other topics still collect.
    expect(events("dashboard_generated")).toHaveLength(0);
    expect(events("external_evidence_requested")).toHaveLength(1);
    expect(textOf(tree)).toContain("Still collecting evidence");
    // Opening the report is allowed; printing is not.
    one(V2Dashboard).props.onReport();
    render();
    const blocked = reportPrint();
    expect(blocked.disabled).toBe(true);
    expect(blocked.print).toContain("Collecting evidence");
    // A keyboard print cannot be blocked: page 1 carries a print-only notice.
    const blockedHtml = renderToStaticMarkup(React.createElement(V2Report, one(V2Report).props));
    expect(blockedHtml).toContain('<p class="v2-print-incomplete" role="note">Evidence still loading · Incomplete report</p>');
    expect(blockedHtml.indexOf("v2-print-incomplete")).toBeLessThan(blockedHtml.indexOf("v2-cover"));
    one(V2Report).props.onPrint();
    expect((window as any).print).not.toHaveBeenCalled();
    expect(events("print_save_clicked")).toHaveLength(0);

    // The rest arrive: exactly one dashboard_generated, with the live mode.
    for (const call of calls.slice(1)) call.resolve(liveResponse(bodyOf(call)));
    await waitFor(() => events("dashboard_generated").length > 0);
    await sleep(30);
    render();
    const generated = events("dashboard_generated");
    expect(generated).toHaveLength(1);
    expect(generated[0].patch.externalEvidenceMode).toBe("live");
    expect((generated[0].patch.structuralOutputJson as { externalEvidenceStatus: string }).externalEvidenceStatus).toBe("live");
    // external_evidence_live is still recorded once, before dashboard_generated.
    expect(events("external_evidence_live")).toHaveLength(1);
    expect(tracked.findIndex(e => e.eventType === "external_evidence_live"))
      .toBeLessThan(tracked.findIndex(e => e.eventType === "dashboard_generated"));

    const open = reportPrint();
    expect(open.disabled).toBe(false);
    expect(open.print).toContain("Print / save PDF");
    expect(renderToStaticMarkup(React.createElement(V2Report, one(V2Report).props))).not.toContain("v2-print-incomplete");
    one(V2Report).props.onPrint();
    expect((window as any).print).toHaveBeenCalledTimes(1);
    // Nothing failed, so no retry button.
    one(V2Report).props.onClose();
    render();
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
  });

  it("blocks the decision-trace print while topics collect", async () => {
    const groups = atLastStep();
    searchButton().props.onClick();
    render();
    await waitFor(() => calls.length === 1);
    calls[0].resolve(liveResponse(bodyOf(calls[0])));
    await waitFor(() => !!one(V2Dashboard) && calls.length === groups.length);
    expect(findAll(el => el.type === V2DecisionTracePanel)).toHaveLength(0); // summary view first
    button("Decision trace").props.onClick();
    render();
    const trace = one(V2DecisionTracePanel);
    expect(trace.props.printBlocked).toBe(true);
    const html = renderToStaticMarkup(React.createElement(V2DecisionTracePanel, trace.props));
    expect(html).toMatch(/<button type="button" disabled="">[\s\S]*?Collecting evidence<\/button>/);
    // "Save as file" waits for the same condition, and print shows the notice.
    expect(html).toMatch(/<button type="button" disabled="">[\s\S]*?Save as file<\/button>/);
    expect(html).toContain('<p class="v2-print-incomplete" role="note">Evidence still loading · Incomplete report</p>');
    for (const call of calls.slice(1)) call.resolve(liveResponse(bodyOf(call)));
    await waitFor(() => events("dashboard_generated").length === 1);
    expect(one(V2DecisionTracePanel).props.printBlocked).toBe(false);
    const done = renderToStaticMarkup(React.createElement(V2DecisionTracePanel, one(V2DecisionTracePanel).props));
    expect(done).not.toContain("v2-print-incomplete");
    expect(done).not.toMatch(/<button type="button" disabled="">[\s\S]*?Save as file<\/button>/);
  });

  it("the incomplete-report notice is hidden on screen and shown in print", () => {
    const css = fs.readFileSync(path.join(import.meta.dirname, "../client/src/styles/v2-analysis.css"), "utf8");
    expect(css).toMatch(/\.v2-print-incomplete \{\s*display: none;/);
    expect(css).toMatch(/@media print \{\s*\.v2-print-incomplete \{\s*display: block;/);
    expect(v2t("ko", "evidenceIncomplete")).toBe("근거 수집 중 · 미완성 보고서");
  });
});

describe("partial result: search the failed topics again", () => {
  it("re-searches only the failed topics and never records dashboard_generated twice", async () => {
    const groups = atLastStep();
    searchButton().props.onClick();
    render();
    await waitFor(() => calls.length === 1);
    calls[0].resolve(liveResponse(bodyOf(calls[0])));
    await waitFor(() => calls.length === groups.length);
    // While collecting, the retry button is not offered.
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
    for (const call of calls.slice(1)) call.resolve(failedResponse());
    await waitFor(() => events("dashboard_generated").length === 1);
    await sleep(30);
    render();
    expect(events("dashboard_generated")[0].patch.externalEvidenceMode).toBe("live");
    expect(calls).toHaveLength(groups.length); // 400 is not auto-retried

    const dashboard = one(V2Dashboard);
    expect(typeof dashboard.props.onRetryFailedTopics).toBe("function");
    const html = renderToStaticMarkup(React.createElement(V2Dashboard, dashboard.props));
    expect(html).toContain("Search the failed topics again");
    // Print is allowed once everything settled.
    dashboard.props.onReport();
    render();
    expect(reportPrint().disabled).toBe(false);
    one(V2Report).props.onClose();
    render();

    const before = calls.length;
    one(V2Dashboard).props.onRetryFailedTopics();
    one(V2Dashboard).props.onRetryFailedTopics(); // double click: guarded
    render();
    const failedAreas = groups.slice(1);
    await waitFor(() => calls.length === before + failedAreas.length);
    const retried = calls.slice(before).map(call => bodyOf(call).externalAreas);
    expect(retried).toEqual(failedAreas);
    expect(retried.flat()).not.toContain(groups[0][0]);

    // While the retry runs: print blocked again, retry button hidden.
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
    one(V2Dashboard).props.onReport();
    render();
    expect(reportPrint().disabled).toBe(true);
    one(V2Report).props.onClose();
    render();

    for (const call of calls.slice(before)) call.resolve(liveResponse(bodyOf(call)));
    await waitFor(() => events("external_evidence_live").length === 2);
    await sleep(30);
    render();
    expect(events("dashboard_generated")).toHaveLength(1);
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
    // The merged evidence now covers every topic.
    const blocks = one(V2Dashboard).props.intelligence.evidenceBlocks.map((b: { area: string }) => b.area);
    for (const group of groups) expect(blocks).toContain(group[0]);
    one(V2Dashboard).props.onReport();
    render();
    expect(reportPrint().disabled).toBe(false);
  });
});

describe("draft paths keep recording dashboard_generated once", () => {
  it("records the explicit draft without search once", () => {
    atLastStep();
    const draft = button("See a draft without public search first");
    draft.props.onClick();
    draft.props.onClick(); // double click
    render();
    expect(one(V2Dashboard)).toBeTruthy();
    expect(calls).toHaveLength(0);
    const generated = events("dashboard_generated");
    expect(generated).toHaveLength(1);
    expect(generated[0].patch.externalEvidenceMode).toBe("fallback");
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
  });

  it("total failure: stays on the failure screen, then the draft records once", async () => {
    const groups = atLastStep();
    searchButton().props.onClick();
    render();
    await waitFor(() => calls.length === groups.length);
    for (const call of calls) call.resolve(failedResponse());
    await waitFor(() => events("external_evidence_fallback").length === 1);
    await sleep(30);
    render();
    const processing = one(V2Processing);
    expect(processing.props.running).toBe(false);
    expect(one(V2Dashboard)).toBeUndefined();
    expect(events("dashboard_generated")).toHaveLength(0);
    processing.props.onDraft();
    processing.props.onDraft();
    render();
    expect(one(V2Dashboard)).toBeTruthy();
    const generated = events("dashboard_generated");
    expect(generated).toHaveLength(1);
    expect(generated[0].patch.externalEvidenceMode).toBe("fallback");
    expect(one(V2Dashboard).props.onRetryFailedTopics).toBeUndefined();
  });
});
