export interface ExternalSnapshotPromptInput {
  caseSummary: string;
  optionsUnderConsideration?: string;
  location?: string;
  currentRoleCompany?: string;
  reportLanguage?: "ko" | "en" | "zh";
  asOfDate?: string;
}

export interface ExternalSnapshotPrompt {
  system: string;
  user: string;
}

export function buildExternalSnapshotPrompt(input: ExternalSnapshotPromptInput): ExternalSnapshotPrompt {
  const asOfDate = input.asOfDate ?? new Date().toISOString().slice(0, 10);
  const language = input.reportLanguage ?? "en";

  const system = [
    "You are an external intelligence analyst for AMC career decision architecture reports.",
    "Return only valid JSON that follows the provided JSON schema.",
    "Use concise, evidence-linked statements.",
    "Do not provide coaching or motivational advice.",
    "Status enums must be selected strictly from allowed values.",
    "If evidence is weak, reflect that uncertainty in summary and evidence text rather than fabricating confidence.",
    "Prefer sources with clear dates and note an as-of date in market_data_date.",
  ].join(" ");

  const user = [
    `As-of date: ${asOfDate}`,
    `Response language: ${language}`,
    `Case summary: ${input.caseSummary}`,
    `Options under consideration: ${input.optionsUnderConsideration ?? "[Not provided]"}`,
    `Location context: ${input.location ?? "[Not provided]"}`,
    `Current role/company context: ${input.currentRoleCompany ?? "[Not provided]"}`,
    "Generate external snapshot intelligence for the case with four dimensions:",
    "1) market direction, 2) competition pressure, 3) economic pressure, 4) transition friction.",
    "Each dimension must include: status, concise summary, and 1-3 evidence bullets.",
    "Provide 1-4 source_notes and best available market_data_date.",
  ].join("\n");

  return { system, user };
}
