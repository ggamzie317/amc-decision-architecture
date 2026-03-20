export type AmcRenderLocale = "ko" | "en" | "zh";

export interface AmcRenderStrings {
  notApplicable: string;
  verdictLabelSingle: string;
  verdictLabelComparative: string;
  optionALabel: string;
  optionBLabel: string;
  matrixVisualStrong: string;
  matrixVisualPartial: string;
  matrixVisualWeak: string;
  defaultMarketStatus: string;
  defaultPressureStatus: string;
  defaultElevatedPressureStatus: string;
  experimentTimeline1: string;
  experimentTimeline2: string;
  experimentTimeline3: string;
  experimentDesign1: string;
  experimentDesign2: string;
  experimentDesign3: string;
  reassessmentTriggerDefault: string;
  reassessmentTriggerSignalInstability: string;
  reassessmentTriggerTimingMisalignment: string;
  reassessmentTriggerSupportErosion: string;
  reassessmentTriggerRiskDeterioration: string;
  assessmentBasisHigh: string;
  assessmentBasisLow: string;
  externalCueFallback: string;
  externalCueWeakEvidence: string;
  externalCuePrefix: string;
  externalCueDemandClear: string;
  externalCueDemandMixed: string;
  externalCueDemandWeak: string;
  externalCuePortabilityStrong: string;
  externalCuePortabilityPartial: string;
  externalCuePortabilityConstrained: string;
  externalCueFrictionLow: string;
  externalCueFrictionModerate: string;
  externalCueFrictionHigh: string;
  externalCueSignalVisible: string;
  externalCueSignalPartial: string;
  externalCueSignalFragmented: string;
}

