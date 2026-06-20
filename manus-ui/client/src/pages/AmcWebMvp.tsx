import { useMemo, useState } from "react";

type Tier = "essential" | "executive";
type Language = "en" | "ko";
type CaseType =
  | "Corporate Stay vs Exit"
  | "MBA / EMBA / PhD Decision"
  | "Overseas Relocation"
  | "Entrepreneurship"
  | "Industry Transition"
  | "Role Upgrade / Downgrade"
  | "Burnout-driven Decision"
  | "Family Constraint-heavy Decision"
  | "General Career Reconfiguration";

type PreviewAnswers = {
  decision: string;
  optionA: string;
  optionB: string;
  pull: string;
  constraint: string;
  risk: string;
  condition: string;
};

const initialPreviewAnswers: PreviewAnswers = {
  decision: "",
  optionA: "",
  optionB: "",
  pull: "",
  constraint: "",
  risk: "",
  condition: "",
};

const previewQuestions: Array<{
  field: keyof PreviewAnswers;
  question: string;
  placeholder: string;
}> = [
  {
    field: "decision",
    question: "What career decision are you facing now?",
    placeholder: "Example: stay in strategy or prepare for a research path",
  },
  { field: "optionA", question: "What is Option A?", placeholder: "Current path or lower-friction option" },
  { field: "optionB", question: "What is Option B?", placeholder: "Transition path or higher-uncertainty option" },
  { field: "pull", question: "What is pulling you toward change?", placeholder: "Identity, upside, learning, autonomy..." },
  { field: "constraint", question: "What is holding you back?", placeholder: "Safety margin, timing, support..." },
  { field: "risk", question: "What is your biggest risk, fear, or uncertainty?", placeholder: "What could distort the decision?" },
  { field: "condition", question: "What condition would make deeper commitment more defensible?", placeholder: "What must become clearer?" },
];

const previewQuestionsKo: Record<keyof PreviewAnswers, { question: string; placeholder: string }> = {
  decision: {
    question: "현재 어떤 커리어 결정을 앞두고 있나요?",
    placeholder: "예: 전략 직무를 유지할지, 리서치 경로를 준비할지",
  },
  optionA: { question: "Option A는 무엇인가요?", placeholder: "현재 경로 또는 전환 부담이 낮은 선택지" },
  optionB: { question: "Option B는 무엇인가요?", placeholder: "전환 경로 또는 불확실성이 더 큰 선택지" },
  pull: {
    question: "변화를 고려하게 만드는 요인은 무엇인가요?",
    placeholder: "정체성, 성장 가능성, 학습, 자율성 등",
  },
  constraint: {
    question: "결정을 어렵게 만드는 제약은 무엇인가요?",
    placeholder: "안정성, 시기, 지원 체계 등",
  },
  risk: {
    question: "가장 크게 보는 리스크나 불확실성은 무엇인가요?",
    placeholder: "어떤 요인이 판단을 왜곡할 수 있나요?",
  },
  condition: {
    question: "전환을 더 구체적으로 검토하려면 어떤 조건이 확인되어야 하나요?",
    placeholder: "전환 전에 무엇을 확인해야 하나요?",
  },
};

const howItWorks = [
  {
    step: "Tip in",
    body: "Answer a short set of questions about your current career decision.",
  },
  {
    step: "Decide",
    body: "See the structure behind the decision: tension, trade-offs, risks, and conditions.",
  },
  {
    step: "Value up",
    body: "Turn structural clarity into a stronger career move.",
  },
] as const;

const insightCards = [
  {
    marker: "D",
    eyebrow: "Decision Type",
    title: "Staged Reconfiguration",
    line: "A transition that needs evidence before deeper commitment.",
  },
  {
    marker: "T",
    eyebrow: "Core Tension",
    title: "Identity Pull vs Safety Margin",
    line: "Long-term fit is pulling against near-term stability.",
  },
  {
    marker: "R",
    eyebrow: "Primary Risk",
    title: "Premature Commitment",
    line: "The risk is moving before validation is strong enough.",
  },
  {
    marker: "Q",
    eyebrow: "Next Structural Question",
    title: "What must be validated?",
    line: "Commitment becomes cleaner when uncertainty narrows.",
  },
] as const;

const lockedModules = [
  {
    title: "External Comparative Snapshot",
    reveals: "Option-level trade-offs across stability, validation, and execution burden.",
  },
  {
    title: "Internal Structural Snapshot",
    reveals: "Readiness, safety margin, support, strain, and timing pressure.",
  },
  {
    title: "Structural Risk Diagnosis",
    reveals: "Primary, secondary, and distortion risks.",
  },
  {
    title: "Decision Conditions",
    reveals: "What makes deeper commitment more defensible.",
  },
  {
    title: "Detailed PDF Report",
    reveals: "Deeper written interpretation and richer analysis for later review.",
  },
  {
    title: "1-Day Report Q&A",
    reveals: "Ask report-based questions for one day after receiving the report.",
  },
] as const;

const detailedPdfSections = [
  "Executive Summary",
  "Situation and Decision Context",
  "Option A / Option B Detailed Reading",
  "External Comparative Analysis",
  "Internal Readiness Analysis",
  "Safety Margin and Reversibility",
  "Structural Risk Diagnosis",
  "Decision Conditions",
  "30 / 60 / 90-day Validation Plan",
  "Reflection Questions",
] as const;

const intakeGroups = [
  {
    title: "Current Situation",
    questions: [
      {
        id: 1,
        text: "What career decision are you facing now?",
        sample: "Whether to remain in corporate strategy or prepare for a PhD and research-oriented advisory path.",
      },
      {
        id: 2,
        text: "Why has this decision become important at this point?",
        sample: "The current role remains stable, but the gap between daily work and long-term identity is widening.",
      },
      {
        id: 3,
        text: "What pressure, trigger, or opportunity is making the decision more urgent?",
        sample: "A possible research collaboration and the next admissions cycle create a time-sensitive validation window.",
      },
      {
        id: 4,
        text: "What would happen if you delayed this decision for 6 to 12 months?",
        sample: "Income stability would remain, but the research transition window could become narrower.",
      },
    ],
  },
  {
    title: "Option A / Option B",
    questions: [
      { id: 5, text: "What is Option A?", sample: "Remain in the current corporate strategy path." },
      {
        id: 6,
        text: "What does Option A protect?",
        sample: "Income continuity, professional credibility, and near-term family stability.",
      },
      {
        id: 7,
        text: "What does Option A limit or strain?",
        sample: "Research identity, intellectual depth, and longer-term platform renewal.",
      },
      { id: 8, text: "What is Option B?", sample: "Prepare for a PhD and research-oriented advisory path." },
      {
        id: 9,
        text: "What does Option B open up?",
        sample: "A stronger research identity, deeper expertise, and a possible second professional platform.",
      },
      {
        id: 10,
        text: "What does Option B put at risk?",
        sample: "Income stability, execution capacity, and credibility if external validation remains weak.",
      },
    ],
  },
  {
    title: "External Pressure",
    questions: [
      {
        id: 11,
        text: "What external market, industry, policy, or company changes are affecting this decision?",
        sample: "Corporate strategy roles are becoming more execution-heavy while research-led advisory demand is selective.",
      },
      {
        id: 12,
        text: "Which option is more aligned with where the external environment seems to be moving?",
        sample: "Option B may align with demand for specialized research, but Option A remains more immediately validated.",
      },
      {
        id: 13,
        text: "What evidence supports that external reading?",
        sample: "Early conversations show interest in the research topic, but no funded commitment exists yet.",
      },
      {
        id: 14,
        text: "What external validation is still missing?",
        sample: "Admissions fit, funding visibility, supervisor support, and paid advisory demand.",
      },
    ],
  },
  {
    title: "Internal Readiness",
    questions: [
      {
        id: 15,
        text: "Which option feels more aligned with your long-term identity?",
        sample: "Option B feels more aligned with the desired long-term research and advisory identity.",
      },
      {
        id: 16,
        text: "Which option requires more personal reconfiguration?",
        sample: "Option B requires a larger shift in routine, identity, learning discipline, and professional positioning.",
      },
      {
        id: 17,
        text: "What skills, credentials, or proof points are still missing?",
        sample: "Published research, stronger academic references, and evidence of market demand for advisory work.",
      },
      {
        id: 18,
        text: "What emotional or cognitive load would each option create?",
        sample: "Option A creates stagnation pressure; Option B creates uncertainty and sustained execution load.",
      },
    ],
  },
  {
    title: "Safety Margin",
    questions: [
      {
        id: 19,
        text: "How much financial runway or income stability do you have?",
        sample: "The current role provides strong stability, while a transition would require a protected 12-month runway.",
      },
      {
        id: 20,
        text: "Which option gives you more reversibility if things do not work out?",
        sample: "Option A is currently more reversible because exploration can continue while income is protected.",
      },
      {
        id: 21,
        text: "What downside exposure would be hardest to absorb?",
        sample: "A transition that weakens income without producing academic or advisory validation.",
      },
    ],
  },
  {
    title: "Support System",
    questions: [
      {
        id: 22,
        text: "Who would support you in Option A?",
        sample: "Current colleagues, family, and the existing professional network.",
      },
      {
        id: 23,
        text: "Who would support you in Option B?",
        sample: "Potential supervisors, research collaborators, and a small group of advisory contacts.",
      },
      {
        id: 24,
        text: "What network, mentor, family, or institutional support is still missing?",
        sample: "A committed academic sponsor, clearer family operating support, and stronger institutional backing.",
      },
    ],
  },
  {
    title: "Timing and Constraints",
    questions: [
      {
        id: 25,
        text: "What deadlines, age, visa, family, company, or market timing constraints matter?",
        sample: "The admissions calendar, family obligations, and corporate workload shape the next 12 months.",
      },
      {
        id: 26,
        text: "Which option becomes harder if you wait?",
        sample: "Option B becomes harder if research proof and academic relationships are delayed.",
      },
      {
        id: 27,
        text: "Which option becomes safer if you wait?",
        sample: "Option B becomes safer if external validation and financial runway improve before commitment.",
      },
    ],
  },
  {
    title: "Decision Conditions",
    questions: [
      {
        id: 28,
        text: "What condition would make deeper commitment to Option B more defensible?",
        sample: "Credible supervisor support, funding visibility, and a tested advisory demand signal.",
      },
      {
        id: 29,
        text: "What condition would make staying with Option A more defensible?",
        sample: "A reshaped role that protects learning, exploration time, and a clear longer-term platform strategy.",
      },
    ],
  },
] as const;

const intakeGroupTitlesKo: Record<string, string> = {
  "Current Situation": "Current Situation",
  "Option A / Option B": "Option A / Option B",
  "External Pressure": "External Pressure",
  "Internal Readiness": "Internal Readiness",
  "Safety Margin": "Safety Margin",
  "Support System": "Support System",
  "Timing and Constraints": "Timing and Constraints",
  "Decision Conditions": "Decision Conditions",
};

const intakeQuestionsKo: Record<number, { text: string; sample: string }> = {
  1: {
    text: "현재 어떤 커리어 결정을 앞두고 있나요?",
    sample: "기업 전략 직무를 유지할지, 박사과정과 리서치 기반 자문 경로를 준비할지 결정해야 합니다.",
  },
  2: {
    text: "이 결정이 지금 중요해진 이유는 무엇인가요?",
    sample: "현재 역할은 안정적이지만, 일상 업무와 장기적 정체성 사이의 간격이 커지고 있습니다.",
  },
  3: {
    text: "결정을 앞당기는 압력, 계기 또는 기회는 무엇인가요?",
    sample: "연구 협업 가능성과 다음 지원 일정으로 인해 검증 가능한 시기가 제한되어 있습니다.",
  },
  4: {
    text: "이 결정을 6개월에서 12개월 미루면 어떤 변화가 생기나요?",
    sample: "소득 안정성은 유지되지만, 리서치 전환을 준비할 수 있는 시기는 더 좁아질 수 있습니다.",
  },
  5: { text: "Option A는 무엇인가요?", sample: "현재 기업 전략 경로를 유지합니다." },
  6: {
    text: "Option A가 보호하는 것은 무엇인가요?",
    sample: "소득의 연속성, 직업적 신뢰도, 단기적인 가족 안정성을 보호합니다.",
  },
  7: {
    text: "Option A가 제한하는 가능성은 무엇인가요?",
    sample: "리서치 정체성, 전문성의 깊이, 장기적인 커리어 전환이 제한될 수 있습니다.",
  },
  8: { text: "Option B는 무엇인가요?", sample: "박사과정과 리서치 기반 자문 경로를 준비합니다." },
  9: {
    text: "Option B가 열어 주는 가능성은 무엇인가요?",
    sample: "리서치 정체성, 전문성의 깊이, 두 번째 커리어 플랫폼을 구축할 가능성이 커집니다.",
  },
  10: {
    text: "Option B에서 감수해야 하는 리스크는 무엇인가요?",
    sample: "External Validation이 충분하지 않을 경우 소득 안정성, 실행 여력, 직업적 신뢰도가 약해질 수 있습니다.",
  },
  11: {
    text: "시장, 산업, 정책 또는 회사의 어떤 변화가 이 결정에 영향을 주고 있나요?",
    sample: "기업 전략 역할의 실행 부담은 커지고 있으며, 리서치 기반 자문 수요는 선별적으로 형성되고 있습니다.",
  },
  12: {
    text: "외부 환경의 변화 방향과 더 잘 맞는 선택지는 어느 쪽인가요?",
    sample: "Option B는 전문 리서치 수요와 연결될 수 있지만, 현재는 Option A의 검증 수준이 더 높습니다.",
  },
  13: {
    text: "그 외부 환경 해석을 뒷받침하는 근거는 무엇인가요?",
    sample: "초기 대화에서 연구 주제에 대한 관심은 확인했지만, 자금이나 계약으로 이어진 근거는 아직 없습니다.",
  },
  14: {
    text: "아직 부족한 External Validation은 무엇인가요?",
    sample: "입학 적합성, 자금 가시성, 지도교수 지원, 유료 자문 수요에 대한 검증이 필요합니다.",
  },
  15: {
    text: "장기적인 정체성과 더 잘 맞는 선택지는 무엇인가요?",
    sample: "Option B가 장기적으로 원하는 리서치 및 자문 정체성과 더 잘 맞습니다.",
  },
  16: {
    text: "더 큰 변화와 준비가 필요한 선택지는 무엇인가요?",
    sample: "Option B는 일상, 정체성, 학습 방식, 전문 분야 포지셔닝에서 더 큰 변화가 필요합니다.",
  },
  17: {
    text: "아직 부족한 역량, 자격 또는 검증 근거는 무엇인가요?",
    sample: "출판된 연구, 더 강한 학술 추천, 자문 수요를 입증할 시장 근거가 필요합니다.",
  },
  18: {
    text: "각 선택지에서 예상되는 감정적·인지적 부담은 무엇인가요?",
    sample: "Option A는 정체감과 답답함을 키울 수 있고, Option B는 불확실성과 지속적인 실행 부담을 높일 수 있습니다.",
  },
  19: {
    text: "현재 재정적 여유와 소득 안정성은 어느 정도인가요?",
    sample: "현재 역할의 안정성은 높지만, 전환을 위해서는 최소 12개월의 재정적 여유가 필요합니다.",
  },
  20: {
    text: "예상대로 진행되지 않을 때 Reversibility가 더 높은 선택지는 무엇인가요?",
    sample: "Option A는 소득을 보호하면서 탐색을 계속할 수 있어 현재 Reversibility가 더 높습니다.",
  },
  21: {
    text: "감당하기 가장 어려운 하방 리스크는 무엇인가요?",
    sample: "소득은 약해지지만 학술 또는 자문 분야의 검증을 얻지 못하는 전환입니다.",
  },
  22: {
    text: "Option A를 선택할 때 누가 지원할 수 있나요?",
    sample: "현재 동료, 가족, 기존의 전문 네트워크가 지원할 수 있습니다.",
  },
  23: {
    text: "Option B를 선택할 때 누가 지원할 수 있나요?",
    sample: "잠재적 지도교수, 연구 협력자, 소수의 자문 네트워크가 지원할 수 있습니다.",
  },
  24: {
    text: "아직 부족한 네트워크, 멘토, 가족 또는 기관의 지원은 무엇인가요?",
    sample: "신뢰할 수 있는 학술 스폰서, 구체적인 가족 지원, 더 강한 기관의 지지가 필요합니다.",
  },
  25: {
    text: "마감 일정, 연령, 비자, 가족, 회사 또는 시장 시기 중 중요한 제약은 무엇인가요?",
    sample: "지원 일정, 가족 의무, 회사의 업무량이 향후 12개월의 의사결정 시기에 영향을 줍니다.",
  },
  26: {
    text: "기다릴수록 더 어려워지는 선택지는 무엇인가요?",
    sample: "리서치 근거와 학술 관계 형성이 늦어지면 Option B가 더 어려워집니다.",
  },
  27: {
    text: "기다리는 동안 더 충분히 검증할 수 있는 선택지는 무엇인가요?",
    sample: "External Validation과 재정적 여유가 강화되면 Option B의 전환 조건이 더 명확해집니다.",
  },
  28: {
    text: "Option B 전환 전에 확인해야 할 Decision Condition은 무엇인가요?",
    sample: "신뢰할 수 있는 지도교수 지원, 자금 가시성, 검증된 자문 수요 신호가 필요합니다.",
  },
  29: {
    text: "Option A를 유지하는 데 필요한 Decision Condition은 무엇인가요?",
    sample: "학습과 탐색 시간을 보호하고 장기 플랫폼 전략과 연결되는 역할 재설계가 필요합니다.",
  },
};

