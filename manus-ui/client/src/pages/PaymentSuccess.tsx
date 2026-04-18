import { useLocation } from "wouter";
import { readSubmissionHandoff } from "../data/intakeHandoff";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const handoff = readSubmissionHandoff();
  const hasValidSuccessContext = Boolean(handoff && handoff.recipient.email.trim());

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          {hasValidSuccessContext ? (
            <>
              <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
                Your AMC case has been received successfully.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Your report is now being prepared and will be delivered to your email.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                If you selected Executive, report-linked follow-up access details will arrive with your delivery.
              </p>

              <div className="border border-border rounded-lg p-5 bg-background mb-8">
                <div className="grid grid-cols-3 gap-3 text-sm font-medium mb-3">
                  <p>Tip in</p>
                  <p>Decide</p>
                  <p>Value up</p>
                </div>
                <p className="text-xs text-muted-foreground">Private · Structure-first · Report-led</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Return to AMC Overview
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/intake")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  Start Another Case
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
                Let’s get your AMC case started.
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                We could not confirm a recent submission from this session. Please continue from intake to complete your case flow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setLocation("/intake")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  Continue to Intake
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  Return to AMC Overview
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
