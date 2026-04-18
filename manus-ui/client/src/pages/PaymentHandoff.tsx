import { useLocation } from "wouter";
import { readSubmissionHandoff } from "../data/intakeHandoff";

function getFormatFromLocation(): "essential" | "executive" {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const value = new URLSearchParams(search).get("format");
  return value === "executive" ? "executive" : "essential";
}

export default function PaymentHandoff() {
  const [, setLocation] = useLocation();
  const format = getFormatFromLocation();
  const label = format === "executive" ? "Executive" : "Essential";
  const handoff = readSubmissionHandoff();
  const isValidHandoff = Boolean(handoff && handoff.tier === format && handoff.recipient.email.trim());
  const submitCase = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("amc_case_submitted_v1", "true");
    }
    setLocation("/payment-success");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Final Step for {label}
          </h1>
          {isValidHandoff ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Review your selected format and submit your AMC case.
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed mb-8">
                Selected format: <span className="font-medium">{label}</span>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                Once submitted, your case enters processing and your report is delivered within 3 hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={submitCase}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Submit AMC Case
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/format-handoff")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  Change Format
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                We could not confirm your selected format for this session.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setLocation("/format-handoff")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Go to Format Selection
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/intake")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  Return to Intake
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
