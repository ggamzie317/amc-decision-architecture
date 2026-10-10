import type { V2Language } from "./v2Language";

// Calendar dates here describe a customer's local day, not a source's publication day.
export function v2LocalDate(value: string | Date, timeZone?: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);
  const part = (type: string) =>
    parts.find(row => row.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function v2EvidenceCheckedDate(
  generatedAt: string | null,
  _language: V2Language,
  timeZone?: string
): string {
  return generatedAt ? v2LocalDate(generatedAt, timeZone) : "";
}

const safeSubject: Record<string, readonly [string, string]> = {
  "Corporate Stay vs Exit": ["Stay_or_Exit", "재직_퇴사_검토"],
  "MBA / EMBA / PhD Decision": ["Graduate_Study", "대학원_진학"],
  "Overseas Relocation": ["Overseas_Relocation", "해외_이동"],
  Entrepreneurship: ["Entrepreneurship_Review", "창업_검토"],
  "Industry Transition": ["Career_Transition", "산업_전환"],
  "Role Upgrade / Downgrade": ["Role_Change", "직무_변경"],
  "Burnout-driven Decision": ["Career_Recovery", "경력_회복"],
  "Family Constraint-heavy Decision": ["Career_and_Family", "가족_경력_검토"],
  "General Career Reconfiguration": ["Career_Review", "경력_재설계"],
};

export function v2ReportSubject(
  decision: string,
  caseType: string,
  language: V2Language
): string {
  // Only fixed, general topics are permitted. Never copy free-form customer text
  // into a filename: it can contain names, employers, contact or health details.
  if (
    caseType === "Industry Transition" &&
    /(?:\bIT\b|정보기술|소프트웨어|데이터|인공지능|\bAI\b)/i.test(decision)
  )
    return language === "ko" ? "IT_산업_전환" : "IT_Career_Transition";
  if (caseType === "MBA / EMBA / PhD Decision") {
    if (/\bEMBA\b/i.test(decision)) return "EMBA_진학";
    if (/\bMBA\b/i.test(decision)) return "MBA_진학";
    if (/\bPhD\b|박사/i.test(decision))
      return language === "ko" ? "박사_진학" : "PhD_Study";
  }
  return (
    safeSubject[caseType]?.[language === "ko" ? 1 : 0] ??
    (language === "ko" ? "결정_보고서" : "Decision_Report")
  );
}

export function v2SafeFileStem(value: string): string {
  return (
    value
      .normalize("NFC")
      .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[_.\s]+|[_.\s]+$/g, "")
      .slice(0, 64)
      .replace(/[_.\s]+$/g, "") || "Decision_Report"
  );
}

export function v2ReportFileName(
  decision: string,
  caseType: string,
  language: V2Language,
  createdAt: Date = new Date()
): string {
  const subject = v2SafeFileStem(v2ReportSubject(decision, caseType, language));
  return `${subject}_allofmycareer_${v2LocalDate(createdAt)}.pdf`;
}

export function v2CustomerPosture(
  language: V2Language,
  label: string,
  sentence: string,
  _optionA: string,
  optionB: string
): { label: string; sentence: string } {
  if (language !== "ko") return { label, sentence };
  if (label === "보존하며 검증")
    return {
      label: "현재 계획 유지",
      sentence: sentence.includes("기반을 보존하면서")
        ? `현재 계획을 유지하면서 ${optionB}에 필요한 외부 근거를 확인하세요. 지금 구조는 이 순서를 더 뒷받침합니다.`
        : sentence
            .replaceAll("Safety Margin", "안전 여유")
            .replaceAll("현재 자세", "현재 판단"),
    };
  return {
    label:
      label === "기반을 보호하며 재구성"
        ? "안전 여유를 지키며 경로 조정"
        : label,
    sentence: sentence
      .replaceAll("Safety Margin", "안전 여유")
      .replaceAll("현재 자세", "현재 판단"),
  };
}

const koreanPlayText: Record<string, string> = {
  "역할 / 범위 재구성": "현재 역할 조정",
  "경로 재구성": "중간 경로 검토",
  "병행 검증": "현재 계획을 유지하며 대안 확인",
  "시기 재구성": "실행 시기 조정",
  "자원 재구성": "자원과 안전 여유 조정",
  "현재 여력 → 보호된 여력": "현재 여력에서 지켜야 할 여력을 먼저 확보합니다.",
  "직접 전환 → 중간 경로": "한 번에 전환하지 않고 중간 경로를 시험합니다.",
  "가정 → 관찰 가능한 검증":
    "가정을 실제로 확인할 수 있는 작은 시험으로 바꿉니다.",
  "시간, 자금 또는 지원": "시간·자금 또는 도움을 받을 수 있는 곳",
};

export function v2CustomerPlayText(
  language: V2Language,
  value: string
): string {
  return language === "ko" ? (koreanPlayText[value] ?? value) : value;
}

export function prepareV2PrintTitle(fileName: string): () => void {
  const original = document.title;
  document.title = fileName.replace(/\.pdf$/i, "");
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = original;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  return restore;
}
