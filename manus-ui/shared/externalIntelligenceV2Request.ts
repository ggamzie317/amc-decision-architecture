import { caseTypes } from "./interactivePrivacy.js";

export type V2EvidenceLanguage = "en" | "ko";
export type V2EvidenceRequest = {
  caseType: (typeof caseTypes)[number];
  externalAreas: string[];
  targetGeography: string;
  targetLabel: string;
  language: V2EvidenceLanguage;
};

const careerAreas = [
  "hiringDemand",
  "roleDemand",
  "compensation",
  "requiredSkills",
  "industryDirection",
  "geography",
  "visaMobility",
] as const;
const entrepreneurAreas = [
  "customerDemand",
  "competition",
  "pricing",
  "marketGrowth",
  "distribution",
  "barriers",
  "regulation",
] as const;
const educationAreas = [
  "programOutcomes",
  "employmentRelevance",
  "researchRelevance",
  "opportunityCost",
  "funding",
  "geographyMobility",
] as const;

export function allowedV2ExternalAreas(
  caseType: V2EvidenceRequest["caseType"]
): readonly string[] {
  return caseType === "Entrepreneurship"
    ? entrepreneurAreas
    : caseType === "MBA / EMBA / PhD Decision"
      ? educationAreas
      : careerAreas;
}

/** Exact, bounded public-search context. Unknown fields cannot be forwarded. */
export function parseV2EvidenceRequest(raw: unknown): V2EvidenceRequest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const keys = Object.keys(value);
  if (
    keys.some(
      key =>
        ![
          "caseType",
          "externalAreas",
          "targetGeography",
          "targetLabel",
          "language",
        ].includes(key)
    )
  )
    return null;
  if (!caseTypes.includes(value.caseType as never)) return null;
  const caseType = value.caseType as V2EvidenceRequest["caseType"];
  if (value.language !== "en" && value.language !== "ko") return null;
  if (!Array.isArray(value.externalAreas) || value.externalAreas.length > 7)
    return null;
  const allowed = allowedV2ExternalAreas(caseType);
  if (
    !value.externalAreas.every(
      item => typeof item === "string" && allowed.includes(item)
    )
  )
    return null;
  if (new Set(value.externalAreas).size !== value.externalAreas.length)
    return null;
  const targetGeography = bounded(value.targetGeography, 80, true);
  const targetLabel = bounded(value.targetLabel, 120, true);
  if (targetGeography === null || targetLabel === null) return null;
  return {
    caseType,
    externalAreas: value.externalAreas,
    targetGeography,
    targetLabel,
    language: value.language,
  };
}

function bounded(raw: unknown, max: number, optional: boolean): string | null {
  if (raw === undefined && optional) return "";
  if (typeof raw !== "string") return null;
  const value = raw.replace(/[\x00-\x1f\x7f]+/g, " ").trim();
  return value.length <= max ? value : null;
}
