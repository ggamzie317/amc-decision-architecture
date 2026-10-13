/**
 * Attach a Korean particle to free text whose final sound is not known in
 * advance (customer option labels, assembled condition lists).
 *
 * Hangul and digits are resolved exactly. Latin acronyms and words use their
 * usual Korean reading; anything else keeps the neutral "은(는)" form instead
 * of guessing a wrong particle.
 */
export type KoreanParticle = "은/는" | "이/가" | "을/를" | "과/와" | "으로/로" | "이라는/라는";

const pairs: Record<KoreanParticle, [withFinal: string, withoutFinal: string, neutral: string]> = {
  "은/는": ["은", "는", "은(는)"],
  "이/가": ["이", "가", "이(가)"],
  "을/를": ["을", "를", "을(를)"],
  "과/와": ["과", "와", "과(와)"],
  "으로/로": ["으로", "로", "(으)로"],
  "이라는/라는": ["이라는", "라는", "(이)라는"],
};

type Final = "none" | "rieul" | "other" | "unknown";

// 0 영, 1 일, 2 이, 3 삼, 4 사, 5 오, 6 육, 7 칠, 8 팔, 9 구
const digitFinal: Final[] = ["other", "rieul", "none", "other", "none", "none", "other", "rieul", "rieul", "none"];
// Letter-by-letter reading of uppercase acronyms: L 엘, M 엠, N 엔, R 알.
const acronymFinal: Record<string, Final> = { L: "rieul", M: "other", N: "other", R: "rieul" };

function finalSound(text: string): Final {
  const trimmed = text.replace(/[\s.,!?'"’”)\]}>」』…·-]+$/, "");
  const last = trimmed.at(-1);
  if (!last) return "unknown";
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    return jong === 0 ? "none" : jong === 8 ? "rieul" : "other";
  }
  if (/[0-9]/.test(last)) return digitFinal[Number(last)];
  if (/[A-Z]/.test(last)) {
    // Uppercase run (MBA, EMBA, HR) is read letter by letter.
    if (/[A-Z]{2,}$/.test(trimmed) || /(^|[^A-Za-z])[A-Z]$/.test(trimmed)) return acronymFinal[last] ?? "none";
  }
  if (/[a-zA-Z]/.test(last)) {
    const lower = last.toLowerCase();
    if (lower === "l") return "rieul";
    return "bcgkmnpt".includes(lower) ? "other" : "none";
  }
  return "unknown";
}

export function withKoreanParticle(text: string, particle: KoreanParticle): string {
  const [withFinal, withoutFinal, neutral] = pairs[particle];
  const sound = finalSound(text);
  if (sound === "unknown") return `${text}${neutral}`;
  if (particle === "으로/로") return `${text}${sound === "other" ? withFinal : withoutFinal}`;
  return `${text}${sound === "none" ? withoutFinal : withFinal}`;
}
