import type { V2Language } from "./v2Language";

/**
 * Local English rendering of the customer's two short role fields ("현재 직무",
 * "고민하는 커리어") for the English view. Customer prose is never sent to a
 * translation service; instead common career terms (places, organisation
 * types, industries, titles, degrees and moves) are composed locally. When any
 * word is not recognised the phrase is not guessed: callers get null and show
 * a neutral label with the original marked "as entered".
 */
type Kind = "place" | "org" | "industry" | "title" | "degree" | "field" | "move" | "skip";
type Entry = [kind: Kind, en: string];

const terms: Record<string, Entry> = {
  // Places
  한국: ["place", "Korea"], 국내: ["place", "Korea"], 서울: ["place", "Seoul"], 부산: ["place", "Busan"], 판교: ["place", "Pangyo"],
  싱가포르: ["place", "Singapore"], 홍콩: ["place", "Hong Kong"], 미국: ["place", "the US"], 뉴욕: ["place", "New York"],
  실리콘밸리: ["place", "Silicon Valley"], 영국: ["place", "the UK"], 런던: ["place", "London"], 일본: ["place", "Japan"],
  도쿄: ["place", "Tokyo"], 중국: ["place", "China"], 상하이: ["place", "Shanghai"], 베트남: ["place", "Vietnam"],
  호주: ["place", "Australia"], 캐나다: ["place", "Canada"], 독일: ["place", "Germany"], 프랑스: ["place", "France"],
  네덜란드: ["place", "the Netherlands"], 스위스: ["place", "Switzerland"], 두바이: ["place", "Dubai"], 대만: ["place", "Taiwan"],
  인도: ["place", "India"], 유럽: ["place", "Europe"], 동남아: ["place", "Southeast Asia"], 해외: ["place", "abroad"],
  뉴질랜드: ["place", "New Zealand"], 아일랜드: ["place", "Ireland"], 스웨덴: ["place", "Sweden"],
  // Organisation types
  대기업: ["org", "large company"], 중견기업: ["org", "mid-sized company"], 중소기업: ["org", "small company"],
  스타트업: ["org", "startup"], 외국계: ["org", "multinational company"], 다국적: ["org", "multinational company"],
  글로벌: ["org", "global company"], 공기업: ["org", "public corporation"], 공공기관: ["org", "public agency"],
  기업: ["org", "company"], 회사: ["org", "company"], 그룹: ["org", "group"], 은행: ["org", "bank"],
  증권사: ["org", "securities firm"], 컨설팅사: ["org", "consulting firm"], 컨설팅펌: ["org", "consulting firm"],
  로펌: ["org", "law firm"], 연구소: ["org", "research institute"], 병원: ["org", "hospital"], 대학교: ["org", "university"],
  대학: ["org", "university"], 대학원: ["org", "graduate school"], 에이전시: ["org", "agency"], 공무원: ["title", "civil servant"],
  // Industries and functions
  부동산: ["industry", "real estate"], 금융: ["industry", "finance"], 반도체: ["industry", "semiconductor"],
  제조: ["industry", "manufacturing"], 자동차: ["industry", "automotive"], 바이오: ["industry", "biotech"],
  제약: ["industry", "pharmaceutical"], 헬스케어: ["industry", "healthcare"], 의료: ["industry", "healthcare"],
  유통: ["industry", "retail"], 이커머스: ["industry", "e-commerce"], 물류: ["industry", "logistics"], 건설: ["industry", "construction"],
  에너지: ["industry", "energy"], 화학: ["industry", "chemicals"], 게임: ["industry", "gaming"], 미디어: ["industry", "media"],
  광고: ["industry", "advertising"], 교육: ["industry", "education"], 컨설팅: ["industry", "consulting"], 투자: ["industry", "investment"],
  보험: ["industry", "insurance"], 핀테크: ["industry", "fintech"], 소프트웨어: ["industry", "software"], 플랫폼: ["industry", "platform"],
  호텔: ["industry", "hospitality"], 항공: ["industry", "aviation"], 식품: ["industry", "food"], 패션: ["industry", "fashion"],
  뷰티: ["industry", "beauty"], 콘텐츠: ["industry", "content"], 엔터테인먼트: ["industry", "entertainment"], 통신: ["industry", "telecom"],
  영업: ["industry", "sales"], 마케팅: ["industry", "marketing"], 기획: ["industry", "planning"], 전략: ["industry", "strategy"],
  재무: ["industry", "finance"], 회계: ["industry", "accounting"], 인사: ["industry", "HR"], 개발: ["industry", "development"],
  연구: ["industry", "research"], 운영: ["industry", "operations"], 생산: ["industry", "production"], 품질: ["industry", "quality"],
  구매: ["industry", "procurement"], 법무: ["industry", "legal"], 홍보: ["industry", "PR"], 사업개발: ["industry", "business development"],
  데이터: ["industry", "data"], 인공지능: ["industry", "AI"], 디자인: ["industry", "design"], 해외영업: ["industry", "overseas sales"],
  // Titles
  사원: ["title", "staff member"], 주임: ["title", "senior staff member"], 대리: ["title", "assistant manager"], 과장: ["title", "manager"],
  차장: ["title", "deputy general manager"], 부장: ["title", "general manager"], 팀장: ["title", "team lead"], 파트장: ["title", "part lead"],
  실장: ["title", "head of division"], 본부장: ["title", "head of division"], 임원: ["title", "executive"], 상무: ["title", "managing director"],
  전무: ["title", "executive vice president"], 이사: ["title", "director"], 대표: ["title", "CEO"], 사장: ["title", "president"],
  매니저: ["title", "manager"], 엔지니어: ["title", "engineer"], 개발자: ["title", "developer"], 연구원: ["title", "researcher"],
  디자이너: ["title", "designer"], 컨설턴트: ["title", "consultant"], 마케터: ["title", "marketer"], 교수: ["title", "professor"],
  강사: ["title", "lecturer"], 교사: ["title", "teacher"], 의사: ["title", "doctor"], 간호사: ["title", "nurse"], 변호사: ["title", "lawyer"],
  회계사: ["title", "accountant"], 애널리스트: ["title", "analyst"], 기획자: ["title", "planner"], 직장인: ["title", "employee"],
  프리랜서: ["title", "freelancer"], 주재원: ["title", "expatriate employee"], 리더: ["title", "lead"],
  // Degrees and academic fields
  박사: ["degree", "PhD"], 석사: ["degree", "master's degree"], 학사: ["degree", "bachelor's degree"], MBA: ["degree", "MBA"],
  EMBA: ["degree", "EMBA"], PhD: ["degree", "PhD"], 학위: ["degree", "degree"], 과정: ["degree", "programme"],
  철학: ["field", "philosophy"], 경영학: ["field", "business"], 경제학: ["field", "economics"], 심리학: ["field", "psychology"],
  법학: ["field", "law"], 공학: ["field", "engineering"], 컴퓨터공학: ["field", "computer science"], 교육학: ["field", "education"],
  사회학: ["field", "sociology"], 정치학: ["field", "political science"], 통계학: ["field", "statistics"], 경영: ["field", "business"],
  서울대: ["org", "Seoul National University"], 카이스트: ["org", "KAIST"], 고려대: ["org", "Korea University"], 연세대: ["org", "Yonsei University"],
  // Moves
  이직: ["move", "Move to"], 취업: ["move", "Join"], 전직: ["move", "Switch to"], 전환: ["move", "Switch to"], 창업: ["move", "Start"],
  유학: ["move", "Study in"], 진학: ["move", "Enrol in"], 이주: ["move", "Relocate to"], 이민: ["move", "Relocate to"],
  승진: ["move", "Promotion to"], 복직: ["move", "Return to"], 독립: ["move", "Go independent as"],
  // Filler words that carry no role meaning
  도전: ["skip", ""], 추진: ["skip", ""], 고민: ["skip", ""], 준비: ["skip", ""], 희망: ["skip", ""], 계획: ["skip", ""], 현재: ["skip", ""],
  재직: ["skip", ""], 근무: ["skip", ""], 분야: ["skip", ""], 업계: ["skip", ""], 직무: ["skip", ""], 담당: ["skip", ""], 년차: ["skip", ""],
};
const particles = ["에서의", "에서", "으로", "로의", "로", "의", "에", "을", "를", "은", "는", "이", "가", "과", "와", "및"];

