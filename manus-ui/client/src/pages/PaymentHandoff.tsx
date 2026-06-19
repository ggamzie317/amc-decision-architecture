import { useState } from "react";
import { useLocation } from "wouter";
import { readSubmissionHandoff } from "../data/intakeHandoff";

function getFormatFromLocation(): "essential" | "executive" {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const value = new URLSearchParams(search).get("format");
  return value === "executive" ? "executive" : "essential";
}

export default function PaymentHandoff() {
  const [, setLocation] = useLocation();
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const apiBase = (import.meta.env.VITE_AMC_SUBMISSION_API_BASE as string | undefined)?.replace(/\/$/, "") || "";
  const format = getFormatFromLocation();
  const label = format === "executive" ? "Executive" : "Essential";
  const handoff = readSubmissionHandoff();
  const isValidHandoff = Boolean(handoff && handoff.tier === format && handoff.recipient.email.trim());
  const submitCase = async () => {
    if (!handoff) {
      setNotice("We could not verify your current format selection for this session.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      const endpoint = `${apiBase}/api/submissions/receipt`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(handoff),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        setNotice("We could not complete your case handoff right now. Please try again.");
        setSubmitting(false);
        return;
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("amc_case_submitted_v1", "true");
      }
      setLocation("/payment-success");
    } catch {
      setNotice("We could not complete your case handoff right now. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Private Case Handoff for {label}
          </h1>
          {isValidHandoff ? (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Review your selected format and confirm your private AMC case handoff.
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed mb-8">
                Selected format: <span className="font-medium">{label}</span>
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {format === "executive"
                  ? "Executive includes the same structured report plus 1-Day Report Q&A after delivery."
                  : "Essential includes report-only delivery for clients who want a standalone structured decision brief."}
              </p>
              {format === "executive" ? (
                <p className="text-xs text-muted-foreground leading-relaxed mb-8">
                  Executive is not open-ended coaching, therapy, or general career advice.
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                After confirmation, your case enters controlled processing and your report is delivered within 3 hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={submitCase}
                  disabled={submitting}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
                >
                  {submitting ? "Confirming Handoff..." : "Confirm Private Case Handoff"}
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/format-handoff")}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
                >
                  Change Format
                </button>
              </div>
              {notice ? <p className="text-xs text-muted-foreground mt-4">{notice}</p> : null}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                We could not verify a valid format selection for this session.
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
              {notice ? <p className="text-xs text-muted-foreground mt-4">{notice}</p> : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
