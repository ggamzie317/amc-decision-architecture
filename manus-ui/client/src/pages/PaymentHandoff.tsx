import { useLocation } from "wouter";

function getFormatFromLocation(): "essential" | "executive" {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const value = new URLSearchParams(search).get("format");
  return value === "executive" ? "executive" : "essential";
}

export default function PaymentHandoff() {
  const [, setLocation] = useLocation();
  const format = getFormatFromLocation();
  const label = format === "executive" ? "Executive" : "Essential";

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Continue with {label}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            You will continue to secure payment for your selected format.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mb-8">
            Selected format: <span className="font-medium">{label}</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setLocation("/payment-success")}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
            >
              Continue to Payment
            </button>
            <button
              type="button"
              onClick={() => setLocation("/format-handoff")}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
            >
              Back to Format Selection
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
