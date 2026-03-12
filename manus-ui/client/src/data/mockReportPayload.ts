export const mockReportPayload = {
  Dashboard_Verdict: "Pivot - Hold",
  Dashboard_Core_Insight:
    "Structural upside remains credible, though near-term exposure stays concentrated across transition and buffer conditions.",
  Dashboard_Risk_Summary:
    "Risk remains mixed, with pressure concentrated in economic continuity and transition friction.",
  Dashboard_Value_Summary:
    "Current structure preserves continuity while transition structure increases long-horizon optionality at higher near-term cost.",
  Dashboard_Mobility_Summary:
    "Mobility profile indicates category expansion with execution load concentrated in early positioning phases.",
  Dashboard_Temperament_Summary:
    "Temperament profile is balanced, supporting conditional commitment under staged risk reduction.",
  External_Snapshot_Title: "External Snapshot - Industry Transition",
  External_Market_Direction:
    "Market direction appears mixed, with directional visibility present but still moderated by external policy and cycle uncertainty.",
  External_Competition_Pressure:
    "Competition pressure appears moderate, with selective gate effects and uneven differentiation pressure across adjacent option sets.",
  External_Economic_Pressure:
    "Economic pressure appears moderate, with manageable continuity risk but visible sensitivity to short-term cash-flow disruption.",
  External_Transition_Friction:
    "Transition friction appears moderate, with partial reversibility but meaningful execution load concentrated in adaptation phases.",
  External_OptionA_Label: "Option A",
  External_OptionA_Market_Status: "◆ Mixed",
  External_OptionA_Competition_Status: "◐ Moderate",
  External_OptionA_Economic_Status: "○ Contained",
  External_OptionA_Transition_Status: "○ Contained",
  External_OptionB_Label: "Option B",
  External_OptionB_Market_Status: "▲ Supportive",
  External_OptionB_Competition_Status: "● Elevated",
  External_OptionB_Economic_Status: "◐ Moderate",
  External_OptionB_Transition_Status: "● Elevated",
  External_Comparative_Reading:
    "Option A preserves continuity with lower friction, while Option B carries higher external pressure with broader repositioning upside.",
  External_Comparative_Implication:
    "The structural trade-off remains between near-term containment and long-horizon repositioning under higher execution pressure.",
  Internal_Structural_Snapshot:
    "Structural exposure remains mixed, with concentrated pressure in economic continuity and transition variables.",
  Value_Current_Path: "Established role continuity with preserved income structure.",
  Value_Transition_Path:
    "Higher transition cost with potential long-term positioning upside and reduced immediate stability.",
  Value_Structure_Reading:
    "Current structure preserves continuity, while transition structure increases optionality under higher near-term compression.",
  Value_Structure_Implication:
    "The core trade-off remains between immediate continuity and longer-horizon structural upside.",
  Mobility_Type: "Category Expansion",
  Mobility_Reading:
    "This decision suggests a structural expansion from the current path into an adjacent domain.",
  Mobility_Implication:
    "Skill transfer remains partially intact, though positioning must be re-established.",
  Temperament_Profile: "Balanced",
  Temperament_Reading:
    "Behavioral profile reflects mixed optimization between stability and opportunity.",
  Temperament_Implication:
    "This supports a conditional path in which risk is reduced before commitment.",
} as const;

export type MockReportPayload = typeof mockReportPayload;