/** Greedy longest-prefix segmentation of one spaced token ("부동산기업" → 부동산 + 기업). */
function segment(token: string): Entry[] | null {
  if (!token) return [];
  if (terms[token]) return [terms[token]];
  if (/^\d+(?:년차|년|살|세)?$/.test(token)) return [["skip", ""]];
  if (/^[A-Za-z&+.-]+$/.test(token)) return [["industry", token]];
  for (let end = token.length - 1; end > 0; end--) {
    const head = terms[token.slice(0, end)];
    if (!head) continue;
    const rest = token.slice(end);
    if (particles.includes(rest)) return [head];
    const tail = segment(rest);
    if (tail) return [head, ...tail];
  }
  return null;
}

const properName = /^(the |Seoul National|KAIST|Korea University|Yonsei)/;
function withArticle(phrase: string): string {
  if (!phrase || properName.test(phrase)) return phrase;
  const acronym = phrase.match(/^[A-Z]{2,}/);
  const an = acronym ? "AEFHILMNORSX".includes(acronym[0][0]) : /^[aeiou]/i.test(phrase);
  return `${an ? "an" : "a"} ${phrase}`;
}

export function v2EnglishRole(value: string): string | null {
  const source = value.trim();
  if (!source) return null;
  if (!/[가-힣]/.test(source)) return source;
  const entries: Entry[] = [];
  for (const raw of source.split(/[\s/·,]+/).filter(Boolean)) {
    const parts = segment(raw.replace(/[()]/g, ""));
    if (!parts) return null;
    entries.push(...parts);
  }
  const of = (kind: Kind) => entries.filter(([k]) => k === kind).map(([, en]) => en);
  const [places, orgs, industries, titles, degrees, fields, moves] =
    (["place", "org", "industry", "title", "degree", "field", "move"] as Kind[]).map(of);
  if (!places.length && !orgs.length && !industries.length && !titles.length && !degrees.length && !fields.length && !moves.length) return null;

  // "large company" + "consulting firm" → "large consulting firm"; adjectives go first.
  const adjective = /^(large|mid-sized|small|global|multinational) company$/;
  const adjectives = orgs.filter(o => adjective.test(o)).map(o => o.replace(" company", ""));
  const heads = orgs.filter(o => !adjective.test(o));
  const head = heads[heads.length - 1] ?? (orgs.length ? "company" : "");
  const orgPhrase = head ? [...adjectives, ...industries, head].join(" ") : "";
  const domain = industries.join(" ");
  const degreePhrase = degrees.length
    ? `${degrees.join(" ")}${fields.length ? ` in ${fields.join(" and ")}` : ""}`
    : fields.join(" and ");
  let noun = titles.length
    ? `${!head && domain ? `${domain} ` : ""}${titles.join(" ")}${head ? ` at ${withArticle(orgPhrase)}` : ""}`
    : degreePhrase
      ? `${degreePhrase}${head ? ` at ${orgPhrase}` : ""}`
      : orgPhrase ? withArticle(orgPhrase) : domain ? `${domain} role` : "";
  const place = places.join(", ");
  const move = moves[moves.length - 1];
  let text: string;
  if (move === "Study in") text = degrees.length ? `Study for ${withArticle(noun)}${place ? ` in ${place}` : ""}` : `Study in ${place || noun}`;
  else if (move === "Start") text = `Start ${noun ? (head ? noun : withArticle(`${domain || noun} business`)) : "a business"}${place ? ` in ${place}` : ""}`;
  else {
    if (place) noun = noun ? `${noun} in ${place}` : place;
    text = move ? (noun ? `${move} ${noun}` : move) : noun;
  }
  if (!text) return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The customer's field in the interface language. Korean view: as entered.
 * English view: the local rendering, or `fallback` with the original kept as
 * an "as entered" note so nothing appears silently untranslated.
 */
export function v2CustomerInput(language: V2Language, value: string, fallback: string): { text: string; original?: string } {
  const source = value.trim();
  if (!source) return { text: fallback };
  if (language === "ko" || !/[가-힣]/.test(source)) return { text: source };
  const english = v2EnglishRole(source);
  return english ? { text: english, original: source } : { text: fallback, original: source };
}

/** Current role / considered career in the interface language. */
export function v2RoleFields(language: V2Language, fields: { optionA: string; optionB: string }) {
  return {
    current: v2CustomerInput(language, fields.optionA, language === "ko" ? "현재 직무" : "Your current role"),
    target: v2CustomerInput(language, fields.optionB, language === "ko" ? "고민하는 커리어" : "The career you are considering"),
  };
}

/** The decision sentence, rebuilt from the two fields so it follows the language toggle. */
export function v2DecisionText(language: V2Language, fields: { decision: string; optionA: string; optionB: string }): string {
  if (!fields.optionA.trim() && !fields.optionB.trim()) return v2CustomerInput(language, fields.decision, "").text || fields.decision;
  const { current, target } = v2RoleFields(language, fields);
  return language === "ko"
    ? `현재: ${current.text} → 고민: ${target.text}`
    : `Current: ${current.text} → Considering: ${target.text}`;
}

/** "(as entered: 한국 대기업 차장)" note for the English view, empty otherwise. */
export function v2AsEntered(language: V2Language, original?: string): string {
  return language === "en" && original ? ` (as entered: ${original})` : "";
}