const totalFullIntakeQuestions = intakeGroups.reduce((total, group) => total + group.questions.length, 0);

const dashboardDeck = [
  {
    section: "Overview",
    keyword: "Staged Reconfiguration",
    reading: "A transition that should be validated before full commitment.",
  },
  {
    section: "External",
    keyword: "Validation Burden",
    reading: "Option B needs external proof before deeper commitment.",
  },
  {
    section: "Internal",
    keyword: "Safety Margin",
    reading: "Option A currently preserves more near-term stability.",
  },
  {
    section: "Risk",
    keyword: "Premature Commitment",
    reading: "The highest risk is moving before evidence is strong enough.",
  },
  {
    section: "Conditions",
    keyword: "Defensibility",
    reading: "Commitment strengthens when uncertainty is reduced.",
  },
] as const;

const matrixRows = [
  { dimension: "Income Stability", optionA: "Strong", optionB: "Developing", reading: "A preserves runway." },
  { dimension: "Identity Alignment", optionA: "Moderate", optionB: "Strong", reading: "B carries stronger pull." },
  { dimension: "External Validation", optionA: "Established", optionB: "Developing", reading: "B needs proof." },
  { dimension: "Execution Burden", optionA: "Lower", optionB: "Higher", reading: "B requires sequencing." },
  { dimension: "Reversibility", optionA: "Higher", optionB: "Moderate", reading: "Staging protects optionality." },
] as const;

const internalSignals = [
  { marker: "C", label: "Decision Clarity", status: "Partial", width: "56%" },
  { marker: "S", label: "Safety Margin", status: "Stronger in Option A", width: "76%" },
  { marker: "N", label: "Support System", status: "Emerging", width: "50%" },
  { marker: "L", label: "Execution Load", status: "Elevated", width: "70%" },
  { marker: "T", label: "Timing Pressure", status: "Moderate", width: "48%" },
] as const;

const riskItems = [
  {
    marker: "1",
    label: "Primary Risk",
    value: "Premature Commitment",
    body: "Moving before external validation can support the transition.",
  },
  {
    marker: "2",
    label: "Secondary Risk",
    value: "Corporate Stagnation",
    body: "Stability may preserve safety while slowing identity renewal.",
  },
  {
    marker: "3",
    label: "Distortion Risk",
    value: "Fatigue-Driven Urgency",
    body: "Current-role fatigue may increase urgency, while actual transition readiness still requires separate validation.",
  },
] as const;

const optionBConditions = [
  "External validators confirm credible research or advisory demand.",
  "Runway protects safety margin during exploration.",
  "The move can be tested before irreversible commitment.",
] as const;

const optionAConditions = [
  "The current role can be reshaped around learning.",
  "Exploration time remains protected.",
  "Stability connects to a longer platform strategy.",
] as const;

const reportExecutiveSummary = [
  {
    lead: "Staged reconfiguration",
    body: "The decision is better treated as a sequenced transition than as an immediate binary choice.",
  },
  {
    lead: "Identity alignment",
    body: "The growth path carries stronger long-term fit, while the current path retains more near-term operating stability.",
  },
  {
    lead: "Safety margin",
    body: "Runway, support, and reversibility remain stronger on the current path and should be protected during validation.",
  },
  {
    lead: "Premature commitment",
    body: "The primary risk is increasing exposure before external evidence can support the transition.",
  },
  {
    lead: "Defensible commitment",
    body: "A deeper move becomes structurally stronger when validation, runway, and reversibility improve together.",
  },
] as const;

const externalPressureSignals = [
  {
    label: "Market / Industry Signal",
    value: "Selective opportunity",
    reading: "Specialized research and advisory demand appears credible but uneven.",
  },
  {
    label: "Institutional / Company Signal",
    value: "Current path validated",
    reading: "The existing role retains market credibility but offers slower identity renewal.",
  },
  {
    label: "Evidence Quality",
    value: "Developing",
    reading: "Early conversations support exploration, not yet full commitment.",
  },
  {
    label: "Missing Validation",
    value: "Material",
    reading: "Funding, sponsor support, and paid advisory demand remain unresolved.",
  },
] as const;

const reportRiskItems = [
  {
    label: "Primary Risk",
    name: "Premature Commitment",
    meaning: "Moving before the transition has enough external support.",
    why: "Identity alignment may be mistaken for structural readiness.",
    reduction: "Test demand, sponsorship, and runway before irreversible movement.",
  },
  {
    label: "Secondary Risk",
    name: "Corporate Stagnation",
    meaning: "Remaining stable without building a second platform.",
    why: "Near-term safety can gradually narrow future mobility.",
    reduction: "Protect research, network, and proof-building time inside Option A.",
  },
  {
    label: "Distortion Risk",
    name: "Fatigue-Driven Urgency",
    meaning: "Current-role fatigue may make the need for change feel more urgent.",
    why: "Fatigue-driven urgency and actual transition readiness need to be assessed separately.",
    reduction: "Separate recovery needs from transition validation.",
  },
] as const;

const reflectionQuestions = [
  "What evidence would materially change the decision?",
  "Which risk is currently being underestimated?",
  "What support must be secured before deeper commitment?",
  "What should be tested before any irreversible move?",
] as const;

const reportExecutiveSummaryKo = [
  { lead: "Staged reconfiguration", body: "이 결정은 즉시 양자택일하기보다 단계적으로 검증하며 전환 범위를 조정하는 편이 적절합니다." },
  { lead: "Identity alignment", body: "Option B는 장기 방향성이 강하지만, Option A는 단기 안정성을 더 강하게 보호합니다." },
  { lead: "Safety Margin", body: "검증 기간에는 재정적 여유, 지원 체계, 되돌릴 수 있는 여지를 함께 보호해야 합니다." },
  { lead: "Premature commitment", body: "핵심 리스크는 충분한 외부 검증 없이 전환을 앞당기는 것입니다." },
  { lead: "Defensible commitment", body: "근거, 안정성, Reversibility가 함께 강화될 때 전환의 결정 조건이 더 명확해집니다." },
] as const;

const externalPressureSignalsKo = [
  { label: "Market / Industry Signal", value: "선별적 기회", reading: "전문 리서치와 자문 수요는 확인되지만 시장 전반에 고르게 형성된 것은 아닙니다." },
  { label: "Institutional / Company Signal", value: "현재 경로의 검증 우위", reading: "현재 역할은 시장 신뢰도가 높지만 장기 방향 전환의 속도는 제한적입니다." },
  { label: "Evidence Quality", value: "검증 진행 중", reading: "초기 반응은 탐색을 뒷받침하지만 전환을 확정할 수준의 근거는 아닙니다." },
  { label: "Missing Validation", value: "핵심 근거 부족", reading: "자금, 스폰서 지원, 유료 자문 수요에 대한 추가 검증이 필요합니다." },
] as const;

const reportRiskItemsKo = [
  {
    label: "Primary Risk",
    name: "Premature Commitment",
    meaning: "외부 근거가 충분하지 않은 상태에서 전환을 앞당기는 리스크입니다.",
    why: "장기 방향성에 대한 선호를 실제 전환 준비도로 오해할 수 있습니다.",
    reduction: "수요, 스폰서 지원, 재정적 여유를 작은 범위에서 먼저 검증합니다.",
  },
  {
    label: "Secondary Risk",
    name: "Corporate Stagnation",
    meaning: "안정성을 유지하는 동안 두 번째 커리어 기반을 만들지 못하는 리스크입니다.",
    why: "단기 안정성이 장기적인 이동 가능성을 점차 좁힐 수 있습니다.",
    reduction: "Option A 안에서도 리서치, 네트워크, 실적 근거를 쌓을 시간을 보호합니다.",
  },
  {
    label: "Distortion Risk",
    name: "Fatigue-Driven Urgency",
    meaning: "현재 역할의 피로감이 변화의 필요성을 더 크게 느끼게 하는 리스크입니다.",
    why: "피로로 인한 시급성과 실제 전환 준비도는 구분해서 봐야 합니다.",
    reduction: "회복이 필요한 문제와 전환 검증이 필요한 문제를 분리합니다.",
  },
] as const;

const reflectionQuestionsKo = [
  "어떤 근거가 확인되면 현재 판단이 달라질 수 있나요?",
  "현재 과소평가하고 있는 리스크는 무엇인가요?",
  "전환 전에 확보해야 할 지원은 무엇인가요?",
  "되돌리기 어려운 결정을 내리기 전에 무엇을 검증해야 하나요?",
] as const;

const caseTypeInterpretations: Record<CaseType, { en: string; ko: string }> = {
  "Corporate Stay vs Exit": {
    en: "This decision is about whether the current organization can still support future career value, not only whether to stay or leave.",
    ko: "이 결정은 단순히 남을지 떠날지의 문제가 아닙니다. 현재 조직이 앞으로의 커리어 가치를 계속 키워줄 수 있는지 확인해야 합니다.",
  },
  "MBA / EMBA / PhD Decision": {
    en: "This decision requires checking whether the degree path creates enough long-term positioning value compared with time, cost, and opportunity risk.",
    ko: "이 결정은 학위 자체보다 시간, 비용, 기회비용 대비 장기 포지셔닝 가치가 충분한지를 확인해야 합니다.",
  },
  "Overseas Relocation": {
    en: "This decision depends on whether relocation improves career optionality while keeping family, visa, and financial constraints manageable.",
    ko: "이 결정은 해외 이동이 커리어 선택지를 넓히는 동시에 가족, 비자, 재정 조건 안에서 감당 가능한지 확인해야 합니다.",
  },
  Entrepreneurship: {
    en: "This decision requires separating founder motivation from market validation, income stability, and repeatable execution capacity.",
    ko: "이 결정은 창업 의지와 실제 시장 검증, 소득 안정성, 반복 가능한 실행력을 분리해서 봐야 합니다.",
  },
  "Industry Transition": {
    en: "This decision depends on whether prior career capital can be transferred into the new industry with credible proof.",
    ko: "이 결정은 기존 커리어 자산이 새로운 산업으로 설득력 있게 이전될 수 있는지가 핵심입니다.",
  },
  "Role Upgrade / Downgrade": {
    en: "This decision is about whether the new role expands long-term career value or only changes title, workload, and short-term status.",
    ko: "이 결정은 직급이나 역할 변화보다 장기 커리어 가치가 실제로 확장되는지를 봐야 합니다.",
  },
  "Burnout-driven Decision": {
    en: "This decision requires separating recovery needs from true transition readiness.",
    ko: "이 결정은 회복이 필요한 문제와 실제 전환 준비도를 분리해서 봐야 합니다.",
  },
  "Family Constraint-heavy Decision": {
    en: "This decision depends on whether the preferred career path can work within family, location, and timing constraints.",
    ko: "이 결정은 원하는 커리어 방향이 가족, 지역, 시간 조건 안에서 실제로 작동 가능한지 확인해야 합니다.",
  },
  "General Career Reconfiguration": {
    en: "This decision requires clarifying which option protects stability, which option creates future value, and what must be validated first.",
    ko: "이 결정은 어떤 선택이 안정성을 보호하고, 어떤 선택이 미래 가치를 만들며, 무엇을 먼저 검증해야 하는지 정리해야 합니다.",
  },
};

