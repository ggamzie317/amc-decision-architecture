/**
 * AMC Report Layout
 * 
 * Design Philosophy:
 * - Premium consulting brief aesthetic
 * - Restrained, analytical, structural tone
 * - Clear distinction between scored and non-scored layers
 * - Dense but readable information hierarchy
 * - Calm, elegant visual presentation
 * 
 * This layout preserves the 11-section structure without redesigning AMC logic.
 */

import { Card } from "@/components/ui/card";
import { mockReportPayload } from "@/data/mockReportPayload";
import reportPayloadJson from "@/data/reportPayload.json";

const report = {
  ...mockReportPayload,
  ...reportPayloadJson,
} as const;

function symbolFromStatus(status: string): string {
  const text = String(status || "");
  if (text.includes("▲")) return "▲";
  if (text.includes("▼")) return "▼";
  if (text.includes("○")) return "○";
  if (text.includes("●")) return "●";
  if (text.includes("◐")) return "◐";
  return "◆";
}

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Report Header */}
      <div className="border-b border-border bg-card">
        <div className="report-container py-12 px-6">
          <div className="mb-4">
            <span className="report-label text-xs">Career Decision Brief</span>
          </div>
          <h1 className="report-title mb-2">All of My Career</h1>
          <p className="report-caption text-base">
            A structural lens and reasoning tool for serious career decisions
          </p>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="report-container">
        {/* 1. EXECUTIVE DASHBOARD */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Executive Dashboard</h2>
            <p className="report-caption mt-2">
              One-page structured overview of the decision
            </p>
          </div>

          <div className="dashboard-grid mb-8">
            {/* Structural Reading */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Structural Reading</span>
              </div>
              <p className="report-body text-sm leading-relaxed">
                {report.Dashboard_Verdict}
              </p>
            </div>

            {/* Core Structural Insight */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Core Structural Insight</span>
              </div>
              <p className="report-body text-sm leading-relaxed">
                {report.Dashboard_Core_Insight}
              </p>
            </div>

            {/* Risk Summary */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Risk Summary</span>
              </div>
              <p className="report-body text-sm leading-relaxed">{report.Dashboard_Risk_Summary}</p>
            </div>

            {/* Value Summary */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Value Summary</span>
              </div>
              <p className="report-body text-sm leading-relaxed">
                {report.Dashboard_Value_Summary}
              </p>
            </div>

            {/* Mobility Summary */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Mobility Summary</span>
              </div>
              <p className="report-body text-sm leading-relaxed">
                {report.Dashboard_Mobility_Summary}
              </p>
            </div>

            {/* Temperament Summary */}
            <div className="dashboard-item">
              <div className="mb-3">
                <span className="report-label">Temperament Summary</span>
              </div>
              <p className="report-body text-sm leading-relaxed">
                {report.Dashboard_Temperament_Summary}
              </p>
            </div>
          </div>
        </section>

        {/* 2. EXECUTIVE OVERVIEW */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Executive Overview</h2>
            <p className="report-caption mt-2">
              Short narrative overview of the case and main structural tension
            </p>
          </div>

          <div className="report-card">
            <p className="report-body mb-4">
              This decision reflects a fundamental structural choice between two
              distinct career paths. The primary tension centers on the trade-off
              between immediate stability and long-term structural positioning.
            </p>
            <p className="report-body mb-4">
              Current path appears to preserve known value structures and
              established networks, while the transition path suggests potential
              value expansion but introduces execution risk and market exposure.
            </p>
            <p className="report-body">
              The analysis indicates that commitment to either path becomes more
              defensible under specific structural conditions—not based on
              motivational factors, but on measurable shifts in external context,
              internal readiness, and risk containment.
            </p>
          </div>
        </section>

        {/* 3. EXTERNAL SNAPSHOT */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">External Snapshot</h2>
            <p className="report-caption mt-2">
              {report.External_Snapshot_Title}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Direction */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Market Direction</span>
              </div>
              <div className="mb-4 text-2xl font-light">{symbolFromStatus(report.External_OptionA_Market_Status)}</div>
              <p className="report-body text-sm">
                {report.External_Market_Direction}
              </p>
            </div>

            {/* Competition Pressure */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Competition Pressure</span>
              </div>
              <div className="mb-4 text-2xl font-light">{symbolFromStatus(report.External_OptionA_Competition_Status)}</div>
              <p className="report-body text-sm">
                {report.External_Competition_Pressure}
              </p>
            </div>

            {/* Economic Pressure */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Economic Pressure</span>
              </div>
              <div className="mb-4 text-2xl font-light">{symbolFromStatus(report.External_OptionA_Economic_Status)}</div>
              <p className="report-body text-sm">
                {report.External_Economic_Pressure}
              </p>
            </div>

            {/* Transition Friction */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Transition Friction</span>
              </div>
              <div className="mb-4 text-2xl font-light">{symbolFromStatus(report.External_OptionA_Transition_Status)}</div>
              <p className="report-body text-sm">
                {report.External_Transition_Friction}
              </p>
            </div>
          </div>
        </section>

        {/* 4. EXTERNAL COMPARATIVE SNAPSHOT */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">External Comparative Snapshot</h2>
            <p className="report-caption mt-2">
              Comparison between Option A and Option B
            </p>
          </div>

          {/* Comparison Table */}
          <div className="mb-6 overflow-x-auto">
            <table className="comparison-matrix">
              <thead>
                <tr>
                  <th className="w-1/3">Dimension</th>
                  <th className="w-1/3">{report.External_OptionA_Label}</th>
                  <th className="w-1/3">{report.External_OptionB_Label}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium">Market Direction</td>
                  <td>{report.External_OptionA_Market_Status}</td>
                  <td>{report.External_OptionB_Market_Status}</td>
                </tr>
                <tr>
                  <td className="font-medium">Competition Pressure</td>
                  <td>{report.External_OptionA_Competition_Status}</td>
                  <td>{report.External_OptionB_Competition_Status}</td>
                </tr>
                <tr>
                  <td className="font-medium">Economic Pressure</td>
                  <td>{report.External_OptionA_Economic_Status}</td>
                  <td>{report.External_OptionB_Economic_Status}</td>
                </tr>
                <tr>
                  <td className="font-medium">Transition Friction</td>
                  <td>{report.External_OptionA_Transition_Status}</td>
                  <td>{report.External_OptionB_Transition_Status}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mb-6 p-4 bg-secondary/20 rounded-lg">
            <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Status Legend
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">▲</span> Supportive
              </div>
              <div>
                <span className="font-medium">◆</span> Mixed
              </div>
              <div>
                <span className="font-medium">▼</span> Constrained
              </div>
              <div>
                <span className="font-medium">○</span> Contained
              </div>
              <div>
                <span className="font-medium">◐</span> Moderate
              </div>
              <div>
                <span className="font-medium">●</span> Elevated
              </div>
            </div>
          </div>

          {/* Comparative Reading & Implication */}
          <div className="space-y-4">
            <div className="report-card">
              <div className="mb-2">
                <span className="report-label">Comparative Reading</span>
              </div>
              <p className="report-body text-sm">
                {report.External_Comparative_Reading}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-2">
                <span className="report-label">Comparative Implication</span>
              </div>
              <p className="report-body text-sm">
                {report.External_Comparative_Implication}
              </p>
            </div>
          </div>
        </section>

        {/* 5. STRUCTURAL RISK DIAGNOSIS */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Structural Risk Diagnosis</h2>
            <p className="report-caption mt-2">
              Internal structural exposure analysis
            </p>
          </div>

          {/* Internal Structural Snapshot */}
          <div className="mb-8">
            <h3 className="report-subsection-title mb-4">Internal Structural Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="report-card">
                <div className="mb-3">
                  <span className="report-label">Skill Alignment</span>
                </div>
                <p className="report-body text-sm">
                  {report.Internal_Structural_Snapshot}
                </p>
              </div>
              <div className="report-card">
                <div className="mb-3">
                  <span className="report-label">Network Position</span>
                </div>
                <p className="report-body text-sm">
                  Established network remains strong in current domain. Transition
                  requires network rebuilding and new relationship formation.
                </p>
              </div>
              <div className="report-card">
                <div className="mb-3">
                  <span className="report-label">Financial Runway</span>
                </div>
                <p className="report-body text-sm">
                  Financial position suggests 12–18 month runway for transition
                  experimentation. Longer runway reduces execution pressure.
                </p>
              </div>
              <div className="report-card">
                <div className="mb-3">
                  <span className="report-label">Execution Capacity</span>
                </div>
                <p className="report-body text-sm">
                  Current role allows 10–15 hours per week for transition
                  exploration. Capacity remains constrained but sufficient.
                </p>
              </div>
            </div>
          </div>

          {/* D1-D5 Diagnosis */}
          <div className="mb-8">
            <h3 className="report-subsection-title mb-4">Structural Diagnosis (D1–D5)</h3>
            <div className="space-y-4">
              <div className="report-card border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-2">
                  <span className="report-label">D1: Decision Clarity</span>
                  <span className="scored-badge">Scored</span>
                </div>
                <p className="report-body text-sm">
                  Clarity appears moderate. Core trade-offs are visible, but
                  structural conditions for commitment remain undefined.
                </p>
              </div>

              <div className="report-card border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-2">
                  <span className="report-label">D2: Downside Containment</span>
                  <span className="scored-badge">Scored</span>
                </div>
                <p className="report-body text-sm">
                  Downside appears contained. Financial runway and existing
                  network provide recovery options if transition fails.
                </p>
              </div>

              <div className="report-card border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-2">
                  <span className="report-label">D3: Differentiation Potential</span>
                  <span className="scored-badge">Scored</span>
                </div>
                <p className="report-body text-sm">
                  Differentiation potential appears moderate to high. Unique
                  skill combination suggests competitive advantage in transition.
                </p>
              </div>

              <div className="report-card border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-2">
                  <span className="report-label">D4: Execution Readiness</span>
                  <span className="scored-badge">Scored</span>
                </div>
                <p className="report-body text-sm">
                  Execution readiness appears moderate. Key skill gaps exist but
                  appear addressable through structured learning.
                </p>
              </div>

              <div className="report-card border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-2">
                  <span className="report-label">D5: Decision Reversibility</span>
                  <span className="scored-badge">Scored</span>
                </div>
                <p className="report-body text-sm">
                  Reversibility remains high. Current network and skills suggest
                  return to existing path remains possible within 18–24 months.
                </p>
              </div>
            </div>
          </div>

          {/* Structural Sustainability & Safety Margin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="report-card border-l-4 border-l-accent">
              <div className="flex justify-between items-start mb-3">
                <span className="report-label">Structural Sustainability Reading</span>
                <span className="scored-badge">Scored</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Financial</span>
                  <span className="text-sm font-semibold">7/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Intellectual</span>
                  <span className="text-sm font-semibold">6/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Functional</span>
                  <span className="text-sm font-semibold">7/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wellness</span>
                  <span className="text-sm font-semibold">6/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Meaning</span>
                  <span className="text-sm font-semibold">7/10</span>
                </div>
              </div>
            </div>

            <div className="report-card border-l-4 border-l-accent">
              <div className="flex justify-between items-start mb-3">
                <span className="report-label">Safety Margin</span>
                <span className="scored-badge">Scored</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Financial Buffer</span>
                    <span className="text-sm font-semibold">Moderate</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-blue-500" style={{ width: "65%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Network Resilience</span>
                    <span className="text-sm font-semibold">High</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "80%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Implications */}
          <div className="report-card">
            <div className="mb-3">
              <span className="report-label">Risk Implications</span>
            </div>
            <p className="report-body text-sm">
              Structural risk remains manageable but not negligible. Key exposure
              centers on execution complexity and market timing. Downside
              containment remains strong due to financial runway and network
              resilience. Risk profile suggests commitment becomes more defensible
              if external conditions stabilize or internal execution readiness
              increases.
            </p>
          </div>
        </section>

        {/* 6. CAREER VALUE STRUCTURE */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Career Value Structure</h2>
            <p className="report-caption mt-2">
              Value comparison between current and transition paths
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Current Path */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Current Path</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Financial Value
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.Value_Current_Path}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Skill Development
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Deepening in existing domain. Limited exposure to new areas.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Network Value
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Strong, established relationships. High social capital.
                  </p>
                </div>
              </div>
            </div>

            {/* Transition Path */}
            <div className="report-card">
              <div className="mb-4">
                <span className="report-label">Transition Path</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Financial Value
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.Value_Transition_Path}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Skill Development
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rapid skill expansion. Exposure to new domains and methodologies.
                  </p>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-1">
                    Network Value
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Network rebuilding required. New relationship formation 12–18 months.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Reading & Implication */}
          <div className="space-y-4">
            <div className="report-card">
              <div className="mb-2">
                <span className="report-label">Value Reading</span>
              </div>
              <p className="report-body text-sm">
                {report.Value_Structure_Reading}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-2">
                <span className="report-label">Value Implication</span>
              </div>
              <p className="report-body text-sm">
                {report.Value_Structure_Implication}
              </p>
            </div>
          </div>
        </section>

        {/* 7. CAREER MOBILITY STRUCTURE */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Career Mobility Structure</h2>
            <p className="report-caption mt-2">
              Mobility analysis for the selected path
            </p>
          </div>

          <div className="space-y-4">
            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Mobility Type</span>
              </div>
              <p className="report-body text-sm font-semibold">
                {report.Mobility_Type}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Mobility Reading</span>
              </div>
              <p className="report-body text-sm">
                {report.Mobility_Reading}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Mobility Implication</span>
              </div>
              <p className="report-body text-sm">
                {report.Mobility_Implication}
              </p>
            </div>
          </div>
        </section>

        {/* 8. STRATEGIC TEMPERAMENT */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Strategic Temperament</h2>
            <p className="report-caption mt-2">
              Temperament alignment with decision structure
            </p>
          </div>

          <div className="space-y-4">
            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Temperament Profile</span>
              </div>
              <p className="report-body text-sm font-semibold">
                {report.Temperament_Profile}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Temperament Reading</span>
              </div>
              <p className="report-body text-sm">
                {report.Temperament_Reading}
              </p>
            </div>

            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Temperament Implication</span>
              </div>
              <p className="report-body text-sm">
                {report.Temperament_Implication}
              </p>
            </div>
          </div>
        </section>

        {/* 9. FIVE-FACTOR STRUCTURAL VIEW */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Five-Factor Structural View</h2>
            <p className="report-caption mt-2">
              Compact scored synthesis layer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Path */}
            <div className="report-card border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start mb-4">
                <span className="report-label">Current Path</span>
                <span className="scored-badge">Scored</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Stability</span>
                    <span className="text-sm font-semibold">8/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-blue-500" style={{ width: "80%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Growth Potential</span>
                    <span className="text-sm font-semibold">4/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-amber-500" style={{ width: "40%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Execution Risk</span>
                    <span className="text-sm font-semibold">2/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "20%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Reversibility</span>
                    <span className="text-sm font-semibold">9/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "90%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Alignment</span>
                    <span className="text-sm font-semibold">7/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-blue-500" style={{ width: "70%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transition Path */}
            <div className="report-card border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start mb-4">
                <span className="report-label">Transition Path</span>
                <span className="scored-badge">Scored</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Stability</span>
                    <span className="text-sm font-semibold">4/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-amber-500" style={{ width: "40%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Growth Potential</span>
                    <span className="text-sm font-semibold">8/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "80%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Execution Risk</span>
                    <span className="text-sm font-semibold">6/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-red-500" style={{ width: "60%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Reversibility</span>
                    <span className="text-sm font-semibold">7/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "70%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Alignment</span>
                    <span className="text-sm font-semibold">8/10</span>
                  </div>
                  <div className="scorecard-bar">
                    <div className="scorecard-bar-segment bg-emerald-500" style={{ width: "80%" }}></div>
                    <div className="scorecard-bar-segment bg-secondary/30"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. HYBRID EXPLORATION PLAN */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Hybrid Exploration Plan</h2>
            <p className="report-caption mt-2">
              Structured experiments to test transition viability
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Experiment 1 */}
            <div className="exploration-card">
              <div className="mb-3">
                <span className="report-label">Experiment 1: Skill Validation</span>
              </div>
              <p className="report-body text-sm mb-3">
                Complete one structured learning program in critical skill gap.
                Duration: 8–12 weeks. Objective: Validate learning capacity and
                skill acquisition speed.
              </p>
              <div className="text-xs text-muted-foreground">
                Checkpoint: Completion of certification or project deliverable
              </div>
            </div>

            {/* Experiment 2 */}
            <div className="exploration-card">
              <div className="mb-3">
                <span className="report-label">Experiment 2: Network Testing</span>
              </div>
              <p className="report-body text-sm mb-3">
                Conduct 10–15 informational interviews with target network.
                Duration: 6–8 weeks. Objective: Test market receptivity and
                identify relationship-building patterns.
              </p>
              <div className="text-xs text-muted-foreground">
                Checkpoint: Relationship quality assessment and feedback synthesis
              </div>
            </div>

            {/* Experiment 3 */}
            <div className="exploration-card">
              <div className="mb-3">
                <span className="report-label">Experiment 3: Execution Simulation</span>
              </div>
              <p className="report-body text-sm mb-3">
                Execute one small project or engagement in target domain.
                Duration: 10–12 weeks. Objective: Test execution capability and
                market fit.
              </p>
              <div className="text-xs text-muted-foreground">
                Checkpoint: Project completion and outcome assessment
              </div>
            </div>
          </div>

          {/* Next-Step Considerations */}
          <div className="report-card">
            <div className="mb-4">
              <span className="report-label">Next-Step Considerations</span>
            </div>
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Weeks 1–4: Foundation & Skill Initiation
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Begin Experiment 1. Conduct initial network interviews.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Weeks 5–8: Skill Deepening & Network Expansion
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete Experiment 1. Expand Experiment 2 interviews.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-accent-foreground text-sm font-semibold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Weeks 9–12: Execution Testing & Assessment
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Execute Experiment 3. Synthesize learnings. Assess commitment readiness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. DECISION CONDITIONS */}
        <section className="report-section">
          <div className="report-section-header">
            <h2 className="report-section-title">Decision Conditions</h2>
            <p className="report-caption mt-2">
              Structural conditions that support commitment
            </p>
          </div>

          <div className="space-y-4">
            {/* Commitment Condition */}
            <div className="decision-conditions-box">
              <div className="mb-4">
                <span className="report-label">Commitment Condition</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Condition 1: External Stabilization
                  </p>
                  <p className="report-body text-sm">
                    Market conditions show sustained improvement or competitive
                    pressure stabilizes. Commitment becomes more defensible when
                    external headwinds diminish.
                  </p>
                </div>
                <div className="border-t border-border/50 pt-3">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Condition 2: Execution Validation
                  </p>
                  <p className="report-body text-sm">
                    Hybrid Exploration Plan yields positive results. Skill
                    acquisition, network receptivity, and project execution all
                    validate transition viability.
                  </p>
                </div>
                <div className="border-t border-border/50 pt-3">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Condition 3: Financial Readiness
                  </p>
                  <p className="report-body text-sm">
                    Financial runway extends to 18+ months. Commitment becomes
                    more defensible when financial buffer provides sufficient
                    execution time.
                  </p>
                </div>
                <div className="border-t border-border/50 pt-3">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Condition 4: Structural Clarity
                  </p>
                  <p className="report-body text-sm">
                    Core trade-offs remain visible and accepted. Commitment
                    remains defensible only when structural tensions are
                    acknowledged, not minimized.
                  </p>
                </div>
              </div>
            </div>

            {/* Final Assessment */}
            <div className="report-card">
              <div className="mb-3">
                <span className="report-label">Assessment Summary</span>
              </div>
              <p className="report-body text-sm">
                Current structural conditions suggest that commitment to either
                path remains defensible, contingent on alignment with the
                conditions outlined above. The analysis does not recommend a
                specific path—it structures the decision by making visible where
                risk concentrates, what trade-offs exist, and under what
                conditions commitment becomes more or less supportable.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/20 py-8 px-6">
          <div className="report-container">
            <p className="report-caption text-center">
              This report is a structural analysis tool, not a recommendation engine.
              <br />
              It is designed to support serious career decisions through clarity on
              trade-offs, risk, and defensible conditions for commitment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
