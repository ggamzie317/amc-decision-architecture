/**
 * One amount pattern for every surface (key figures, Safety Margin card,
 * indicator evidence), so a card never counts as money in one place and not in
 * another. Covers currency symbols, ISO codes, English unit words and Korean
 * units (억·천만·만 원). "원"/"엔" must not continue into another Korean word,
 * so "2025 원격근무" is not an amount.
 */
const number = String.raw`\d{1,3}(?:[,.]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
const symbol = String.raw`(?:HK\$|US\$|A\$|S\$|C\$|NZ\$|£|€|\$|₩|¥)`;
const iso = String.raw`(?:USD|SGD|HKD|KRW|GBP|EUR|JPY|AUD|CAD|CNY|AED|NZD|CHF)`;
const koreanUnit = String.raw`(?:\d+\s?억(?:\s?(?:${number})\s?(?:천만|만))?|(?:${number})\s?(?:천만|만))\s?원(?![가-힣])`;
const plainKorean = String.raw`(?:${number})\s?(?:원|엔|파운드|달러|유로)(?![가-힣])`;
const englishWord = String.raw`(?:${number})\s?(?:dollars|pounds|euros|won|yen)\b`;

export const v2AmountPattern = new RegExp(
  [
    String.raw`${symbol}\s?(?:${number})(?:\s?(?:만|억|천|k|K|m|M)\b)?`,
    String.raw`${iso}\s?(?:${number})`,
    String.raw`(?:${number})\s?${iso}\b`,
    koreanUnit,
    plainKorean,
    englishWord,
  ].join("|")
);

export function v2HasAmount(text: string): boolean {
  return v2AmountPattern.test(text);
}