const caseSpecificReadings: Record<
  CaseType,
  {
    primaryRisk: { en: string; ko: string };
    decisionConditions: { en: string; ko: string };
    validationFocus: { en: string; ko: string };
  }
> = {
  "Corporate Stay vs Exit": {
    primaryRisk: {
      en: "The main risk is treating stay-or-exit as a binary choice before testing whether the current organization can still support future career value.",
      ko: "핵심 리스크는 현재 조직이 앞으로의 커리어 가치를 계속 키워줄 수 있는지 확인하기 전에, 결정을 단순히 잔류와 퇴사로 나누는 것입니다.",
    },
    decisionConditions: {
      en: "A defensible exit requires proof that the next path has clearer value, stronger pull, and enough safety margin.",
      ko: "전환을 설명하려면 다음 경로의 가치, 외부 수요, 안정성이 현재 경로보다 충분히 명확해야 합니다.",
    },
    validationFocus: {
      en: "Test whether the current role can be redesigned before assuming that exit is the only solution.",
      ko: "퇴사만을 답으로 보기 전에, 현재 역할을 다시 설계할 수 있는지 먼저 확인해야 합니다.",
    },
  },
  "MBA / EMBA / PhD Decision": {
    primaryRisk: {
      en: "The main risk is treating the degree itself as the answer before testing whether it creates enough long-term positioning value.",
      ko: "핵심 리스크는 학위 자체를 답으로 보기 전에, 그 학위가 장기 포지셔닝 가치를 충분히 만드는지 검증하지 않는 것입니다.",
    },
    decisionConditions: {
      en: "A degree path becomes more defensible when it creates clear access to research, network, credibility, or career mobility that cannot be built as effectively elsewhere.",
      ko: "학위 경로는 연구, 네트워크, 신뢰도, 이동 가능성을 다른 방식보다 더 효과적으로 만들 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Separate intellectual interest from career positioning value, time cost, and opportunity risk.",
      ko: "지적 관심과 커리어 포지셔닝 가치, 시간 비용, 기회비용을 분리해서 봐야 합니다.",
    },
  },
  "Overseas Relocation": {
    primaryRisk: {
      en: "The main risk is overestimating career upside while underestimating visa, family, financial, and local-market constraints.",
      ko: "핵심 리스크는 커리어 기회는 크게 보고, 비자, 가족, 재정, 현지 시장 제약은 작게 보는 것입니다.",
    },
    decisionConditions: {
      en: "Relocation becomes more defensible when it increases career optionality without making family and financial constraints too fragile.",
      ko: "해외 이동은 커리어 선택지를 넓히면서도 가족과 재정 조건을 지나치게 불안정하게 만들지 않을 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Validate local demand, visa feasibility, family fit, and income stability before committing.",
      ko: "현지 수요, 비자 가능성, 가족 적합성, 소득 안정성을 먼저 검증해야 합니다.",
    },
  },
  Entrepreneurship: {
    primaryRisk: {
      en: "The main risk is confusing founder motivation with market validation and repeatable execution capacity.",
      ko: "핵심 리스크는 창업 의지와 실제 시장 검증, 반복 가능한 실행력을 혼동하는 것입니다.",
    },
    decisionConditions: {
      en: "Entrepreneurship becomes more defensible when demand, pricing, delivery capacity, and income runway are tested in small steps.",
      ko: "창업은 수요, 가격, 제공 역량, 소득 여유가 작은 단위로 검증될 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Test paying demand before increasing commitment.",
      ko: "몰입도를 높이기 전에 실제 지불 의사를 먼저 확인해야 합니다.",
    },
  },
  "Industry Transition": {
    primaryRisk: {
      en: "The main risk is assuming that past experience will automatically transfer into the new industry.",
      ko: "핵심 리스크는 기존 경험이 새로운 산업에서도 자동으로 인정될 것이라고 보는 것입니다.",
    },
    decisionConditions: {
      en: "An industry transition becomes more defensible when prior career capital can be translated into credible proof for the new market.",
      ko: "산업 전환은 기존 커리어 자산이 새로운 시장에서 설득력 있는 근거로 전환될 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Build proof that the new industry recognizes your previous experience as relevant value.",
      ko: "새로운 산업이 기존 경험을 가치 있는 근거로 인정하는지 확인해야 합니다.",
    },
  },
  "Role Upgrade / Downgrade": {
    primaryRisk: {
      en: "The main risk is focusing on title or status before checking whether the role expands long-term career value.",
      ko: "핵심 리스크는 직급이나 지위 변화에 집중한 나머지, 장기 커리어 가치가 실제로 확장되는지 놓치는 것입니다.",
    },
    decisionConditions: {
      en: "A role change becomes more defensible when it expands decision authority, strategic exposure, capability growth, or future mobility.",
      ko: "역할 변화는 의사결정 권한, 전략 노출, 역량 성장, 향후 이동 가능성을 넓힐 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Check whether the new role improves career value, not only title, workload, or short-term compensation.",
      ko: "새 역할이 직급, 업무량, 단기 보상뿐 아니라 커리어 가치를 실제로 높이는지 확인해야 합니다.",
    },
  },
  "Burnout-driven Decision": {
    primaryRisk: {
      en: "The main risk is reading fatigue as proof that a full career transition is ready.",
      ko: "핵심 리스크는 피로감을 전면적인 커리어 전환이 준비됐다는 신호로 해석하는 것입니다.",
    },
    decisionConditions: {
      en: "A transition becomes more defensible when recovery needs are separated from market validation, execution capacity, and financial safety.",
      ko: "전환은 회복이 필요한 문제와 시장 검증, 실행력, 재정 안정성을 분리해서 확인할 때 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Separate what requires recovery from what requires career redesign.",
      ko: "회복이 필요한 문제와 커리어 재설계가 필요한 문제를 분리해야 합니다.",
    },
  },
  "Family Constraint-heavy Decision": {
    primaryRisk: {
      en: "The main risk is designing a career move that works professionally but fails under family, location, or timing constraints.",
      ko: "핵심 리스크는 커리어 측면에서는 좋아 보여도 가족, 지역, 시기 조건 안에서 작동하지 않는 선택을 하는 것입니다.",
    },
    decisionConditions: {
      en: "A career move becomes more defensible when the preferred path can work within family, location, timing, and financial constraints.",
      ko: "선호하는 경로가 가족, 지역, 시기, 재정 조건 안에서 실제로 작동할 때 결정의 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Test the decision against family logistics before treating career upside as sufficient.",
      ko: "커리어 기회만 보지 말고 가족 생활 조건 안에서 실행 가능한지 먼저 확인해야 합니다.",
    },
  },
  "General Career Reconfiguration": {
    primaryRisk: {
      en: "The main risk is making a large decision before clarifying which option protects stability and which option creates future value.",
      ko: "핵심 리스크는 어떤 선택이 안정성을 보호하고, 어떤 선택이 미래 가치를 만드는지 정리하기 전에 큰 결정을 내리는 것입니다.",
    },
    decisionConditions: {
      en: "The decision becomes more defensible when stability, future value, reversibility, and validation evidence are considered together.",
      ko: "안정성, 미래 가치, 되돌릴 수 있는 여지, 검증 근거를 함께 볼 때 결정의 설명력이 커집니다.",
    },
    validationFocus: {
      en: "Clarify what must be validated before increasing commitment.",
      ko: "몰입도를 높이기 전에 무엇을 검증해야 하는지 먼저 정리해야 합니다.",
    },
  },
};

type LocalizedReportText = { en: string; ko: string };
type CaseReportBranch = {
  executiveSummary: LocalizedReportText;
  primaryRisk: {
    name: string;
    meaning: LocalizedReportText;
    why: LocalizedReportText;
    reduction: LocalizedReportText;
  };
  conditions: { en: string[]; ko: string[] };
  plan: Array<{
    period: string;
    title: LocalizedReportText;
    objective: LocalizedReportText;
    action: LocalizedReportText;
    output: LocalizedReportText;
  }>;
  closingQuestion: LocalizedReportText;
};

