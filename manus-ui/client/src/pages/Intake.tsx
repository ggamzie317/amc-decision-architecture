import { useLocation } from "wouter";

export default function Intake() {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-16 lg:py-20">
        <div className="border border-border rounded-lg bg-card p-7 sm:p-9">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-4">AMC Case Intake</p>
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-4">Begin Your AMC Case</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            Submit your decision context first. Format selection and payment handoff are shown after intake completion.
          </p>

          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Decision Context</label>
              <textarea
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-28"
                placeholder="Describe the career decision and key constraints."
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Constraint</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Runway, timing, family, role scope, or other constraints"
                defaultValue=""
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Primary Trade-off</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="For example: stability vs transition upside"
                defaultValue=""
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setLocation("/format-handoff")}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
              type="button"
            >
              Complete Intake and Continue
            </button>
            <button
              onClick={() => setLocation("/")}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
              type="button"
            >
              Back to AMC Overview
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            No account required to begin. Your case is handled as a private submission and used for your AMC report and related follow-up only.
          </p>
        </div>
      </main>
    </div>
  );
}
