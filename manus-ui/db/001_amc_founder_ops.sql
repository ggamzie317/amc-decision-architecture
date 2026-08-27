BEGIN;

CREATE TABLE IF NOT EXISTS submissions (
  submission_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  product_version TEXT NOT NULL,
  framework_version TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'ko')),
  case_type TEXT,
  current_stage TEXT NOT NULL,
  preview_started_at TIMESTAMPTZ,
  preview_completed_at TIMESTAMPTZ,
  full_intake_started_at TIMESTAMPTZ,
  full_intake_completed_at TIMESTAMPTZ,
  report_generated_at TIMESTAMPTZ,
  print_save_clicked_at TIMESTAMPTZ,
  external_evidence_mode TEXT CHECK (external_evidence_mode IN ('live', 'fallback', 'mock')),
  external_evidence_confidence TEXT,
  service_storage_consent BOOLEAN NOT NULL DEFAULT FALSE,
  research_use_consent BOOLEAN NOT NULL DEFAULT FALSE,
  answers_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  structural_output_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  external_evidence_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  missing_point TEXT,
  alternative_path TEXT,
  decision_conditions_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  safety_margin_structured_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  existing_fifwm_structured_data JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS usage_events (
  event_id UUID PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(submission_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'preview_started', 'preview_completed', 'full_intake_started', 'full_intake_completed',
    'external_evidence_requested', 'external_evidence_live', 'external_evidence_fallback',
    'dashboard_generated', 'detailed_report_opened', 'print_save_clicked', 'language_changed'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_case_type_idx ON submissions (case_type);
CREATE INDEX IF NOT EXISTS submissions_language_idx ON submissions (language);
CREATE INDEX IF NOT EXISTS submissions_current_stage_idx ON submissions (current_stage);
CREATE INDEX IF NOT EXISTS submissions_research_consent_idx ON submissions (research_use_consent);
CREATE INDEX IF NOT EXISTS submissions_evidence_mode_idx ON submissions (external_evidence_mode);
CREATE INDEX IF NOT EXISTS usage_events_submission_created_idx ON usage_events (submission_id, created_at);
CREATE INDEX IF NOT EXISTS usage_events_type_created_idx ON usage_events (event_type, created_at DESC);

COMMIT;