const caseReportBranches: Record<CaseType, CaseReportBranch> = {
  "Corporate Stay vs Exit": {
    executiveSummary: {
      en: "This report reads the decision as a stay-or-exit structure. The key question is whether the current organization can still support future career value, or whether the next path has stronger evidence and safety margin.",
      ko: "이 리포트는 현재 결정을 잔류와 퇴사의 구조로 읽습니다. 핵심은 현재 조직이 앞으로의 커리어 가치를 계속 키워줄 수 있는지, 또는 다음 경로가 더 강한 근거와 안정성을 갖추고 있는지입니다.",
    },
    primaryRisk: {
      name: "Binary Stay-or-Exit Framing",
      meaning: {
        en: "Reducing the decision to staying or leaving before testing role redesign and next-path evidence.",
        ko: "현재 역할의 재설계 가능성과 다음 경로의 근거를 확인하기 전에 결정을 잔류와 퇴사로만 나누는 리스크입니다.",
      },
      why: {
        en: "A binary frame can hide whether the organization still has unused career value.",
        ko: "이분법적 판단은 현재 조직 안에 아직 활용하지 않은 커리어 가치가 있는지 놓치게 할 수 있습니다.",
      },
      reduction: {
        en: "Test role redesign and compare it with concrete evidence from the next path.",
        ko: "현재 역할의 재설계 가능성과 다음 경로의 구체적인 근거를 함께 비교합니다.",
      },
    },
    conditions: {
      en: [
        "The current role has been tested for meaningful redesign.",
        "The next path shows clearer value and external demand.",
        "Safety margin remains sufficient during transition.",
      ],
      ko: [
        "현재 역할을 의미 있게 재설계할 수 있는지 확인합니다.",
        "다음 경로의 가치와 외부 수요가 더 명확합니다.",
        "전환 기간의 안정성이 충분히 보호됩니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Test role redesign", ko: "역할 재설계 점검" },
        objective: { en: "Identify unused value inside the current organization.", ko: "현재 조직 안에서 아직 활용하지 않은 가치를 확인합니다." },
        action: { en: "Map realistic changes to scope, learning, authority, and mobility.", ko: "업무 범위, 학습, 권한, 이동 가능성의 현실적인 변화를 정리합니다." },
        output: { en: "A clear view of whether staying can be redesigned.", ko: "잔류 경로의 재설계 가능성을 명확히 합니다." },
      },
      {
        period: "60 days",
        title: { en: "Validate the next path", ko: "다음 경로 검증" },
        objective: { en: "Compare external evidence with the redesigned current path.", ko: "외부 근거를 재설계된 현재 경로와 비교합니다." },
        action: { en: "Test demand, role fit, compensation, and sponsor support.", ko: "수요, 역할 적합성, 보상, 스폰서 지원을 확인합니다." },
        output: { en: "A comparable evidence base for stay and exit.", ko: "잔류와 퇴사를 비교할 수 있는 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Set exit conditions", ko: "퇴사 조건 정리" },
        objective: { en: "Define when exit is more defensible than redesign.", ko: "재설계보다 퇴사가 더 설명 가능한 기준을 정합니다." },
        action: { en: "Review value, demand, safety margin, and reversibility together.", ko: "가치, 수요, 안정성, Reversibility를 함께 검토합니다." },
        output: { en: "Proceed, redesign, or extend validation.", ko: "전환, 역할 재설계 또는 검증 연장을 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What evidence would show that exit creates more career value than redesigning the current role?",
      ko: "퇴사가 현재 역할의 재설계보다 더 큰 커리어 가치를 만든다는 것을 어떤 근거가 보여줄 수 있나요?",
    },
  },
  "MBA / EMBA / PhD Decision": {
    executiveSummary: {
      en: "This report reads the decision as a degree-path positioning question. The key issue is whether the degree creates enough long-term credibility, network, research access, or mobility to justify the time, cost, and opportunity risk.",
      ko: "이 리포트는 현재 결정을 학위 경로를 통한 포지셔닝 문제로 읽습니다. 핵심은 학위가 시간, 비용, 기회비용을 감당할 만큼 장기 신뢰도, 네트워크, 연구 접근성, 이동 가능성을 만들어내는지입니다.",
    },
    primaryRisk: {
      name: "Degree-as-Answer Bias",
      meaning: {
        en: "Treating the degree itself as the solution before validating its positioning value.",
        ko: "학위의 포지셔닝 가치를 검증하기 전에 학위 자체를 해결책으로 보는 리스크입니다.",
      },
      why: {
        en: "Intellectual interest may not translate into enough mobility, credibility, or access.",
        ko: "지적 관심이 충분한 이동 가능성, 신뢰도, 접근성으로 이어지지 않을 수 있습니다.",
      },
      reduction: {
        en: "Compare program outcomes, network access, cost, and alternatives with real evidence.",
        ko: "프로그램 결과, 네트워크 접근성, 비용, 대안 경로를 실제 근거로 비교합니다.",
      },
    },
    conditions: {
      en: [
        "The degree path creates clear positioning value.",
        "Time and cost are balanced against future mobility.",
        "The program provides network, research, or credibility that is difficult to build elsewhere.",
      ],
      ko: [
        "학위 경로가 명확한 포지셔닝 가치를 만듭니다.",
        "시간과 비용이 향후 이동 가능성과 균형을 이룹니다.",
        "프로그램이 다른 방식보다 더 강한 네트워크, 연구 접근성, 신뢰도를 제공합니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Clarify degree purpose", ko: "학위 목적 정리" },
        objective: { en: "Define the career outcome the degree must create.", ko: "학위가 만들어야 할 커리어 결과를 명확히 합니다." },
        action: { en: "Separate intellectual interest from positioning, access, and mobility goals.", ko: "지적 관심과 포지셔닝, 접근성, 이동 목표를 구분합니다." },
        output: { en: "A precise investment thesis for the degree.", ko: "학위에 대한 명확한 투자 가설을 정리합니다." },
      },
      {
        period: "60 days",
        title: { en: "Validate program value", ko: "프로그램 가치 검증" },
        objective: { en: "Test program fit, network value, and opportunity cost.", ko: "프로그램 적합성, 네트워크 가치, 기회비용을 확인합니다." },
        action: { en: "Interview alumni, compare outcomes, and test lower-cost alternatives.", ko: "졸업생 인터뷰, 결과 비교, 저비용 대안을 검토합니다." },
        output: { en: "Evidence of differentiated access and career value.", ko: "차별화된 접근성과 커리어 가치에 대한 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Decide investment logic", ko: "투자 논리 결정" },
        objective: { en: "Determine whether the degree is strategic investment or delayed decision.", ko: "학위가 전략적 투자인지 결정 지연인지 판단합니다." },
        action: { en: "Review outcomes, cost, timing, alternatives, and mobility together.", ko: "결과, 비용, 시기, 대안, 이동 가능성을 함께 검토합니다." },
        output: { en: "Apply, defer, or pursue an alternative route.", ko: "지원, 연기 또는 대안 경로를 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What would make the degree a strategic investment rather than a delay?",
      ko: "이 학위가 단순한 지연이 아니라 전략적 투자가 되려면 어떤 조건이 필요할까요?",
    },
  },
  "Overseas Relocation": {
    executiveSummary: {
      en: "This report reads the decision as a relocation and optionality question. The key issue is whether overseas movement expands career options while keeping visa, family, financial, and local-market constraints manageable.",
      ko: "이 리포트는 현재 결정을 해외 이동과 선택지 확장의 문제로 읽습니다. 핵심은 해외 이동이 커리어 선택지를 넓히면서도 비자, 가족, 재정, 현지 시장 제약을 감당 가능한 수준으로 유지하는지입니다.",
    },
    primaryRisk: {
      name: "Relocation Upside Bias",
      meaning: {
        en: "Overestimating career upside while underestimating operating constraints in the destination market.",
        ko: "해외 이동의 커리어 기회는 크게 보고 현지의 실행 제약은 작게 보는 리스크입니다.",
      },
      why: {
        en: "Visa, family, income, and local demand can weaken an otherwise attractive move.",
        ko: "비자, 가족, 소득, 현지 수요가 매력적으로 보이는 이동의 실행 가능성을 약화할 수 있습니다.",
      },
      reduction: {
        en: "Validate local demand, visa feasibility, family fit, and financial resilience together.",
        ko: "현지 수요, 비자 가능성, 가족 적합성, 재정 안정성을 함께 검증합니다.",
      },
    },
    conditions: {
      en: [
        "Local demand and role access are validated.",
        "Visa and family logistics are workable.",
        "Income stability remains resilient through relocation.",
      ],
      ko: [
        "현지 수요와 역할 접근성이 확인됩니다.",
        "비자와 가족 생활 조건이 실행 가능합니다.",
        "이동 과정에서도 소득 안정성이 유지됩니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Map relocation constraints", ko: "이동 제약 정리" },
        objective: { en: "Make visa, family, financial, and timing constraints explicit.", ko: "비자, 가족, 재정, 시기 제약을 명확히 합니다." },
        action: { en: "Document non-negotiables, dependencies, and downside exposure.", ko: "필수 조건, 의존 관계, 하방 리스크를 정리합니다." },
        output: { en: "A relocation feasibility map.", ko: "해외 이동 실행 가능성 지도를 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Test local fit", ko: "현지 적합성 검증" },
        objective: { en: "Validate demand, role access, visa path, and family fit.", ko: "수요, 역할 접근성, 비자 경로, 가족 적합성을 확인합니다." },
        action: { en: "Use real employer, advisor, and family-planning conversations.", ko: "실제 고용주, 전문가, 가족 계획 논의를 진행합니다." },
        output: { en: "Evidence of career and operating fit.", ko: "커리어와 생활 조건의 적합성 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Set relocation conditions", ko: "이동 조건 결정" },
        objective: { en: "Decide whether optionality exceeds constraint risk.", ko: "선택지 확장의 가치가 제약 리스크보다 큰지 판단합니다." },
        action: { en: "Review demand, visa, family, income, and reversibility.", ko: "수요, 비자, 가족, 소득, Reversibility를 함께 검토합니다." },
        output: { en: "Proceed, delay, or redesign the relocation.", ko: "진행, 연기 또는 이동 경로 재설계를 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What must be true for relocation to expand optionality without making the operating base too fragile?",
      ko: "해외 이동이 생활 기반을 지나치게 불안정하게 만들지 않으면서 선택지를 넓히려면 무엇이 충족되어야 하나요?",
    },
  },
  Entrepreneurship: {
    executiveSummary: {
      en: "This report reads the decision as an entrepreneurship validation problem. The key issue is whether founder motivation is supported by paying demand, delivery capacity, income runway, and repeatable execution.",
      ko: "이 리포트는 현재 결정을 창업 검증의 문제로 읽습니다. 핵심은 창업 의지가 실제 지불 수요, 제공 역량, 소득 여유, 반복 가능한 실행력으로 뒷받침되는지입니다.",
    },
    primaryRisk: {
      name: "Founder Motivation vs Market Validation",
      meaning: {
        en: "Treating founder conviction as evidence of market demand and execution capacity.",
        ko: "창업에 대한 확신을 시장 수요와 실행 역량의 근거로 해석하는 리스크입니다.",
      },
      why: {
        en: "Motivation does not prove willingness to pay, repeatable delivery, or sustainable economics.",
        ko: "의지만으로는 지불 의사, 반복 가능한 제공 역량, 지속 가능한 수익 구조가 증명되지 않습니다.",
      },
      reduction: {
        en: "Test paying demand, delivery repeatability, pricing, and runway in small steps.",
        ko: "지불 수요, 반복 가능한 제공, 가격, 소득 여유를 작은 단위로 검증합니다.",
      },
    },
    conditions: {
      en: [
        "Paying demand is validated with real users or clients.",
        "Delivery capacity can be repeated without excessive personal strain.",
        "Income runway is protected before commitment increases.",
      ],
      ko: [
        "실제 사용자나 고객의 지불 의사가 확인됩니다.",
        "제공 역량이 과도한 개인 부담 없이 반복 가능합니다.",
        "몰입도를 높이기 전에 소득 안정성이 보호됩니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Define offer and user", ko: "제안과 고객 정의" },
        objective: { en: "Clarify the problem, target user, and offer.", ko: "문제, 목표 고객, 제공 가치를 명확히 합니다." },
        action: { en: "Specify one offer, buyer, price hypothesis, and delivery method.", ko: "하나의 제안, 구매자, 가격 가설, 제공 방식을 정합니다." },
        output: { en: "A testable offer with clear assumptions.", ko: "검증 가능한 제안과 핵심 가정을 정리합니다." },
      },
      {
        period: "60 days",
        title: { en: "Test paying demand", ko: "지불 수요 검증" },
        objective: { en: "Test demand through real conversations or small pilots.", ko: "실제 대화나 작은 Pilot을 통해 수요를 확인합니다." },
        action: { en: "Run customer conversations, proposals, or paid pilots.", ko: "고객 대화, 제안, 유료 Pilot을 진행합니다." },
        output: { en: "Evidence on willingness to pay and delivery fit.", ko: "지불 의사와 제공 적합성에 대한 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Set commitment level", ko: "몰입 수준 결정" },
        objective: { en: "Decide whether to extend validation, narrow the offer, or increase commitment.", ko: "검증 연장, 제안 축소 또는 몰입 확대를 결정합니다." },
        action: { en: "Review demand, pricing, delivery strain, and income runway.", ko: "수요, 가격, 제공 부담, 소득 여유를 함께 검토합니다." },
        output: { en: "A defined next investment level.", ko: "다음 투자와 몰입 수준을 명확히 합니다." },
      },
    ],
    closingQuestion: {
      en: "What evidence would prove that this is more than founder motivation?",
      ko: "이 선택이 창업 의지에 그치지 않는다는 것을 어떤 근거가 증명할 수 있나요?",
    },
  },
  "Industry Transition": {
    executiveSummary: {
      en: "This report reads the decision as an industry transition problem. The key issue is whether existing career capital can be translated into credible proof in the new market.",
      ko: "이 리포트는 현재 결정을 산업 전환의 문제로 읽습니다. 핵심은 기존 커리어 자산이 새로운 시장에서 설득력 있는 근거로 전환될 수 있는지입니다.",
    },
    primaryRisk: {
      name: "Career Capital Transfer Risk",
      meaning: {
        en: "Assuming prior experience will automatically be valued in the new industry.",
        ko: "기존 경험이 새로운 산업에서도 자동으로 가치 있게 인정될 것이라고 보는 리스크입니다.",
      },
      why: {
        en: "The new market may require different proof, language, networks, and execution context.",
        ko: "새 시장은 다른 근거, 언어, 네트워크, 실행 맥락을 요구할 수 있습니다.",
      },
      reduction: {
        en: "Translate prior achievements into relevant proof and test recognition with market insiders.",
        ko: "기존 성과를 관련 근거로 전환하고 시장 관계자에게 인정 가능성을 확인합니다.",
      },
    },
    conditions: {
      en: [
        "Prior career capital is translated into relevant proof.",
        "The new industry recognizes that proof as valuable.",
        "Capability gaps can be closed without excessive transition risk.",
      ],
      ko: [
        "기존 커리어 자산이 관련성 있는 근거로 전환됩니다.",
        "새로운 산업이 그 근거를 가치 있게 인정합니다.",
        "역량 격차를 과도한 전환 리스크 없이 줄일 수 있습니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Translate career capital", ko: "커리어 자산 전환" },
        objective: { en: "Map transferable value and evidence gaps.", ko: "이전 가능한 가치와 부족한 근거를 정리합니다." },
        action: { en: "Rewrite achievements in the new industry's language.", ko: "기존 성과를 새로운 산업의 언어로 재구성합니다." },
        output: { en: "A new-market evidence portfolio.", ko: "새 시장을 위한 근거 Portfolio를 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Test market recognition", ko: "시장 인정 검증" },
        objective: { en: "Confirm whether insiders recognize prior experience as relevant.", ko: "시장 관계자가 기존 경험을 관련 가치로 인정하는지 확인합니다." },
        action: { en: "Use interviews, projects, referrals, and targeted applications.", ko: "인터뷰, 프로젝트, 추천, 선별 지원을 활용합니다." },
        output: { en: "Evidence of recognition and remaining gaps.", ko: "인정 가능성과 남은 격차에 대한 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Decide transition scope", ko: "전환 범위 결정" },
        objective: { en: "Set the safest credible entry path.", ko: "가장 안정적이고 설득력 있는 진입 경로를 정합니다." },
        action: { en: "Review proof strength, capability gaps, demand, and runway.", ko: "근거의 강도, 역량 격차, 수요, 소득 여유를 검토합니다." },
        output: { en: "Enter, bridge, or extend proof-building.", ko: "진입, 연결 경로 또는 근거 축적 연장을 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What proof would make the new industry recognize your previous experience as relevant value?",
      ko: "새로운 산업이 기존 경험을 관련 가치로 인정하려면 어떤 근거가 필요할까요?",
    },
  },
  "Role Upgrade / Downgrade": {
    executiveSummary: {
      en: "This report reads the decision as a role-value question. The key issue is whether the role change expands long-term career value, not only title, workload, or short-term compensation.",
      ko: "이 리포트는 현재 결정을 역할 가치의 문제로 읽습니다. 핵심은 역할 변화가 직급, 업무량, 단기 보상을 넘어 장기 커리어 가치를 실제로 확장하는지입니다.",
    },
    primaryRisk: {
      name: "Title vs Career Value Risk",
      meaning: {
        en: "Focusing on title or status without testing the role's long-term value.",
        ko: "역할의 장기 가치를 확인하지 않고 직급이나 지위 변화에 집중하는 리스크입니다.",
      },
      why: {
        en: "A stronger title can still narrow authority, learning, strategic exposure, or mobility.",
        ko: "더 높은 직급도 권한, 학습, 전략 노출, 이동 가능성을 오히려 좁힐 수 있습니다.",
      },
      reduction: {
        en: "Compare authority, capability growth, exposure, workload, and future mobility.",
        ko: "권한, 역량 성장, 노출, 업무량, 향후 이동 가능성을 함께 비교합니다.",
      },
    },
    conditions: {
      en: [
        "The role expands decision authority or strategic exposure.",
        "Capability growth exceeds the cost of added workload.",
        "Future mobility improves beyond title or compensation.",
      ],
      ko: [
        "역할이 의사결정 권한이나 전략 노출을 넓힙니다.",
        "역량 성장이 추가 업무 부담보다 큽니다.",
        "직급이나 보상을 넘어 향후 이동 가능성이 강화됩니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Map role value", ko: "역할 가치 정리" },
        objective: { en: "Separate title from authority, learning, and mobility.", ko: "직급과 권한, 학습, 이동 가능성을 구분합니다." },
        action: { en: "Compare mandate, exposure, workload, capability growth, and compensation.", ko: "권한, 노출, 업무량, 역량 성장, 보상을 비교합니다." },
        output: { en: "A role-value comparison beyond status.", ko: "지위를 넘어선 역할 가치 비교표를 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Validate role reality", ko: "역할 현실 검증" },
        objective: { en: "Test whether the advertised role matches operating reality.", ko: "제시된 역할과 실제 운영 현실이 일치하는지 확인합니다." },
        action: { en: "Speak with stakeholders and clarify mandate, resources, and success metrics.", ko: "관계자와 권한, 자원, 성공 기준을 확인합니다." },
        output: { en: "Evidence of real authority and growth potential.", ko: "실질 권한과 성장 가능성에 대한 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Set role conditions", ko: "역할 조건 결정" },
        objective: { en: "Decide whether the role expands durable career value.", ko: "역할이 지속 가능한 커리어 가치를 넓히는지 판단합니다." },
        action: { en: "Review authority, learning, load, compensation, and mobility.", ko: "권한, 학습, 부담, 보상, 이동 가능성을 검토합니다." },
        output: { en: "Accept, negotiate, decline, or redesign.", ko: "수락, 협상, 거절 또는 역할 재설계를 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What would prove that this role changes career value, not only title or workload?",
      ko: "이 역할이 직급이나 업무량뿐 아니라 커리어 가치를 바꾼다는 것을 무엇이 증명할 수 있나요?",
    },
  },
  "Burnout-driven Decision": {
    executiveSummary: {
      en: "This report reads the decision as a fatigue and transition-readiness question. The key issue is separating what requires recovery from what requires a real career redesign.",
      ko: "이 리포트는 현재 결정을 피로감과 전환 준비도의 문제로 읽습니다. 핵심은 회복이 필요한 문제와 실제 커리어 재설계가 필요한 문제를 분리하는 것입니다.",
    },
    primaryRisk: {
      name: "Fatigue-Driven Urgency",
      meaning: {
        en: "Reading current fatigue as proof that a full career transition is ready.",
        ko: "현재의 피로감을 전면적인 커리어 전환이 준비됐다는 근거로 해석하는 리스크입니다.",
      },
      why: {
        en: "Recovery needs can intensify urgency without improving market or execution readiness.",
        ko: "회복의 필요성은 시급성을 키울 수 있지만 시장과 실행 준비도를 높이지는 않습니다.",
      },
      reduction: {
        en: "Separate recovery actions from market validation and career redesign tests.",
        ko: "회복을 위한 조치와 시장 검증, 커리어 재설계 실험을 분리합니다.",
      },
    },
    conditions: {
      en: [
        "Recovery needs are separated from transition needs.",
        "Market validation and execution capacity remain credible after recovery.",
        "Financial safety is protected before major change.",
      ],
      ko: [
        "회복이 필요한 문제와 전환이 필요한 문제를 구분합니다.",
        "회복 이후에도 시장 검증과 실행력이 충분합니다.",
        "큰 변화를 시작하기 전에 재정 안정성을 보호합니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Separate recovery needs", ko: "회복 필요 구분" },
        objective: { en: "Distinguish exhaustion from structural career mismatch.", ko: "소진과 구조적인 커리어 불일치를 구분합니다." },
        action: { en: "Map workload, boundaries, health, role design, and transition assumptions.", ko: "업무량, 경계, 건강, 역할 설계, 전환 가정을 정리합니다." },
        output: { en: "A recovery-versus-redesign diagnosis.", ko: "회복과 재설계 필요를 구분한 진단을 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Test energy recovery", ko: "에너지 회복 검증" },
        objective: { en: "See whether energy improves after workload or boundary changes.", ko: "업무량이나 경계 조정 후 에너지가 회복되는지 확인합니다." },
        action: { en: "Run controlled changes while keeping external validation active.", ko: "외부 검증을 유지하면서 통제된 변화를 실행합니다." },
        output: { en: "Evidence of what fatigue changes and what remains structural.", ko: "피로로 인한 문제와 남아 있는 구조적 문제를 구분합니다." },
      },
      {
        period: "90 days",
        title: { en: "Reassess transition need", ko: "전환 필요 재평가" },
        objective: { en: "Decide whether transition is still needed after recovery signals clarify.", ko: "회복 신호가 명확해진 뒤에도 전환이 필요한지 판단합니다." },
        action: { en: "Review energy, role fit, market evidence, capacity, and safety.", ko: "에너지, 역할 적합성, 시장 근거, 실행력, 안정성을 검토합니다." },
        output: { en: "Recover, redesign, validate further, or transition.", ko: "회복, 역할 재설계, 추가 검증 또는 전환을 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What would still need to change if your energy recovered?",
      ko: "에너지가 회복된 이후에도 여전히 바뀌어야 할 것은 무엇인가요?",
    },
  },
  "Family Constraint-heavy Decision": {
    executiveSummary: {
      en: "This report reads the decision as a family-constraint decision architecture. The key issue is whether the preferred career path can actually work within family, location, timing, and financial constraints.",
      ko: "이 리포트는 현재 결정을 가족 조건이 강하게 작용하는 결정 구조로 읽습니다. 핵심은 선호하는 커리어 경로가 가족, 지역, 시기, 재정 조건 안에서 실제로 작동 가능한지입니다.",
    },
    primaryRisk: {
      name: "Career-Family Fit Risk",
      meaning: {
        en: "Designing a professionally attractive move that fails under family, location, or timing constraints.",
        ko: "커리어 측면에서는 매력적이지만 가족, 지역, 시기 조건 안에서 작동하지 않는 선택을 설계하는 리스크입니다.",
      },
      why: {
        en: "A path that cannot operate within family reality is not structurally sustainable.",
        ko: "가족의 현실 안에서 작동하지 않는 경로는 구조적으로 지속 가능하지 않습니다.",
      },
      reduction: {
        en: "Test logistics, support, timing, and financial resilience before commitment.",
        ko: "몰입도를 높이기 전에 생활 조건, 지원, 시기, 재정 안정성을 검증합니다.",
      },
    },
    conditions: {
      en: [
        "The preferred path works within family and location constraints.",
        "Financial stability is not made too fragile.",
        "Timing and support systems are realistic.",
      ],
      ko: [
        "선호하는 경로가 가족과 지역 조건 안에서 작동합니다.",
        "재정 안정성이 지나치게 약해지지 않습니다.",
        "시기와 지원 체계가 현실적입니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Map family constraints", ko: "가족 조건 정리" },
        objective: { en: "Make family, location, timing, and financial constraints explicit.", ko: "가족, 지역, 시기, 재정 조건을 명확히 합니다." },
        action: { en: "Document logistics, non-negotiables, support, and downside exposure.", ko: "생활 조건, 필수 조건, 지원, 하방 리스크를 정리합니다." },
        output: { en: "A family-operating constraint map.", ko: "가족 생활 조건 지도를 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Test path feasibility", ko: "경로 실행 가능성 검증" },
        objective: { en: "Test whether the preferred path can operate within those constraints.", ko: "선호하는 경로가 해당 조건 안에서 작동하는지 확인합니다." },
        action: { en: "Run scheduling, location, childcare, support, and budget scenarios.", ko: "일정, 지역, 육아, 지원, 예산 Scenario를 검토합니다." },
        output: { en: "Evidence of family and career fit.", ko: "가족과 커리어 적합성에 대한 근거를 확보합니다." },
      },
      {
        period: "90 days",
        title: { en: "Choose proceed or redesign", ko: "진행 또는 재설계 결정" },
        objective: { en: "Decide whether to proceed, delay, or redesign the path.", ko: "진행, 연기 또는 경로 재설계를 판단합니다." },
        action: { en: "Review career value, family fit, timing, support, and finances.", ko: "커리어 가치, 가족 적합성, 시기, 지원, 재정을 검토합니다." },
        output: { en: "A realistic family-compatible decision condition.", ko: "가족 현실과 양립 가능한 결정 조건을 정합니다." },
      },
    ],
    closingQuestion: {
      en: "What must be true for this path to work within family reality?",
      ko: "이 경로가 가족의 현실 안에서 작동하려면 무엇이 충족되어야 할까요?",
    },
  },
  "General Career Reconfiguration": {
    executiveSummary: {
      en: "This report reads the decision as a general career reconfiguration problem. The key issue is clarifying which option protects stability, which option creates future value, and what must be validated first.",
      ko: "이 리포트는 현재 결정을 전반적인 커리어 재구성 문제로 읽습니다. 핵심은 어떤 선택이 안정성을 보호하고, 어떤 선택이 미래 가치를 만들며, 무엇을 먼저 검증해야 하는지 정리하는 것입니다.",
    },
    primaryRisk: {
      name: "Premature Commitment",
      meaning: {
        en: "Increasing commitment before stability, future value, and validation evidence are clear.",
        ko: "안정성, 미래 가치, 검증 근거가 명확해지기 전에 몰입도를 높이는 리스크입니다.",
      },
      why: {
        en: "A large move can outpace the evidence supporting it.",
        ko: "큰 변화가 이를 뒷받침하는 근거보다 앞서갈 수 있습니다.",
      },
      reduction: {
        en: "Clarify stability, future value, reversibility, and missing evidence together.",
        ko: "안정성, 미래 가치, Reversibility, 부족한 근거를 함께 정리합니다.",
      },
    },
    conditions: {
      en: [
        "Stability and future value are considered together.",
        "Reversibility is protected while evidence develops.",
        "The most important uncertainty is tested before commitment increases.",
      ],
      ko: [
        "안정성과 미래 가치를 함께 검토합니다.",
        "근거를 쌓는 동안 Reversibility를 보호합니다.",
        "몰입도를 높이기 전에 가장 중요한 불확실성을 검증합니다.",
      ],
    },
    plan: [
      {
        period: "30 days",
        title: { en: "Clarify decision structure", ko: "결정 구조 정리" },
        objective: { en: "Separate stability, future value, and uncertainty.", ko: "안정성, 미래 가치, 불확실성을 구분합니다." },
        action: { en: "Map the strongest claim, trade-off, and missing proof behind each option.", ko: "각 Option의 핵심 주장, trade-off, 부족한 근거를 정리합니다." },
        output: { en: "A prioritized validation map.", ko: "우선순위가 표시된 검증 지도를 만듭니다." },
      },
      {
        period: "60 days",
        title: { en: "Test critical evidence", ko: "핵심 근거 검증" },
        objective: { en: "Reduce the uncertainty that matters most.", ko: "가장 중요한 불확실성을 줄입니다." },
        action: { en: "Run targeted market, role, support, and feasibility tests.", ko: "시장, 역할, 지원, 실행 가능성을 선별적으로 검증합니다." },
        output: { en: "A documented view of evidence strength and gaps.", ko: "근거의 강도와 부족한 부분을 기록합니다." },
      },
      {
        period: "90 days",
        title: { en: "Set decision conditions", ko: "결정 조건 설정" },
        objective: { en: "Define the threshold for increasing commitment.", ko: "몰입도를 높일 기준을 정합니다." },
        action: { en: "Review stability, future value, evidence, load, and reversibility.", ko: "안정성, 미래 가치, 근거, 부담, Reversibility를 검토합니다." },
        output: { en: "Proceed, extend validation, or protect the current path.", ko: "진행, 검증 연장 또는 현재 경로 보호를 결정합니다." },
      },
    ],
    closingQuestion: {
      en: "What evidence would make the decision more defensible?",
      ko: "어떤 근거가 확인되면 이 결정의 설명력이 더 커질까요?",
    },
  },
};

const caseTypeRules: Array<{ type: Exclude<CaseType, "General Career Reconfiguration">; keywords: string[] }> = [
  {
    type: "Family Constraint-heavy Decision",
    keywords: ["family", "spouse", "children", "parents", "childcare", "school", "family location", "가족", "배우자", "아이", "자녀", "부모", "육아", "학교", "가족 사정"],
  },
  {
    type: "Burnout-driven Decision",
    keywords: ["burnout", "fatigue", "exhaustion", "stress", "low energy", "escape", "번아웃", "피로", "지침", "스트레스", "회피", "쉬고 싶음"],
  },
  {
    type: "Entrepreneurship",
    keywords: ["startup", "founder", "business launch", "venture", "consulting business", "side business", "entrepreneurship", "창업", "사업", "스타트업", "독립", "자문 사업", "컨설팅 사업"],
  },
  {
    type: "MBA / EMBA / PhD Decision",
    keywords: ["mba", "emba", "phd", "doctoral program", "graduate school", "business school", "academic path", "박사", "석사", "학위", "대학원", "유학", "연구자"],
  },
  {
    type: "Overseas Relocation",
    keywords: ["relocation", "move abroad", "overseas assignment", "immigration", "visa", "singapore", "us", "korea", "china", "해외 이동", "해외 근무", "이주", "비자", "주재원", "해외 커리어"],
  },
  {
    type: "Industry Transition",
    keywords: ["changing industry", "new sector", "tech", "ai", "consulting", "finance", "industry shift", "산업 전환", "업종 변경", "산업 이동", "새로운 산업", "컨설팅", "금융"],
  },
  {
    type: "Role Upgrade / Downgrade",
    keywords: ["promotion", "senior role", "executive role", "bigger role", "lower title", "role change", "직급", "승진", "임원", "역할 확대", "역할 축소", "포지션 변경"],
  },
  {
    type: "Corporate Stay vs Exit",
    keywords: ["stay at current company", "leaving company", "resignation", "corporate career", "job change", "exit", "회사 유지", "퇴사", "이직", "현 직장", "대기업", "조직 내 경력"],
  },
];

function includesCaseKeyword(text: string, keyword: string) {
  if (/^[a-z0-9]+$/i.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  }

  return text.includes(keyword.toLowerCase());
}

function detectCaseType(previewAnswers: PreviewAnswers, fullAnswers: Record<number, string>): CaseType {
  const answerText = [...Object.values(previewAnswers), ...Object.values(fullAnswers)]
    .join(" ")
    .toLowerCase();

  return (
    caseTypeRules.find((rule) => rule.keywords.some((keyword) => includesCaseKeyword(answerText, keyword)))?.type ??
    "General Career Reconfiguration"
  );
}

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mb-7 max-w-3xl">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Marker({ children }: { children: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border bg-secondary/35 text-xs font-semibold text-foreground">
      {children}
    </span>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-sm border border-border bg-secondary/35 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </span>
  );
}

function reportOptionLabel(value: string, fallback: string) {
  const normalized = value.trim();
  return normalized.length >= 3 ? normalized : fallback;
}

export default function AmcWebMvp() {
  const [language, setLanguage] = useState<Language>("en");
  const [previewStarted, setPreviewStarted] = useState(false);
  const [previewGenerated, setPreviewGenerated] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [dashboardGenerated, setDashboardGenerated] = useState(false);
  const [showPdfReportView, setShowPdfReportView] = useState(false);
  const [answers, setAnswers] = useState<PreviewAnswers>(initialPreviewAnswers);
  const [fullIntakeAnswers, setFullIntakeAnswers] = useState<Record<number, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([intakeGroups[0].title]);

  const isKo = language === "ko";
  const t = (en: string, ko: string) => (isKo ? ko : en);
  const optionALabel = reportOptionLabel(answers.optionA, t("Option A", "선택지 A"));
  const optionBLabel = reportOptionLabel(answers.optionB, t("Option B", "선택지 B"));
  const decisionContext =
    answers.decision.trim() ||
    fullIntakeAnswers[1]?.trim() ||
    "A comparative career decision requiring staged validation.";
  const reportDate = useMemo(
    () =>
      new Intl.DateTimeFormat(isKo ? "ko-KR" : "en", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    [isKo],
  );
  const requiredPreviewReady = Boolean(answers.decision.trim() && answers.optionA.trim() && answers.optionB.trim());
  const answeredQuestionCount = useMemo(
    () => Object.values(fullIntakeAnswers).filter((value) => value.trim()).length,
    [fullIntakeAnswers],
  );
  const progress = Math.round((answeredQuestionCount / totalFullIntakeQuestions) * 100);
  const fullIntakeComplete = answeredQuestionCount === totalFullIntakeQuestions;
  const expandedGroupSet = useMemo(() => new Set(expandedGroups), [expandedGroups]);
  const detectedCaseType = useMemo(
    () => detectCaseType(answers, fullIntakeAnswers),
    [answers, fullIntakeAnswers],
  );
  const caseTypeReading = caseTypeInterpretations[detectedCaseType];
  const caseSpecificReading = caseSpecificReadings[detectedCaseType];
  const caseReportBranch = caseReportBranches[detectedCaseType];

  const updateAnswer = (field: keyof PreviewAnswers, value: string) => {
    setAnswers((current) => ({ ...current, [field]: value }));
  };

  const startPreview = () => {
    setPreviewStarted(true);
    requestAnimationFrame(() => {
      document.getElementById("preview-intake")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const generatePreview = () => {
    setPreviewGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("preview-dashboard")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const simulateUnlock = (tier: Tier) => {
    setSelectedTier(tier);
    setDashboardGenerated(false);
    requestAnimationFrame(() => {
      document.getElementById("full-intake")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const updateFullIntakeAnswer = (questionId: number, value: string) => {
    setFullIntakeAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  };

  const fillSampleAnswers = () => {
    const sampleAnswers = Object.fromEntries(
      intakeGroups.flatMap((group) =>
        group.questions.map((question) => [
          question.id,
          isKo ? intakeQuestionsKo[question.id].sample : question.sample,
        ]),
      ),
    ) as Record<number, string>;
    setFullIntakeAnswers(sampleAnswers);
    setExpandedGroups(intakeGroups.map((group) => group.title));
  };

  const generateDashboard = () => {
    setDashboardGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("full-dashboard")?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const generateDetailedReport = () => {
    setShowPdfReportView(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showPdfReportView) {
    const snapshotItems = [
      {
        label: "Decision Type",
        value: t("Staged Reconfiguration", "단계적 전환 설계"),
        reading: t("Sequence validation before increasing exposure.", "전환 범위를 넓히기 전에 근거를 순서대로 검증합니다."),
      },
      {
        label: "Core Tension",
        value: t("Identity Pull vs Safety Margin", "장기 방향성과 단기 안정성"),
        reading: t("Long-term fit competes with near-term operating stability.", "장기 방향성은 Option B에, 단기 안정성은 Option A에 더 강합니다."),
      },
      {
        label: "Primary Risk",
        value: caseReportBranch.primaryRisk.name,
        reading: isKo ? caseReportBranch.primaryRisk.meaning.ko : caseReportBranch.primaryRisk.meaning.en,
      },
      {
        label: "Safety Margin",
        value: t(`Stronger in ${optionALabel}`, `${optionALabel}가 더 강함`),
        reading: t("The current path protects runway and reversibility.", "현재 경로가 소득 안정성과 되돌릴 수 있는 여지를 보호합니다."),
      },
      {
        label: "Commitment Condition",
        value: t("Validation, Runway, Reversibility", "검증, 안정성, Reversibility"),
        reading: t("All three conditions should strengthen together.", "세 조건이 함께 강화되어야 전환을 설명할 수 있습니다."),
      },
    ];
    const executiveSummaryItems = isKo ? reportExecutiveSummaryKo : reportExecutiveSummary;
    const pressureSignals = isKo ? externalPressureSignalsKo : externalPressureSignals;
    const baseRiskItems = isKo ? reportRiskItemsKo : reportRiskItems;
    const riskMapItems = [
      {
        label: "Primary Risk",
        name: caseReportBranch.primaryRisk.name,
        meaning: isKo ? caseReportBranch.primaryRisk.meaning.ko : caseReportBranch.primaryRisk.meaning.en,
        why: isKo ? caseReportBranch.primaryRisk.why.ko : caseReportBranch.primaryRisk.why.en,
        reduction: isKo ? caseReportBranch.primaryRisk.reduction.ko : caseReportBranch.primaryRisk.reduction.en,
      },
      ...baseRiskItems.slice(1),
    ];
    const planItems = caseReportBranch.plan.map((item) => ({
      period: item.period,
      title: isKo ? item.title.ko : item.title.en,
      objective: isKo ? item.objective.ko : item.objective.en,
      action: isKo ? item.action.ko : item.action.en,
      output: isKo ? item.output.ko : item.output.en,
    }));
    const baseClosingQuestions = isKo ? reflectionQuestionsKo : reflectionQuestions;
    const closingQuestions = [
      isKo ? caseReportBranch.closingQuestion.ko : caseReportBranch.closingQuestion.en,
      ...baseClosingQuestions.slice(1),
    ];
    const reportConditions = isKo ? caseReportBranch.conditions.ko : caseReportBranch.conditions.en;

    return (
      <div lang={isKo ? "ko" : "en"} className="pdf-report-shell min-h-screen bg-[#e9e9e7] text-[#202326]">
        <div className="pdf-report-controls sticky top-0 z-20 border-b border-black/10 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-[960px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowPdfReportView(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border border-black/15 bg-white px-4 text-sm font-medium"
            >
              {t("Back to Dashboard", "Dashboard로 돌아가기")}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#202326] px-4 text-sm font-medium text-white"
            >
              {t("Print / Save Report as PDF", "인쇄 / PDF로 저장")}
            </button>
          </div>
        </div>

        <article className="pdf-report-view mx-auto my-8 max-w-[960px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
          <section className="pdf-cover relative flex min-h-[760px] flex-col justify-between overflow-hidden border-b border-black/15 p-10 sm:p-16">
            <div className="absolute right-0 top-0 h-full w-[31%] bg-[#202326]" aria-hidden="true" />
            <div className="absolute right-[31%] top-0 h-full w-px bg-black/15" aria-hidden="true" />
            <div className="relative z-10 max-w-[64%]">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-black/70" aria-hidden="true" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/55">
                  AMC - All of My Career
                </p>
              </div>
              <p className="mt-16 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/42">
                {t("Private career decision architecture", "Private Career Decision Architecture")}
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">
                Strategic Career Decision Report
              </h1>
              <p className="mt-8 text-base font-medium tracking-[0.1em] text-black/58">Tip in. Decide. Value up.</p>
            </div>
            <div className="relative z-10 max-w-[64%]">
              <p className="border-l-2 border-black pl-4 text-sm font-semibold leading-6">
                {t("Private structural interpretation report", "개인 커리어 결정을 위한 구조 해석 Report")}
              </p>
              <dl className="mt-9 grid grid-cols-1 border-y border-black/20 text-sm sm:grid-cols-2">
                <div className="py-5 sm:border-r sm:border-black/15 sm:pr-5">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">{t("Date", "작성일")}</dt>
                  <dd className="mt-2 font-medium">{reportDate}</dd>
                </div>
                <div className="py-5 sm:pl-5">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
                    Decision type
                  </dt>
                  <dd className="mt-2 font-medium">{t("Staged Reconfiguration", "단계적 전환 설계")}</dd>
                </div>
              </dl>
              <div className="mt-5 border-l-2 border-black pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Case Type</p>
                <p className="mt-2 text-sm font-semibold">{detectedCaseType}</p>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42">
                {t("Prepared for private career decision review", "개인 커리어 결정 검토용")}
              </p>
            </div>
          </section>

          <div className="pdf-report-body">
            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">01 / Executive Summary</p>
              <div className="mt-5 border-y border-black/20 py-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">Core message</p>
                <h2 className="pdf-executive-message mt-3">
                  {t(
                    "The decision is a validation problem before it is a commitment problem.",
                    "이 결정은 확정의 문제가 아니라 검증의 문제에 가깝습니다.",
                  )}
                </h2>
              </div>
              <div className="mt-8 grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
                <div className="pdf-keep-together">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Decision context</p>
                  <p className="mt-3 text-sm leading-7 text-black/65">{decisionContext}</p>
                  <div className="mt-7 border-l-2 border-black pl-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Structural read</p>
                    <p className="mt-2 text-sm font-semibold leading-6">
                      {t(
                        "Preserve optionality while converting uncertainty into evidence.",
                        "선택 가능성을 유지하면서 불확실성을 검증 가능한 근거로 바꿉니다.",
                      )}
                    </p>
                  </div>
                  <div className="mt-7 border-l-2 border-black/35 pl-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">Case Type</p>
                    <p className="mt-2 text-sm font-semibold">{detectedCaseType}</p>
                    <p className="mt-2 text-sm leading-6 text-black/60">
                      {isKo ? caseReportBranch.executiveSummary.ko : caseReportBranch.executiveSummary.en}
                    </p>
                  </div>
                </div>
                <div className="border-t-2 border-black">
                  {executiveSummaryItems.map((item, index) => (
                    <div
                      key={item.lead}
                      className="pdf-keep-together grid grid-cols-[32px_1fr] gap-3 border-b border-black/15 py-3.5"
                    >
                      <span className="text-xs font-semibold text-black/40">{String(index + 1).padStart(2, "0")}</span>
                      <p className="text-sm leading-6 text-black/65">
                        <strong className="font-semibold text-black">{item.lead}.</strong> {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">02 / Decision Snapshot</p>
              <h2 className="pdf-section-heading mt-3">
                {t("Five signals define the current decision architecture.", "현재 결정의 구조를 다섯 가지 신호로 정리합니다.")}
              </h2>
              <div className="pdf-snapshot-grid mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {snapshotItems.map((item, index) => (
                  <div key={item.label} className="pdf-snapshot-card pdf-keep-together">
                    <div className="flex items-center justify-between border-b border-black/12 pb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/50">{item.label}</p>
                      <p className="text-[10px] font-semibold text-black/30">{String(index + 1).padStart(2, "0")}</p>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-5">{item.value}</p>
                    <p className="mt-3 text-xs leading-5 text-black/55">{item.reading}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">03 / Option A / Option B Comparative Read</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="pdf-section-heading max-w-xl">
                  {t("The options optimize for different forms of career value.", "두 Option은 서로 다른 커리어 가치를 보호합니다.")}
                </h2>
                <p className="text-xs font-medium text-black/50">
                  {t("Structural reading, not recommendation", "추천이 아닌 Structural Reading")}
                </p>
              </div>
              <div className="mt-7 overflow-hidden border border-black/15">
                <table className="pdf-comparison-table w-full border-collapse">
                  <colgroup>
                    <col className="w-[19%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[41%]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>{optionALabel}</th>
                      <th>{optionBLabel}</th>
                      <th>Structural reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((row) => (
                      <tr key={row.dimension}>
                        <td>{row.dimension}</td>
                        <td><span className="pdf-signal-label">{row.optionA}</span></td>
                        <td><span className="pdf-signal-label">{row.optionB}</span></td>
                        <td className="pdf-structural-reading">
                          {isKo
                            ? {
                                "Income Stability": "Option A가 단기 소득 안정성을 더 강하게 보호합니다.",
                                "Identity Alignment": "Option B가 장기 방향성과 더 강하게 연결됩니다.",
                                "External Validation": "Option B는 시장과 기관의 추가 검증이 필요합니다.",
                                "Execution Burden": "Option B는 더 높은 실행 부담과 순서 설계가 필요합니다.",
                                Reversibility: "단계적 접근이 되돌릴 수 있는 여지를 보호합니다.",
                              }[row.dimension]
                            : row.reading}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>Structural Reading</td>
                      <td><strong className="text-black">{t("Protects continuity", "안정성 보호")}</strong></td>
                      <td><strong className="text-black">{t("Expands identity fit", "장기 방향성 강화")}</strong></td>
                      <td className="pdf-structural-reading">
                        {t("Staging preserves optionality while evidence develops.", "단계적 검증이 선택 가능성을 보호합니다.")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">04 / External Pressure Map</p>
              <h2 className="pdf-section-heading mt-3">
                {t(
                  "External signals support exploration more strongly than immediate conversion.",
                  "외부 신호는 즉시 전환보다 추가 검증을 뒷받침합니다.",
                )}
              </h2>
              <div className="mt-7 grid grid-cols-1 gap-px bg-black/15 sm:grid-cols-2">
                {pressureSignals.map((signal) => (
                  <div key={signal.label} className="pdf-keep-together bg-[#f6f6f4] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-black/45">{signal.label}</p>
                    <p className="mt-3 text-lg font-semibold">{signal.value}</p>
                    <p className="mt-3 text-sm leading-6 text-black/60">{signal.reading}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">05 / Internal Readiness Map</p>
              <h2 className="pdf-section-heading mt-3">
                {t(
                  "Readiness is mixed: the strategic pull is clear, but the operating base is incomplete.",
                  "장기 방향성은 분명하지만 전환을 뒷받침할 기반은 아직 충분하지 않습니다.",
                )}
              </h2>
              <div className="mt-8 space-y-4">
                {internalSignals.map((signal, index) => (
                  <div key={signal.label} className="pdf-keep-together grid grid-cols-[1fr_1.4fr] items-center gap-5 border-b border-black/15 pb-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">{signal.label}</p>
                      <p className="mt-1 text-sm font-semibold">
                        {isKo ? ["부분적으로 명확", "Option A가 더 강함", "형성 중", "높음", "보통"][index] : signal.status}
                      </p>
                    </div>
                    <div className="h-2 bg-black/8">
                      <div className="h-2 bg-[#202326]" style={{ width: signal.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">06 / Safety Margin &amp; Reversibility</p>
              <h2 className="pdf-section-heading mt-3">
                {t("The safer path protects time; the growth path requires proof.", "Option A는 안정성을 보호하고, Option B는 더 강한 검증을 요구합니다.")}
              </h2>
              <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {(isKo
                  ? [
                      {
                        label: "What the safer path protects",
                        text: `${optionALabel}는 소득의 연속성, 현재의 신뢰도, 전환 전 검증 시간을 보호합니다.`,
                      },
                      {
                        label: "What the growth path requires",
                        text: `${optionBLabel}는 외부 지원, 재정적 여유, 반복 가능한 실행 역량, 시장 근거가 필요합니다.`,
                      },
                      {
                        label: "What must be validated",
                        text: "수요, 기관의 지원, 재정적 안정성, 되돌릴 수 있는 전환 순서를 먼저 확인해야 합니다.",
                      },
                    ]
                  : [
                  {
                    label: "What the safer path protects",
                    text: `${optionALabel} protects income continuity, existing credibility, and the capacity to validate a second platform without immediate conversion pressure.`,
                  },
                  {
                    label: "What the growth path requires",
                    text: `${optionBLabel} requires stronger external sponsorship, a protected runway, repeatable execution capacity, and evidence that identity alignment can become durable field value.`,
                  },
                  {
                    label: "What must be validated",
                    text: "Demand, institutional support, financial resilience, and a reversible sequence must become clearer before deeper commitment is structurally defensible.",
                  },
                ]).map((item) => (
                  <div key={item.label} className="pdf-keep-together border-t-2 border-black bg-[#f6f6f4] p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">{item.label}</p>
                    <p className="mt-4 text-sm leading-6 text-black/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">07 / Structural Risk Diagnosis</p>
              <h2 className="pdf-section-heading mt-3">
                {t("Risk sits in both action and inaction - but through different mechanisms.", "전환과 유지 모두 리스크가 있지만 작동 방식은 다릅니다.")}
              </h2>
              <div className="pdf-risk-map mt-8">
                {riskMapItems.map((risk, index) => (
                  <div key={risk.label} className="pdf-risk-card pdf-keep-together">
                    <div className="pdf-risk-card-header">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">{risk.label}</p>
                        <p className="mt-2 text-lg font-semibold leading-6">{risk.name}</p>
                      </div>
                      <p className="text-2xl font-light text-white/25">{String(index + 1).padStart(2, "0")}</p>
                    </div>
                    <div className="divide-y divide-black/12">
                      {[
                        ["What it means", risk.meaning],
                        ["Why it matters", risk.why],
                        ["What reduces the risk", risk.reduction],
                      ].map(([label, text]) => (
                        <div key={label} className="p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                            {isKo
                              ? { "What it means": "의미", "Why it matters": "중요한 이유", "What reduces the risk": "리스크를 낮추는 조건" }[label]
                              : label}
                          </p>
                          <p className="mt-2 text-sm leading-5 text-black/65">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">08 / Decision Conditions</p>
              <h2 className="pdf-section-heading mt-3">
                {t(
                  `Three conditions make ${detectedCaseType} more defensible.`,
                  `${detectedCaseType}의 설명력을 높이는 세 가지 조건입니다.`,
                )}
              </h2>
              <div className="pdf-keep-together mt-7 border-t-2 border-black bg-[#f6f6f4] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
                  Case-Specific Decision Conditions
                </p>
                <ol className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {reportConditions.map((condition, index) => (
                    <li key={condition} className="grid grid-cols-[24px_1fr] gap-3 text-sm leading-6 text-black/65">
                      <span className="font-semibold text-black">{index + 1}</span>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="pdf-report-section pdf-page-break p-8 sm:p-12">
              <p className="pdf-kicker">09 / 30 / 60 / 90-Day Validation Plan</p>
              <h2 className="pdf-section-heading mt-3">
                {t("Sequence evidence before increasing commitment.", "결정을 앞당기기보다 근거를 순서대로 검증합니다.")}
              </h2>
              <div className="pdf-timeline mt-10 grid grid-cols-1 lg:grid-cols-3">
                {planItems.map((item, index) => (
                  <div key={item.period} className="pdf-timeline-step pdf-keep-together">
                    <div className="pdf-timeline-marker">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">{item.period}</p>
                    <h3 className="mt-2 text-xl font-semibold leading-6">{item.title}</h3>
                    <dl className="mt-5 space-y-4">
                      {[
                        ["Objective", item.objective],
                        ["Action focus", item.action],
                        ["Decision output", item.output],
                      ].map(([label, text]) => (
                        <div key={label}>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                            {isKo ? { Objective: "목표", "Action focus": "실행 항목", "Decision output": "결정 결과" }[label] : label}
                          </dt>
                          <dd className="mt-1.5 text-sm leading-5 text-black/65">{text}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </section>

            <section className="pdf-report-section p-8 sm:p-12">
              <p className="pdf-kicker">10 / Closing Reflection</p>
              <div className="mt-4 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <h2 className="pdf-section-heading">
                    {t(
                      "The next move is to improve the quality of the decision conditions.",
                      "다음 단계는 결정을 확정하는 것이 아니라 Decision Conditions를 더 명확히 만드는 것입니다.",
                    )}
                  </h2>
                  <p className="mt-5 text-sm leading-7 text-black/60">
                    {t(
                      "These questions are designed to expose weak evidence, hidden exposure, and missing support before the decision becomes harder to reverse.",
                      "되돌리기 어려운 결정을 내리기 전에 부족한 근거, 숨은 리스크, 필요한 지원을 확인합니다.",
                    )}
                  </p>
                </div>
                <ol className="border-t-2 border-black">
                  {closingQuestions.map((question, index) => (
                    <li key={question} className="pdf-keep-together grid grid-cols-[36px_1fr] gap-3 border-b border-black/15 py-4">
                      <span className="text-xs font-semibold text-black/40">{String(index + 1).padStart(2, "0")}</span>
                      <p className="text-sm font-semibold leading-6">{question}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-14 flex items-end justify-between border-t border-black/20 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                <span>AMC - All of My Career</span>
                <span>{t("Private structural interpretation", "Private Structural Reading")}</span>
              </div>
            </section>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div lang={isKo ? "ko" : "en"} className="amc-web-mvp-shell min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <section className="grid min-h-[86vh] grid-cols-1 gap-10 border-b border-border py-14 sm:py-18 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div>
            <div className="mb-8 flex items-center justify-between gap-5">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                AMC - All of My Career
              </p>
              <div
                role="group"
                aria-label="Language"
                className="inline-flex rounded-md border border-border bg-card p-1 shadow-sm"
              >
                {(["en", "ko"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    aria-pressed={language === item}
                    className={`inline-flex h-8 min-w-10 items-center justify-center rounded-sm px-3 text-xs font-semibold tracking-[0.08em] transition-colors ${
                      language === item
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item === "en" ? "EN" : "KR"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-5 text-sm font-medium tracking-[0.12em] text-muted-foreground">Tip in. Decide. Value up.</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t(
                "AMC sees structure.",
                "AMC는 구조를 봅니다.",
              )}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t(
                "A private web-based structural interpretation dashboard for serious career decisions.",
                "중요한 커리어 결정을 구조적으로 검토하는 비공개 웹 Dashboard입니다.",
              )}
            </p>
            <p className="mt-4 inline-flex rounded-sm border border-border bg-secondary/30 px-3 py-2 text-sm font-medium">
              {t("No account required to start.", "계정 없이 시작할 수 있습니다.")}
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t(
                "Your quick preview uses 7 questions. The full report requires a detailed intake after unlock.",
                "Preview는 7개 질문으로 시작합니다. 전체 Report는 상세 Intake를 바탕으로 구성됩니다.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startPreview}
                className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                {t("Start Free Structural Preview", "무료 Structural Preview 시작")}
              </button>
              <a
                href="#how-amc-works"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground"
              >
                {t("See how AMC works", "AMC 진행 방식 보기")}
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {t("What AMC shows", "AMC가 보여주는 것")}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Decision Type", "Core Tension", "Risk Diagnosis", "Decision Conditions"].map(
                (item, index) => (
                  <div key={item} className="rounded-md border border-border bg-background p-4">
                    <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                    <p className="mt-3 text-sm font-semibold">{item}</p>
                  </div>
                ),
              )}
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              {t(
                "A structured mirror for tension, trade-offs, risk concentration, and commitment conditions.",
                "선택의 조건과 리스크를 함께 점검합니다.",
              )}
            </p>
          </aside>
        </section>

        <section id="how-amc-works" className="border-b border-border py-12 sm:py-14">
          <SectionHeader
            eyebrow={t("How AMC works", "AMC 진행 방식")}
            title={t(
              "A staged path from quick signal to full dashboard.",
              "Preview에서 Full Web Dashboard까지 단계적으로 확인합니다.",
            )}
            body={t(
              "AMC sees structure.",
              "AMC는 구조를 봅니다.",
            )}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.step}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {isKo
                    ? [
                        "현재 커리어 결정에 관한 핵심 질문에 답합니다.",
                        "결정 안의 Core Tension, trade-off, 리스크, 조건을 확인합니다.",
                        "확인한 구조를 실행 가능한 선택 조건으로 정리합니다.",
                      ][index]
                    : item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {previewStarted ? (
          <section id="preview-intake" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow={t("Free Preview Intake", "무료 Preview Intake")}
              title={t(
                "Seven compact questions. One first structural signal.",
                "7개 질문으로 결정의 핵심 구조를 먼저 확인합니다.",
              )}
              body={t(
                "Complete at least the decision and both options to generate the preview.",
                "현재 결정과 Option A, Option B를 입력하면 Preview를 생성할 수 있습니다.",
              )}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {previewQuestions.map((item, index) => {
                const localized = isKo ? previewQuestionsKo[item.field] : item;
                return (
                <label key={item.field} className="rounded-lg border border-border bg-card p-4">
                  <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Q{index + 1}
                  </span>
                  <span className="block min-h-10 text-sm font-medium leading-snug text-foreground">{localized.question}</span>
                  <textarea
                    className="mt-3 h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder={localized.placeholder}
                    value={answers[item.field]}
                    onChange={(event) => updateAnswer(item.field, event.target.value)}
                  />
                </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={generatePreview}
              disabled={!requiredPreviewReady}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Generate My Structural Preview", "Structural Preview 생성")}
            </button>
          </section>
        ) : null}

        {previewGenerated ? (
          <section id="preview-dashboard" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Preview Dashboard"
              title={t("The first read as an insight deck.", "결정의 핵심 신호를 한눈에 확인합니다.")}
              body={t(
                "The preview shows structure without delivering the full report.",
                "Preview는 전체 Report 전에 핵심 구조 신호를 먼저 보여줍니다.",
              )}
            />

            <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {insightCards.map((card, index) => (
                <div
                  key={card.eyebrow}
                  className="min-w-[250px] snap-start rounded-lg border border-border bg-card p-5 shadow-sm"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <Marker>{card.marker}</Marker>
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {card.eyebrow}
                    </p>
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {isKo
                      ? [
                          "전환 전 확인해야 할 근거가 남아 있는 단계적 재구성입니다.",
                          "장기 방향성은 Option B에 더 강하게 나타나고, 단기 안정성은 Option A가 더 강하게 보호합니다.",
                          "충분한 External Validation 없이 결정을 앞당기는 것이 핵심 리스크입니다.",
                          "불확실성을 줄이기 위해 무엇을 먼저 검증해야 하는지 확인합니다.",
                        ][index]
                      : card.line}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-border bg-card p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Option A / Option B Quick View
              </p>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
                <div className="rounded-md border border-border bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Option A</p>
                  <h3 className="mt-2 text-lg font-semibold">{optionALabel}</h3>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Strength", "강점")}</p>
                      <p className="mt-1 text-sm font-medium">Safety margin</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Constraint", "제약")}</p>
                      <p className="mt-1 text-sm font-medium">{t("Slower identity renewal", "장기 방향 전환 속도")}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center px-2">
                  <span className="rounded-sm border border-border bg-secondary/35 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {t("compare", "비교")}
                  </span>
                </div>
                <div className="rounded-md border border-border bg-background p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Option B</p>
                  <h3 className="mt-2 text-lg font-semibold">{optionBLabel}</h3>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Strength", "강점")}</p>
                      <p className="mt-1 text-sm font-medium">{t("Identity alignment", "장기 정체성과의 정렬")}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{t("Constraint", "제약")}</p>
                      <p className="mt-1 text-sm font-medium">{t("External validation burden", "External Validation 부담")}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 rounded-md border border-border bg-secondary/25 p-4 text-sm leading-relaxed">
                {t(
                  "The decision is not which option is more attractive, but which conditions make deeper commitment defensible.",
                  "핵심은 어느 쪽이 더 매력적인지가 아니라, 어떤 조건에서 전환을 설명할 수 있는지입니다.",
                )}
              </p>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t("Locked Full Report Modules", "Full Report 포함 항목")}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight">Full Career Structure Report</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lockedModules.map((module, index) => (
                  <div key={module.title} className="rounded-lg border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold leading-snug text-foreground">{module.title}</h4>
                      <Tag>{t("Locked", "포함 예정")}</Tag>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {isKo
                        ? [
                            "안정성, 검증 수준, 실행 부담을 Option별로 비교합니다.",
                            "준비도, Safety Margin, 지원 체계, 부담, 시기 압력을 확인합니다.",
                            "Primary, Secondary, Distortion Risk를 구조적으로 구분합니다.",
                            "더 깊은 전환을 설명 가능하게 만드는 조건을 정리합니다.",
                            "나중에 다시 검토할 수 있도록 해석과 분석을 확장합니다.",
                            "리포트를 받은 당일, Report 내용을 바탕으로 추가 질문을 정리할 수 있습니다.",
                          ][index]
                        : module.reveals}
                    </p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => document.getElementById("unlock")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                {t("Unlock Full Career Structure Report", "Full Report 확인하기")}
              </button>
            </div>
          </section>
        ) : null}

        {previewGenerated ? (
          <section id="unlock" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Unlock"
              title={t(
                "The paid experience begins with a detailed 29-question intake.",
                "29개 질문으로 전체 분석의 근거를 정리합니다.",
              )}
              body={t(
                "No account is required. A private email link can be used later for report access and Executive Q&A.",
                "계정 없이 진행할 수 있습니다. 이후 Report와 Executive Q&A는 비공개 이메일 링크로 확인할 수 있습니다.",
              )}
            />
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Essential</p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {t("Dashboard and detailed report", "Dashboard와 상세 Report")}
                </h3>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Detailed PDF Report
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => simulateUnlock("essential")}
                  className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                >
                  {t("Simulate Essential Unlock", "Essential 이용 흐름 체험")}
                </button>
              </div>
              <div className="rounded-lg border border-foreground/20 bg-card p-6">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Executive</p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {t("Dashboard, detailed report, and Q&A", "Dashboard, 상세 Report, Q&A")}
                </h3>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Full Web Dashboard
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    Detailed PDF Report
                  </div>
                  <div className="rounded-md border border-border bg-background p-4 text-sm font-medium">
                    1-Day Report Q&A
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => simulateUnlock("executive")}
                  className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                >
                  {t("Simulate Executive Unlock", "Executive 이용 흐름 체험")}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {selectedTier ? (
          <section id="full-intake" className="border-b border-border py-12 sm:py-14">
            <SectionHeader
              eyebrow="Full Intake"
              title={t("A deeper evidence base for the full dashboard.", "Full Web Dashboard를 위한 근거를 정리합니다.")}
              body={t(
                "The full intake expands the quick preview into a deeper evidence base for the dashboard.",
                "Full Intake에서는 결정의 구조, 리스크, 실행 부담을 판단할 근거를 구체화합니다.",
              )}
            />
            <div className="mb-5 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    {t("Full intake progress", "Full Intake 진행률")}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {answeredQuestionCount} / {totalFullIntakeQuestions}{" "}
                    {t("questions answered", "개 질문 응답")}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">{t("Progress", "진행률")}: {progress}%</p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary">
                <div className="h-2 rounded-full bg-foreground/75" style={{ width: `${progress}%` }} />
              </div>
              <button
                type="button"
                onClick={fillSampleAnswers}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-muted-foreground"
              >
                {t("Fill sample answers", "샘플 답변 입력")}
              </button>
            </div>

            <div className="space-y-4">
              {intakeGroups.map((group, index) => {
                const expanded = expandedGroupSet.has(group.title);
                const answeredInGroup = group.questions.filter((question) =>
                  String(fullIntakeAnswers[question.id] || "").trim(),
                ).length;
                const complete = answeredInGroup === group.questions.length;

                return (
                  <div key={group.title} className="overflow-hidden rounded-lg border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.title)}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-5 p-5 text-left"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <Marker>{String(index + 1)}</Marker>
                        <div>
                          <h3 className="text-base font-semibold">
                            {isKo ? intakeGroupTitlesKo[group.title] : group.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {answeredInGroup} / {group.questions.length} {t("complete", "완료")}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Tag>{complete ? t("Complete", "완료") : t("In progress", "진행 중")}</Tag>
                        <span className="text-sm font-medium text-muted-foreground">
                          {expanded ? t("Close", "닫기") : t("Open", "열기")}
                        </span>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="border-t border-border bg-background/50 p-5">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {group.questions.map((question) => (
                            <label key={question.id} className="rounded-md border border-border bg-background p-4">
                              <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                                {t("Question", "질문")} {question.id}
                              </span>
                              <span className="mt-2 block min-h-10 text-sm font-medium leading-snug">
                                {isKo ? intakeQuestionsKo[question.id].text : question.text}
                              </span>
                              <textarea
                                value={fullIntakeAnswers[question.id] || ""}
                                onChange={(event) => updateFullIntakeAnswer(question.id, event.target.value)}
                                placeholder={t("Add your structural evidence...", "결정에 영향을 주는 근거를 입력해 주세요.")}
                                className="mt-3 h-24 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={generateDashboard}
              disabled={!fullIntakeComplete}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Generate Full Dashboard", "Full Dashboard 생성")}
            </button>
            {!fullIntakeComplete ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t(
                  "Complete all intake questions to generate the full dashboard.",
                  "모든 Intake 질문에 답하면 Full Dashboard를 생성할 수 있습니다.",
                )}
              </p>
            ) : null}
          </section>
        ) : null}

        {dashboardGenerated ? (
          <>
            <section id="full-dashboard" className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Full Web Dashboard"
                title={t("A compact structural map of the decision.", "결정의 구조를 한눈에 보여주는 Dashboard입니다.")}
                body={t(
                  "The dashboard keeps the core tension, trade-offs, risks, and conditions visual and scannable.",
                  "Core Tension, trade-off, 리스크, Decision Conditions를 빠르게 확인합니다.",
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                {dashboardDeck.map((card, index) => (
                  <div key={card.section} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-3 text-sm font-semibold">{card.section}</h3>
                    <p className="mt-2 text-base font-semibold tracking-tight">{card.keyword}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {isKo
                        ? [
                            "전환 범위를 확대하기 전에 근거를 검증해야 합니다.",
                            "Option B는 더 강한 External Validation이 필요합니다.",
                            "Option A는 단기 안정성을 더 강하게 보호합니다.",
                            "충분한 검증 없이 결정을 앞당기는 것이 핵심 리스크입니다.",
                            "불확실성이 줄어들수록 선택의 조건이 더 명확해집니다.",
                          ][index]
                        : card.reading}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-6">
                <section className="rounded-lg border border-border bg-card p-6">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.42fr_1.58fr]">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Case Type
                      </p>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight">{detectedCaseType}</h3>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {t(
                          "Detected from the language and patterns in your intake.",
                          "Intake 답변의 표현과 패턴을 바탕으로 분류했습니다.",
                        )}
                      </p>
                    </div>
                    <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {t("Why this matters", "Why this matters")}
                      </p>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground">
                        {isKo ? caseTypeReading.ko : caseTypeReading.en}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Case-Specific Reading
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {[
                      ["Primary Risk", caseSpecificReading.primaryRisk],
                      ["Decision Conditions", caseSpecificReading.decisionConditions],
                      ["Validation Focus", caseSpecificReading.validationFocus],
                    ].map(([label, reading]) => (
                      <div key={String(label)} className="rounded-md border border-border bg-background p-5">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {String(label)}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-foreground">
                          {isKo
                            ? (reading as { en: string; ko: string }).ko
                            : (reading as { en: string; ko: string }).en}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    01 / Structural Overview
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Decision Type</p>
                      <p className="mt-2 text-sm font-semibold">Staged Reconfiguration</p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Core Tension</p>
                      <p className="mt-2 text-sm font-semibold">
                        {t(
                          "Long-term direction favors Option B; near-term stability favors Option A.",
                          "방향성은 Option B에, 안정성은 Option A에 더 강합니다.",
                        )}
                      </p>
                    </div>
                    <div className="rounded-md border border-border bg-background p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Structural Reading</p>
                      <p className="mt-2 text-sm font-semibold">
                        {t(
                          "Validate field capital before deeper conversion.",
                          "전환 범위를 확대하기 전에 새로운 분야의 근거를 검증해야 합니다.",
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {t(
                      "The decision is less about choosing immediately and more about validating whether field capital can be converted into a second platform.",
                      "지금 바로 하나를 고르는 것보다, 새로운 분야에서 확보한 근거가 두 번째 커리어 플랫폼으로 이어질 수 있는지 검증하는 것이 중요합니다.",
                    )}
                  </p>
                </section>

                <section className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex flex-col gap-2 p-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        02 / External Comparative Snapshot
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">
                        {t("Option-level trade-offs", "Option별 trade-off")}
                      </h3>
                    </div>
                    <Tag>{t("Table-first", "비교표")}</Tag>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                      <thead className="border-y border-border bg-secondary/35">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Dimension</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{optionALabel}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">{optionBLabel}</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            {t("Reading", "해석")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {matrixRows.map((row, index) => (
                          <tr key={row.dimension} className="border-b border-border last:border-b-0">
                            <td className="px-4 py-4 text-sm font-medium">{row.dimension}</td>
                            <td className="px-4 py-4 text-sm">
                              <Tag>{row.optionA}</Tag>
                            </td>
                            <td className="px-4 py-4 text-sm">
                              <Tag>{row.optionB}</Tag>
                            </td>
                            <td className="px-4 py-4 text-sm leading-relaxed text-muted-foreground">
                              {isKo
                                ? [
                                "Option A는 소득과 검증 시간을 더 안정적으로 보호합니다.",
                                "Option B는 장기 방향성이 강하지만 추가 검증이 필요합니다.",
                                    "Option B는 시장과 기관의 추가 검증이 필요합니다.",
                                    "Option B는 더 높은 실행 부담과 순서 설계가 필요합니다.",
                                    "단계적 접근이 Reversibility를 보호합니다.",
                                  ][index]
                                : row.reading}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        03 / Internal Structural Snapshot
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">
                        {t("Readiness and load signals", "준비도와 실행 부담 신호")}
                      </h3>
                    </div>
                    <Tag>{t("Infographic view", "Signal view")}</Tag>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    {internalSignals.map((signal, index) => (
                      <div key={signal.label} className="rounded-md border border-border bg-background p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <Marker>{signal.marker}</Marker>
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">signal</p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{signal.label}</p>
                        <p className="mt-2 min-h-10 text-sm font-semibold leading-snug">
                          {isKo
                            ? ["부분적으로 명확", "Option A가 더 강함", "형성 중", "높음", "보통"][index]
                            : signal.status}
                        </p>
                        <div className="mt-4 h-2 rounded-full bg-secondary">
                          <div className="h-2 rounded-full bg-foreground/70" style={{ width: signal.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        04 / Structural Risk Diagnosis
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight">
                        {t("Risk concentration", "리스크 집중 지점")}
                      </h3>
                    </div>
                    <Tag>{t("Three-part read", "3-part read")}</Tag>
                  </div>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {riskItems.map((item, index) => (
                      <div key={item.label} className="rounded-lg border border-border bg-background p-5">
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <Marker>{item.marker}</Marker>
                          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                        </div>
                        <p className="text-xl font-semibold tracking-tight">{item.value}</p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {isKo
                            ? [
                                "External Validation이 충분하지 않은 상태에서 결정을 앞당기는 리스크입니다.",
                                "안정성은 유지되지만 장기 방향 전환이 느려질 수 있습니다.",
                                "피로감이 전환의 시급성을 키울 수 있지만, 실제 준비도는 별도로 확인해야 합니다.",
                              ][index]
                            : item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    05 / Decision Conditions
                  </p>
                  <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-md border border-border bg-background p-5">
                      <h3 className="max-w-md text-lg font-semibold leading-snug">
                        {t(
                          `A deeper move toward ${optionBLabel} becomes more supportable if...`,
                          `${optionBLabel} 선택을 뒷받침하는 Decision Conditions`,
                        )}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {optionBConditions.map((condition, index) => (
                          <li key={condition} className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            {isKo
                              ? [
                                  "시장·기관·전문가의 반응을 통해 리서치 또는 자문 수요를 확인합니다.",
                                  "탐색 기간 동안 Safety Margin을 보호할 재정 여유가 확보됩니다.",
                                  "되돌리기 어려운 전환 전에 작은 범위로 검증할 수 있습니다.",
                                ][index]
                              : condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border border-border bg-background p-5">
                      <h3 className="max-w-md text-lg font-semibold leading-snug">
                        {t(
                          `Remaining in ${optionALabel} becomes more supportable if...`,
                          `${optionALabel} 선택을 뒷받침하는 Decision Conditions`,
                        )}
                      </h3>
                      <ul className="mt-4 space-y-3">
                        {optionAConditions.map((condition, index) => (
                          <li key={condition} className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            {isKo
                              ? [
                                  "현재 역할을 학습과 성장 중심으로 재설계할 수 있습니다.",
                                  "새로운 경로를 검증할 탐색 시간이 보호됩니다.",
                                  "현재 안정성이 장기적인 커리어 플랫폼 전략과 연결됩니다.",
                                ][index]
                              : condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-5 rounded-md border border-border bg-secondary/25 p-4 text-sm leading-relaxed">
                    {t(
                      "The goal is not immediate certainty. The goal is enough evidence to make deeper commitment structurally defensible.",
                      "목표는 즉시 확신하는 것이 아닙니다. 전환 범위를 확대해도 되는지 구조적으로 설명할 수 있을 만큼 근거를 확보하는 것입니다.",
                    )}
                  </p>
                </section>
              </div>
            </section>

            <section className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="Detailed PDF Report"
                title={t("A richer written report for deeper review.", "더 깊은 검토를 위한 Detailed PDF Report입니다.")}
                body={t(
                  "A detailed report based on your full intake, designed for offline review and later reference.",
                  "Full Intake를 바탕으로 구성되며, 저장 후 다시 검토할 수 있습니다.",
                )}
              />
              <div className="rounded-lg border border-border bg-card p-6">
                <p className="max-w-3xl text-sm leading-relaxed text-foreground">
                  {t(
                    "AMC sees structure.",
                    "AMC는 구조를 봅니다.",
                  )}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {detailedPdfSections.map((section, index) => (
                    <div key={section} className="rounded-md border border-border bg-background p-4">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-sm font-medium leading-snug">{section}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    {t(
                      "Open a dedicated report-only view with richer written interpretation, comparative analysis, and a structured validation plan.",
                      "상세 해석, Option 비교, 구조화된 Validation Plan을 포함한 Report 전용 화면을 엽니다.",
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={generateDetailedReport}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
                  >
                    {t("Open Detailed PDF Report", "Detailed PDF Report 열기")}
                  </button>
                </div>
              </div>
            </section>

            <section className="border-b border-border py-12 sm:py-14">
              <SectionHeader
                eyebrow="1-Day Report Q&A"
                title={
                  selectedTier === "executive"
                    ? t(
                        "A one-day report clarification window for Executive.",
                        "Executive에 포함되는 1-Day Report Q&A입니다.",
                      )
                    : t(
                        "1-Day Report Q&A is available with Executive.",
                        "Executive에서 1-Day Report Q&A를 이용할 수 있습니다.",
                      )
                }
                body={
                  selectedTier === "executive"
                    ? t(
                        "Ask report-based questions for one day after receiving the report.",
                        "리포트를 받은 당일, 리포트 내용을 바탕으로 추가 질문을 정리할 수 있습니다.",
                      )
                    : t(
                        "Essential includes the dashboard and Detailed PDF Report. Executive adds report-based Q&A.",
                        "Essential에는 Dashboard와 Detailed PDF Report가 포함되며, Executive에는 Report 기반 Q&A가 추가됩니다.",
                      )
                }
              />
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">1-Day Report Q&A</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(
                        "Executive access can later be handled through a private email link or time-limited access code.",
                        "Executive 이용은 비공개 이메일 링크 또는 기간 제한 접근 코드로 제공됩니다.",
                      )}
                    </p>
                  </div>
                  <Tag>
                    {selectedTier === "executive" ? t("Unlocked", "이용 가능") : t("Executive only", "Executive 전용")}
                  </Tag>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(isKo
                    ? [
                        "현재 결정의 Primary Risk는 무엇인가요?",
                        "이 결정에서 External Validation이 중요한 이유는 무엇인가요?",
                        "전환 범위를 확대하기 전에 확인해야 할 Decision Conditions는 무엇인가요?",
                      ]
                    : [
                        "What is my primary structural risk?",
                        "Why is external validation important here?",
                        "What conditions make deeper commitment more defensible?",
                      ]
                  ).map((question) => (
                    <div
                      key={question}
                      className="rounded-md border border-border bg-background p-4 text-sm leading-relaxed"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : null}

        <section className="py-8">
          <p className="rounded-md border border-border bg-secondary/20 p-4 text-xs leading-relaxed text-muted-foreground">
            {t(
              "Developer note: This static MVP prototype uses local UI state only. It does not include real payment, backend submission, account login, chatbot, external API calls, or production report generation.",
              "개발 참고: 이 정적 MVP는 로컬 UI 상태만 사용합니다. 실제 결제, 백엔드 제출, 계정 로그인, chatbot, 외부 API 호출, 운영용 Report 생성은 포함하지 않습니다.",
            )}
          </p>
        </section>
      </main>
    </div>
  );
}
