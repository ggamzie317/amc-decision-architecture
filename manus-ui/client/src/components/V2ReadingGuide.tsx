import type { V2Language } from "../data/v2Language";

/**
 * Benchmark (CareerLeader): a short "how to read this" before the results, and
 * long summaries split into a lead plus reasons (Hogan's lead-in + bullets).
 */
export default function V2ReadingGuide({ language, printed = false }: { language: V2Language; printed?: boolean }) {
  const ko = language === "ko";
  const steps = ko
    ? [
        "맨 위의 한 줄이 지금 조건에서의 판단입니다. 정답이나 추천이 아닙니다.",
        "'가장 부족한 조건'과 '놓치기 쉬운 조건'을 먼저 보세요. 판단이 바뀔 수 있는 곳입니다.",
        "예상과 다른 결과가 있다면 그 부분을 가장 먼저 읽어 보세요.",
        "'다음 30일'에 적힌 한 가지를 해 보면, 무엇을 더 확인해야 할지 분명해집니다.",
      ]
    : [
        "The line at the top is the reading under your current conditions. It is not an answer or a recommendation.",
        "Look first at the condition that is furthest behind and the one that is easy to miss; that is where the reading can change.",
        "If a result surprises you, read that part first.",
        "Doing the one thing listed for the next 30 days will show what still needs checking.",
      ];
  return (
    <aside className={`v2-reading-guide${printed ? " printed" : ""}`} aria-label={ko ? "이 결과를 읽는 방법" : "How to read these results"}>
      <strong>{ko ? "이 결과를 읽는 방법" : "How to read these results"}</strong>
      <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
    </aside>
  );
}

/** "A. B. C." → lead sentence + the rest as reasons, so a long paragraph scans like a brief. */
export function V2LeadAndReasons({ text, language, className }: { text: string; language: V2Language; className?: string }) {
  const sentences = text.match(/[^.!?。]+[.!?。]+(?=\s|$)|[^.!?。]+$/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
  if (sentences.length < 3) return <p className={className}>{text}</p>;
  const [lead, ...rest] = sentences;
  return (
    <div className={className}>
      <p><b>{lead}</b></p>
      <span className="v2-reasons-label">{language === "ko" ? "이렇게 본 이유" : "Why"}</span>
      <ul className="v2-reasons">{rest.map((sentence, i) => <li key={i}>{sentence}</li>)}</ul>
    </div>
  );
}
