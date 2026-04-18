import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  buildInitialAnswers,
  INTAKE_META_KEY,
  INTAKE_STORAGE_KEY,
  intakeQuestions,
  intakeSections,
  type IntakeAnswers,
} from "../data/intakeQuestionnaire";

type IntakeMeta = {
  completedAt?: string;
  completed?: boolean;
};

function parseStoredAnswers(): IntakeAnswers {
  const base = buildInitialAnswers();
  if (typeof window === "undefined") {
    return base;
  }

  try {
    const raw = localStorage.getItem(INTAKE_STORAGE_KEY);
    if (!raw) {
      return base;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const q of intakeQuestions) {
      const value = parsed[q.field];
      if (q.type === "multiselect" && Array.isArray(value)) {
        base[q.field] = value.filter((v): v is string => typeof v === "string");
      } else if (q.type === "consent") {
        base[q.field] = value === true;
      } else if (typeof value === "string") {
        base[q.field] = value;
      }
    }
  } catch {
    return base;
  }

  return base;
}

function writeStoredAnswers(answers: IntakeAnswers): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(answers));
}

function writeMeta(meta: IntakeMeta): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(INTAKE_META_KEY, JSON.stringify(meta));
}

function optionLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("/", " / ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Intake() {
  const [, setLocation] = useLocation();
  const [answers, setAnswers] = useState<IntakeAnswers>(() => parseStoredAnswers());
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");

  const totalQuestions = intakeQuestions.length;
  const current = intakeQuestions[index];
  const currentSection = useMemo(
    () => intakeSections.find((section) => section.id === current.sectionId) || intakeSections[0],
    [current.sectionId],
  );
  const section = currentSection;
  const question = current;
  const totalSections = intakeSections.length;

  const progressStatusLine = `Section ${section.id} of ${totalSections} · Question ${question.id} of ${totalQuestions}`;
  const questionProgressLabel = `Question ${index + 1} of ${totalQuestions}`;
  const backButtonLabel = "Back";
  const intakeTitle = "Begin Your AMC Case";
  const intakeDescription = "No account required. Your case is private and used only for your AMC report and follow-up.";
  const overallProgressLabel = "Overall progress";
  const sectionProgressLabel = "Section progress";
  const continueLabel = "Continue";
  const completeIntakeAndContinueLabel = "Complete Intake and Continue";
  const consentRequiredError = "Consent is required to continue.";
  const selectOneLabel = "Select one";

  const sectionQuestionIndex = currentSection.questions.findIndex((q) => q.id === current.id);
  const sectionProgress = ((sectionQuestionIndex + 1) / currentSection.questions.length) * 100;
  const overallProgress = ((index + 1) / totalQuestions) * 100;

  useEffect(() => {
    writeStoredAnswers(answers);
  }, [answers]);

  const updateAnswer = (field: string, value: string | string[] | boolean) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError("");
    }
  };

  const onContinue = () => {
    if (current.type === "consent" && answers[current.field] !== true) {
      setError(consentRequiredError);
      return;
    }

    if (index < totalQuestions - 1) {
      setIndex((v) => v + 1);
      return;
    }

    writeMeta({ completed: true, completedAt: new Date().toISOString() });
    setLocation("/format-handoff");
  };

  const onBack = () => {
    if (index > 0) {
      setIndex((v) => v - 1);
      return;
    }
    setLocation("/");
  };

  const renderInput = () => {
    const value = answers[current.field];

    if (current.type === "textarea") {
      return (
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-36"
          placeholder={current.placeholder}
          value={String(value ?? "")}
          onChange={(e) => updateAnswer(current.field, e.target.value)}
        />
      );
    }

    if (current.type === "select") {
      return (
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={String(value ?? "")}
          onChange={(e) => updateAnswer(current.field, e.target.value)}
        >
          <option value="">{selectOneLabel}</option>
          {(current.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {optionLabel(opt)}
            </option>
          ))}
        </select>
      );
    }

    if (current.type === "multiselect") {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-3">
          {(current.options || []).map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, opt].slice(0, 3)
                      : selected.filter((item) => item !== opt);
                    updateAnswer(current.field, next);
                  }}
                />
                <span>{optionLabel(opt)}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (current.type === "consent") {
      return (
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => updateAnswer(current.field, e.target.checked)}
          />
          <span>{current.label}</span>
        </label>
      );
    }

    return (
      <input
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder={current.placeholder}
        value={String(value ?? "")}
        onChange={(e) => updateAnswer(current.field, e.target.value)}
      />
    );
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 lg:py-16">
        <div className="border border-border rounded-lg bg-card p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl tracking-tight font-semibold mb-3">{intakeTitle}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {intakeDescription}
          </p>

          <div className="space-y-4 mb-7">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <p className="text-sm font-medium">
                {progressStatusLine}
              </p>
              <p className="text-xs text-muted-foreground">{questionProgressLabel}</p>
            </div>

            <div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-foreground/80 rounded-full" style={{ width: `${overallProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{overallProgressLabel}</p>
            </div>

            <div>
              <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-foreground/50 rounded-full" style={{ width: `${sectionProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{sectionProgressLabel}</p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-5 bg-background mb-6">
            {current.type !== "consent" && (
              <>
                <p className="text-sm font-medium mb-3">{current.label}</p>
                {current.helper ? <p className="text-xs text-muted-foreground mb-3">{current.helper}</p> : null}
              </>
            )}
            {renderInput()}
          </div>

          {error ? <p className="text-sm text-red-700 mb-4">{error}</p> : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md border border-border text-sm font-medium"
            >
              {backButtonLabel}
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-medium"
            >
              {index === totalQuestions - 1 ? completeIntakeAndContinueLabel : continueLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
