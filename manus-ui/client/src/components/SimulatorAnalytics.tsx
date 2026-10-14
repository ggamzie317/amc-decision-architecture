import type { SimulatorAnalytics as Stats } from "../../../server/simulatorAnalytics";
const names: Record<string, string> = {
  financialRoom: "Financial Room",
  reversibility: "Reversibility",
  downsideExposure: "Downside Exposure",
  internalReadiness: "Internal Readiness",
  optionBSupport: "Option B Support",
  constraintLoad: "Constraint Load",
  externalValidation: "External Validation",
};
export default function SimulatorAnalytics({ data }: { data?: Stats }) {
  if (!data) return null;
  return (
    <section className="space-y-4 rounded border border-border p-5">
      <h2 className="font-semibold">Interactive Simulator</h2>
      <p className="text-xs text-muted-foreground">{data.label}</p>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries({
          "Simulator opened": data.opened,
          "Simulator adoption rate":
            data.adoptionRate === null ? "—" : `${data.adoptionRate}%`,
          "Eligible baselines": data.eligibleBaselines,
          "Scenario evaluations": data.evaluations,
          "Single-variable": data.modes.single,
          "Multi-variable": data.modes.multi,
          Resets: data.resets,
          "JEV assessments requested": data.jevRequests,
          "JEV assessments completed": data.jevCompleted,
          "JEV unavailable / failure": data.jevUnavailable,
        }).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs">
        Adoption uses unique experimental dashboard journeys as its denominator.
        Visitors are not measured.
      </p>
      <h3 className="text-sm font-semibold">Most-tested variables</h3>
      <ul className="text-sm">
        {Object.entries(data.mostTestedVariables)
          .sort((a, b) => b[1] - a[1])
          .map(([key, value]) => (
            <li key={key}>
              {names[key] || key}: {value}
            </li>
          ))}
      </ul>
      <ul className="text-sm">
        {Object.entries(data.changes).map(([key, value]) => (
          <li key={key}>
            {key}: changed {value.changed} / unchanged {value.unchanged}
          </li>
        ))}
      </ul>
      <details>
        <summary>Direction of change and advisory patterns</summary>
        {Object.entries({ ...data.directions, ...data.advisoryPatterns }).map(
          ([key, value]) => (
            <p className="text-xs" key={key}>
              {key}: {value}
            </p>
          )
        )}
      </details>
    </section>
  );
}
