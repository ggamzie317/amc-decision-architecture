import { useLocation } from "wouter";
import { buildSubmissionHandoffFromStorage, hasCompletedIntakeState, saveSubmissionHandoff } from "../data/intakeHandoff";

export default function FormatHandoff() {
  const [, setLocation] = useLocation();
  const intakeReady = hasCompletedIntakeState();
  const continueWithFullReport = () => {
    const handoff = buildSubmissionHandoffFromStorage("essential");
    saveSubmissionHandoff(handoff);
    setLocation("/payment-handoff?format=essential");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Continue with the AMC Full Structural Report
          </h1>
          {intakeReady ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                AMC now uses one full report format with the same structural intelligence across the dashboard and detailed report.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                After selection, you will review and submit your case.
              </p>

              <div className="border border-border rounded-lg p-6 bg-background">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">AMC Full Structural Report</p>
                <p className="text-lg font-medium mb-2">Full Dashboard + Detailed Report</p>
                <p className="text-sm text-muted-foreground mb-6">A single structural reading with evidence, risks, alternatives, and Decision Conditions.</p>
                <button
                  type="button"
                  onClick={continueWithFullReport}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium w-full"
                >
                  Continue with Full Report
                </button>
              </div>
            </>
          ) : (
            <div className="border border-border rounded-lg p-6 bg-background mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Please complete your case intake before selecting a format.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setLocation("/intake")}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Continue to Intake
                </button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setLocation("/intake")}
              className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border text-sm font-medium"
            >
              Back to Intake
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
