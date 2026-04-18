import { useLocation } from "wouter";
import { buildSubmissionHandoffFromStorage, hasCompletedIntakeState, saveSubmissionHandoff, type AmcTier } from "../data/intakeHandoff";

const formatOptions = [
  {
    key: "essential" as const,
    title: "Essential",
    line1: "Structured AMC Report",
    line2: "Report-only delivery",
  },
  {
    key: "executive" as const,
    title: "Executive",
    line1: "Structured AMC Report",
    line2: "7-day report-linked follow-up chat",
  },
];

export default function FormatHandoff() {
  const [, setLocation] = useLocation();
  const intakeReady = hasCompletedIntakeState();
  const continueWithTier = (tier: AmcTier) => {
    const handoff = buildSubmissionHandoffFromStorage(tier);
    saveSubmissionHandoff(handoff);
    setLocation(`/payment-handoff?format=${tier}`);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Choose the AMC Format That Fits Your Case
          </h1>
          {intakeReady ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Both formats include the same core report. Executive adds bounded report-linked follow-up.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                Checkout access is being released in stages.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {formatOptions.map((item) => (
                  <div key={item.key} className="border border-border rounded-lg p-6 bg-background">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">{item.title}</p>
                    <p className="text-lg font-medium mb-2">{item.line1}</p>
                    <p className="text-sm text-muted-foreground mb-6">{item.line2}</p>
                    <button
                      type="button"
                      onClick={() => continueWithTier(item.key)}
                      className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium w-full"
                    >
                      Select {item.title}
                    </button>
                  </div>
                ))}
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
