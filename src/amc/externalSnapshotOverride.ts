export type OverrideMarketDirectionStatus = "supportive" | "mixed" | "constrained";
export type OverridePressureStatus = "contained" | "moderate" | "elevated";

export interface OverrideDimension<TStatus extends string> {
  status: TStatus;
  summary: string;
  evidence: string[];
}

export interface AmcExternalSnapshotOverride {
  source: "perplexity_sonar";
  marketDirection: OverrideDimension<OverrideMarketDirectionStatus>;
  competitionPressure: OverrideDimension<OverridePressureStatus>;
  economicPressure: OverrideDimension<OverridePressureStatus>;
  transitionFriction: OverrideDimension<OverridePressureStatus>;
  sourceNotes: string[];
  marketDataDate: string;
}
