/**
 * One amount pattern for every surface (key figures, Safety Margin card,
 * indicator evidence), so a card never counts as money in one place and not in
 * another. Covers currency symbols, ISO codes, English unit words and Korean
 * units (억·천만·만 원). After "원"/"엔" and the other unit words only a
 * particle may follow ("2,220만 원이며", "500달러를"), never another word, so
 * "2025 원격근무", "원가" or "2025 엔지니어" are not amounts.
 */
const number = String.raw`\d{1,3}(?:[,.]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const symbol = String.raw`(?:HK\$|US\$|A\$|S\$|C\$|NZ\$|£|€|\$|₩|¥)`;
const iso = String.raw`(?:USD|SGD|HKD|KRW|GBP|EUR|JPY|AUD|CAD|CNY|AED|NZD|CHF)`;
// Particles that may follow an amount. Words that also start with 원 (원가,
// 원로, 원도심, 원만, 원당, 원일, 원선) are deliberately left out.
const sharedParticles = String.raw`이|의|에|씩|까지|부터|대(?!한)|정도|가량|짜리|이상|이하|미만|초과|안팎|내외|수준|보다|였|입`;
const afterConsonant = String.raw`(?=$|[^가-힣]|(?:은|을|과|으로|${sharedParticles}))`; // 원, 엔
const afterVowel = String.raw`(?=$|[^가-힣]|(?:가|는|를|로|와|도|예|${sharedParticles}))`; // 파운드, 달러, 유로
const koreanUnit = String.raw`(?:\d+\s?억(?:\s?(?:${number})\s?(?:천만|만))?|(?:${number})\s?(?:천만|만))\s?원${afterConsonant}`;
const plainKorean = String.raw`(?:${number})\s?(?:원|엔)${afterConsonant}|(?:${number})\s?(?:파운드|달러|유로)${afterVowel}`;
// English scale words stay part of the amount: "KRW 22.2 million" must not be
// shown as "KRW 22.2".
const scaleWord = String.raw`\s?(?:million|billion|thousand|trillion|mn|bn)\b`;
const englishWord = String.raw`(?:${number})(?:${scaleWord})?\s?(?:dollars|pounds|euros|won|yen)\b`;

export const v2AmountPattern = new RegExp(
  [
    String.raw`${symbol}\s?(?:${number})(?:${scaleWord}|\s?(?:만|억|천|k|K|m|M)\b)?`,
    String.raw`${iso}\s?(?:${number})(?:${scaleWord}|\s?(?:k|K|m|M)\b)?`,
    String.raw`(?:${number})(?:${scaleWord})?\s?${iso}\b`,
    koreanUnit,
    plainKorean,
    englishWord,
  ].join("|")
);

export function v2HasAmount(text: string): boolean {
  return v2AmountPattern.test(text);
}
