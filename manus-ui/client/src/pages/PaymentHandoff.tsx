import { useState } from "react";
import { useLocation } from "wouter";
import LanguageToggle from "../components/LanguageToggle";
import { readSubmissionHandoff } from "../data/intakeHandoff";

function getFormatFromLocation(): "essential" | "executive" {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const value = new URLSearchParams(search).get("format");
  return value === "executive" ? "executive" : "essential";
}

export default function PaymentHandoff() {
  const [, setLocation] = useLocation();
  const [notice, setNotice] = useState("");
  const format = getFormatFromLocation();
  const label = format === "executive" ? "Executive" : "Essential";
  const handoff = readSubmissionHandoff();

  const onStripeCheckout = () => {
    setNotice("Stripe Checkout redirect is not connected in this environment yet. Connect Stripe session creation and redirect URL here.");
  };

  const downloadHandoff = () => {
    if (!handoff || typeof window === "undefined") {
      return;
    }
    const blob = new Blob([JSON.stringify(handoff, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `amc_submission_${handoff.submissionId}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="mb-4 flex justify-end">
          <LanguageToggle />
        </div>
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">Payment Handoff</p>
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Continue with {label}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            This step is prepared for Stripe Checkout handoff. Wallet-first methods such as Apple Pay, Google Pay, and Link can be enabled through Stripe Checkout configuration.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mb-8">
            Selected format: <span className="font-medium">{label}</span>
          </p>
          {handoff ? (
            <p className="text-xs text-muted-foreground leading-relaxed mb-8">
              Delivery target: {handoff.recipient.email || "email not provided"} · language {handoff.language.toUpperCase()} · submission {handoff.submissionId}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed mb-8">
              Submission handoff not found yet. Return to format selection to regenerate intake handoff data.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onStripeCheckout}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
            >
              Continue to Stripe Checkout
            </button>
            <button
              type="button"
              onClick={() => setLocation("/format-handoff")}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
            >
              Back to Format Selection
            </button>
          </div>

          {notice ? <p className="text-xs text-muted-foreground mt-4">{notice}</p> : null}

          {handoff ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={downloadHandoff}
                className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border text-sm font-medium"
              >
                Download Handoff JSON
              </button>
            </div>
          ) : null}

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Success route placeholder for Stripe return URL:
            </p>
            <button
              type="button"
              onClick={() => setLocation("/payment-success")}
              className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-border text-sm font-medium"
            >
              Preview Success Screen
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