const STRINGS_BY_LOCALE: Record<AmcRenderLocale, AmcRenderStrings> = {
  ko: {
    notApplicable: "[해당 없음]",
    verdictLabelSingle: "구조적 해석",
    verdictLabelComparative: "비교 구조 해석",
    optionALabel: "옵션 A",
    optionBLabel: "옵션 B",
    matrixVisualStrong: "▲ 우호적",
    matrixVisualPartial: "◆ 혼재",
    matrixVisualWeak: "▼ 제약",
    defaultMarketStatus: "◆ 혼재",
    defaultPressureStatus: "◐ 보통",
    defaultElevatedPressureStatus: "● 높음",
    experimentTimeline1: "1-6주",
    experimentTimeline2: "3-8주",
    experimentTimeline3: "6-12주",
    experimentDesign1: "목표 경로 가정에 대해 구조화된 시장성 및 이동가능성 점검을 수행합니다.",
    experimentDesign2: "명시적 업무량, 속도, 순서 제약 하에서 실행 준비도를 검증합니다.",
    experimentDesign3: "커밋 이전에 스폰서, 대안, 지원 기반의 지속성을 검증합니다.",
    reassessmentTriggerDefault: "커밋 조건이 충족되기 전에 핵심 구조 신호가 악화되면 재평가가 필요합니다.",
    reassessmentTriggerSignalInstability: "핵심 신호의 일관성이 약화되면, 조건 재정렬 전 재평가가 필요합니다.",
    reassessmentTriggerTimingMisalignment: "의사결정 속도와 실행 준비도의 정렬이 약화되면 재평가가 필요합니다.",
    reassessmentTriggerSupportErosion: "스폰서십·안전망·조직 안정성 등 지원 기반이 약화되면 재평가가 필요합니다.",
    reassessmentTriggerRiskDeterioration: "핵심 구조 리스크가 상승하면, 커밋 이전에 재평가가 필요합니다.",
    assessmentBasisHigh: "평가 근거: 의사결정 프레이밍에 충분한 입력 깊이를 바탕으로 한 정성적 구조 신호.",
    assessmentBasisLow: "평가 근거: 활용 가능한 정성적 구조 신호를 기반으로 하며, 정량적 깊이는 제한되어 있어 해석은 가용 입력 범위를 반영합니다.",
    externalCueFallback: "외부 해석 큐: 핵심 외부 신호는 부분적으로만 정렬되어 있습니다.",
    externalCueWeakEvidence: "외부 해석 큐: 외부 신호는 확인되나, 아직 충분히 통합되지는 않았습니다.",
    externalCuePrefix: "외부 해석 큐",
    externalCueDemandClear: "수요 가시성 높음",
    externalCueDemandMixed: "수요 가시성 혼재",
    externalCueDemandWeak: "수요 가시성 제약",
    externalCuePortabilityStrong: "이동가능성 높음",
    externalCuePortabilityPartial: "이동가능성 부분적",
    externalCuePortabilityConstrained: "이동가능성 제약",
    externalCueFrictionLow: "전환 마찰 낮음",
    externalCueFrictionModerate: "전환 마찰 보통",
    externalCueFrictionHigh: "전환 마찰 높음",
    externalCueSignalVisible: "신호 정합도 높음",
    externalCueSignalPartial: "신호 정합도 부분적",
    externalCueSignalFragmented: "신호 정합도 분절",
  },
  en: {
    notApplicable: "[Not applicable]",
    verdictLabelSingle: "Structural Reading",
    verdictLabelComparative: "Comparative Structural Reading",
    optionALabel: "Option A",
    optionBLabel: "Option B",
    matrixVisualStrong: "▲ Supportive",
    matrixVisualPartial: "◆ Mixed",
    matrixVisualWeak: "▼ Constrained",
    defaultMarketStatus: "◆ Mixed",
    defaultPressureStatus: "◐ Moderate",
    defaultElevatedPressureStatus: "● Elevated",
    experimentTimeline1: "Weeks 1–6",
    experimentTimeline2: "Weeks 3–8",
    experimentTimeline3: "Weeks 6–12",
    experimentDesign1: "Run structured market and portability checks against target path assumptions.",
    experimentDesign2: "Test execution readiness under explicit workload, pace, and sequencing constraints.",
    experimentDesign3: "Validate sponsor, fallback, and support durability before commitment.",
    reassessmentTriggerDefault:
      "Reassessment is required if key structural signals deteriorate before commitment conditions close.",
    reassessmentTriggerSignalInstability:
      "Reassessment is required if core structural signals become less stable before conditions are consolidated.",
    reassessmentTriggerTimingMisalignment:
      "Reassessment is required if decision pace and execution readiness become misaligned.",
    reassessmentTriggerSupportErosion:
      "Reassessment is required if sponsor, safety-net, or stability support conditions weaken.",
    reassessmentTriggerRiskDeterioration:
      "Reassessment is required if structural risk exposure rises before commitment conditions close.",
    assessmentBasisHigh: "Assessment basis: Qualitative structural signals with sufficient input depth for decision framing.",
    assessmentBasisLow: "Assessment basis: Qualitative structural signals available; quantitative depth limited - interpretation reflects available input.",
    externalCueFallback: "External reading cue: core external signals remain only partially consolidated.",
    externalCueWeakEvidence: "External reading cue: signal visibility is present, but not yet fully consolidated.",
    externalCuePrefix: "External reading cue",
    externalCueDemandClear: "demand visibility clear",
    externalCueDemandMixed: "demand visibility mixed",
    externalCueDemandWeak: "demand visibility constrained",
    externalCuePortabilityStrong: "portability broad",
    externalCuePortabilityPartial: "portability partial",
    externalCuePortabilityConstrained: "portability constrained",
    externalCueFrictionLow: "transition friction contained",
    externalCueFrictionModerate: "transition friction moderate",
    externalCueFrictionHigh: "transition friction elevated",
    externalCueSignalVisible: "signal consolidation strong",
    externalCueSignalPartial: "signal consolidation partial",
    externalCueSignalFragmented: "signal consolidation fragmented",
  },
  zh: {
    notApplicable: "[不适用]",
    verdictLabelSingle: "结构性解读",
    verdictLabelComparative: "比较结构性解读",
    optionALabel: "选项 A",
    optionBLabel: "选项 B",
    matrixVisualStrong: "▲ 支持性",
    matrixVisualPartial: "◆ 混合",
    matrixVisualWeak: "▼ 受限",
    defaultMarketStatus: "◆ 混合",
    defaultPressureStatus: "◐ 中等",
    defaultElevatedPressureStatus: "● 偏高",
    experimentTimeline1: "第1-6周",
    experimentTimeline2: "第3-8周",
    experimentTimeline3: "第6-12周",
    experimentDesign1: "围绕目标路径假设开展结构化的市场与可迁移性验证。",
    experimentDesign2: "在明确的工作负荷、节奏与推进顺序约束下测试执行准备度。",
    experimentDesign3: "在承诺前验证赞助支持、备选方案与支持基础的持续性。",
    reassessmentTriggerDefault: "若在承诺条件收敛前关键结构信号恶化，则需要重新评估。",
    reassessmentTriggerSignalInstability: "若核心结构信号稳定性下降，应在条件重新对齐前进行再评估。",
    reassessmentTriggerTimingMisalignment: "若决策节奏与执行准备度出现错配，应进行再评估。",
    reassessmentTriggerSupportErosion: "若赞助支持、安全网或稳定性支撑减弱，应进行再评估。",
    reassessmentTriggerRiskDeterioration: "若结构性风险暴露上升，应在更强承诺前进行再评估。",
    assessmentBasisHigh: "评估依据：基于足够输入深度的定性结构信号，用于决策框架判断。",
    assessmentBasisLow: "评估依据：可用定性结构信号已纳入，但定量深度有限，解读反映当前可用输入。",
    externalCueFallback: "外部解读提示：核心外部信号仍处于部分整合状态。",
    externalCueWeakEvidence: "外部解读提示：外部信号可见，但尚未充分收敛。",
    externalCuePrefix: "外部解读提示",
    externalCueDemandClear: "需求可见性清晰",
    externalCueDemandMixed: "需求可见性混合",
    externalCueDemandWeak: "需求可见性受限",
    externalCuePortabilityStrong: "可迁移性较强",
    externalCuePortabilityPartial: "可迁移性部分成立",
    externalCuePortabilityConstrained: "可迁移性受限",
    externalCueFrictionLow: "转移摩擦较低",
    externalCueFrictionModerate: "转移摩擦中等",
    externalCueFrictionHigh: "转移摩擦偏高",
    externalCueSignalVisible: "信号收敛较强",
    externalCueSignalPartial: "信号收敛部分成立",
    externalCueSignalFragmented: "信号收敛分散",
  },
};

export function resolveAmcRenderLocale(value: unknown): AmcRenderLocale {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.startsWith("ko")) {
    return "ko";
  }
  if (raw.startsWith("zh")) {
    return "zh";
  }
  return "en";
}

export function getAmcRenderStrings(locale: AmcRenderLocale): AmcRenderStrings {
  return STRINGS_BY_LOCALE[locale];
}
