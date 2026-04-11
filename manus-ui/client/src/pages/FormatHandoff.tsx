import { useLocation } from "wouter";

const formats = [
  {
    key: "essential",
    title: "Essential",
    line1: "Structured AMC Report",
    line2: "Report-only delivery",
  },
  {
    key: "executive",
    title: "Executive",
    line1: "Structured AMC Report",
    line2: "7-day report-linked follow-up chat",
  },
] as const;

export default function FormatHandoff() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">Post-Intake Format Handoff</p>
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">
            Choose the AMC Format That Fits Your Case
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Both formats are built around the same core report. Executive adds a bounded follow-up layer linked to that report.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {formats.map((item) => (
              <div key={item.key} className="border border-border rounded-lg p-6 bg-background">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">{item.title}</p>
                <p className="text-lg font-medium mb-2">{item.line1}</p>
                <p className="text-sm text-muted-foreground mb-6">{item.line2}</p>
                <button
                  type="button"
                  onClick={() => setLocation(`/payment-handoff?format=${item.key}`)}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium w-full"
                >
                  Continue with {item.title}
                </button>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Executive does not change the report itself. It adds a bounded interpretation and clarification layer after delivery. It is not open-ended coaching.
          </p>

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
