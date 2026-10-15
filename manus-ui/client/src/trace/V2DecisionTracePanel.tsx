import { useMemo } from "react";
import type { ProductApplicationBuildInput, ProductApplicationV3 } from "../data/amcProductApplicationV3";
import { buildV2Analysis, type V2EvidencePhase } from "../data/amcV2Analysis";
import type { V2Sensitivity, V2State } from "../data/amcV2Model";
import type { ExternalIntelligenceV2 } from "../data/externalIntelligenceV2";
import type { EvidenceComparisons } from "../data/v2EvidenceComparison";
import type { SelfChecks } from "../data/v2SelfDiagnostic";
import { buildV2TraceSnapshot } from "./traceSnapshot";
import V2DecisionTrace from "./V2DecisionTrace";

/**
 * Connects the trace to the results screen. It builds the analysis with the
 * same call and arguments V2Dashboard uses, so the trace and the dashboard
 * always show the same result, then hands a frozen copy to the trace.
 */
export default function V2DecisionTracePanel(props: {
  state: V2State;
  input: ProductApplicationBuildInput;
  core: ProductApplicationV3;
  intelligence: ExternalIntelligenceV2;
  sensitivity: V2Sensitivity[];
  selfChecks?: SelfChecks;
  comparisons?: EvidenceComparisons;
  evidencePhase?: V2EvidencePhase;
  evidenceLanguage?: V2State["language"];
  recordId?: string | null;
}) {
  const { state, input, core, intelligence, sensitivity, selfChecks, comparisons, evidencePhase = intelligence.status, evidenceLanguage = state.language } = props;
  const snapshot = useMemo(() => buildV2TraceSnapshot({
    state, input, core, intelligence, sensitivity,
    analysis: buildV2Analysis(state, core, intelligence, evidencePhase, selfChecks, comparisons, evidenceLanguage),
  }), [state, input, core, intelligence, sensitivity, selfChecks, comparisons, evidencePhase, evidenceLanguage]);
  return <V2DecisionTrace snapshot={snapshot} recordId={props.recordId} />;
}
