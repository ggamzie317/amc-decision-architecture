-- Preserve existing submissions/events while aligning the check with the
-- existing server allowlist. This does not enable JEV or change analysis rules.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE usage_events
  DROP CONSTRAINT IF EXISTS usage_events_event_type_check;
ALTER TABLE usage_events
  ADD CONSTRAINT usage_events_event_type_check CHECK (event_type IN (
    'simulator_opened', 'scenario_variable_changed', 'scenario_evaluated', 'scenario_reset',
    'jev_assessment_requested', 'jev_assessment_completed', 'jev_assessment_unavailable',
    'preview_started', 'preview_completed', 'full_intake_started', 'full_intake_completed',
    'external_evidence_requested', 'external_evidence_live', 'external_evidence_fallback',
    'dashboard_generated', 'detailed_report_opened', 'print_save_clicked', 'language_changed'
  ));

COMMIT;
