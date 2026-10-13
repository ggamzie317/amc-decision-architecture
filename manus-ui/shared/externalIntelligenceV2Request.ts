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

/** Same existing defaults in server and customer coverage display. */
export function v2EvidenceAreas(request: Pick<V2EvidenceRequest, "caseType" | "externalAreas">): readonly string[] {
  if (request.externalAreas.length) return request.externalAreas;
  if (request.caseType === "Entrepreneurship") return ["customerDemand", "competition", "pricing", "distribution"];
  // Published cost, schedule and format are often the most available degree facts
  // (owner decision 2026-10-14); outcome reports are frequently not published.
  if (request.caseType === "MBA / EMBA / PhD Decision") return ["programOutcomes", "employmentRelevance", "funding", "opportunityCost"];
  if (request.caseType === "Industry Transition") return ["hiringDemand", "roleDemand", "requiredSkills", "compensation"];
  // Owner decision 2026-10-14: existing areas only, chosen per case family.
  if (request.caseType === "Overseas Relocation") return ["visaMobility", "hiringDemand", "compensation", "geography"];
  if (request.caseType === "Burnout-driven Decision" || request.caseType === "Family Constraint-heavy Decision")
    return ["roleDemand", "compensation", "geography"];
  return allowedV2ExternalAreas(request.caseType).slice(0, 3);
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
  const targetGeography = bounded(value.targetGeography, 80, false);
  const targetLabel = bounded(value.targetLabel, 120, false);
  if (!targetGeography || !targetLabel) return null;
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
