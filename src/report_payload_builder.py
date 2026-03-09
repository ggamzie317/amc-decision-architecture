"""Build report payload from a parsed spreadsheet row."""

from __future__ import annotations

from datetime import date
from typing import Dict, Iterable, List

from content_library.external_snapshot import build_external_snapshot
from content_library.executive_sentences import build_executive_sentences, is_placeholder_like
from content_library.phrase_bank import load_phrase_bank
from engine import compute_scores
from intake_parser import parse_pipeline_inputs
from scoring.completeness import compute_completeness
from scoring.diagnosis import build_diagnosis
from scoring.entity import infer_entity_type
from scoring.exposure import compute_exposure
from scoring.external_snapshot import build_external_snapshot as build_external_snapshot_by_type, infer_snapshot_type
from scoring.external_tags import compute_external_structural_tags
from scoring.fifwm import build_fifwm, build_fifwm_subscore
from scoring.motivation import classify_motivation
from scoring.text_defaults import CORE_READ_DEFAULT, EXPERIMENT_DEFAULT, IMPLICATION_DEFAULT, fill_default


def _join_keywords(items):
    return ", ".join(items)


_MANDATORY_TEMPLATE_KEYS = [
    "Full_Name",
    "Language",
    "Report_Date",
    "Data_Completeness_Note",
    "Decision_Context_Summary",
    "Executive_Summary_Paragraph",
    "Exec_Block_1_Title",
    "Exec_Block_1_Line",
    "Exec_Block_2_Title",
    "Exec_Block_2_Line",
    "Exec_Block_3_Title",
    "Exec_Block_3_Line",
    "Exec_Block_4_Title",
    "Exec_Block_4_Line",
    "External_Snapshot_Title",
    "Mobility_Type",
    "Mobility_Reading",
    "Mobility_Implication",
    "D1_Core_Read",
    "D2_Core_Read",
    "D3_Core_Read",
    "D4_Core_Read",
    "D5_Core_Read",
    "D1_Tag",
    "D2_Tag",
    "D3_Tag",
    "D4_Tag",
    "D5_Tag",
    "D1_Implication",
    "D2_Implication",
    "D3_Implication",
    "D4_Implication",
    "D5_Implication",
    "F_Formal_Score",
    "F_Formal_Note",
    "F_Formal_Text",
    "F_Informal_Score",
    "F_Informal_Note",
    "F_Informal_Text",
    "F_Framework_Score",
    "F_Framework_Note",
    "F_Framework_Text",
    "F_Workflow_Score",
    "F_Workflow_Note",
    "F_Workflow_Text",
    "F_MarketPolicy_Score",
    "F_MarketPolicy_Note",
    "F_MarketPolicy_Text",
    "FIFWM_Implication",
    "Temperament_Profile",
    "Best_Case",
    "Worst_Case",
    "Safety_Nets",
    "Decision_Gate_Rule",
    "Audio_Link",
    "Strength_1",
    "Strength_2",
    "Weakness_1",
    "Weakness_2",
    "Top_Action_1",
    "Top_Action_2",
    "Top_Action_3",
]
_MANDATORY_TEMPLATE_KEYS.extend([f"Assumption_{idx}" for idx in range(1, 6)])
_MANDATORY_TEMPLATE_KEYS.extend([f"RedFlag_{idx}" for idx in range(1, 6)])
for exp in (1, 2, 3):
    for suffix in ("Title", "Context", "Objective", "How", "Timeline", "Success", "Abort"):
        _MANDATORY_TEMPLATE_KEYS.append(f"Exp{exp}_{suffix}")
for month in (1, 2, 3):
    for step in (1, 2, 3):
        _MANDATORY_TEMPLATE_KEYS.append(f"M{month}_Action_{step}")

Q6_DECISION_KEY = "Section 2. Main Career Decision\n\n6. What is the main career decision you are considering right now? \n(Paragraph)"
Q8_OPTIONS_KEY = "8. What career options are you currently considering?\nPlease briefly describe each option in 2–3 sentences.\nYou may list them as Option 1, Option 2, etc."
Q27_BASELINE_KEY = "Section 8. Current Reality & Safety Nets\n\n27. If you do nothing and stay where you are for the next 12–18 months, what is the most realistic scenario \n(Paragraph, 3–5 sentences)"
Q28_SAFETYNET_KEY = "28. What realistic Plan B or safety nets do you have if this move does not work out? \n(Paragraph)"


def _coerce_payload_value(value: object) -> object:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return str(value)


def _is_blank(value: object) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def _set_if_blank(payload: Dict[str, object], key: str, value: object) -> None:
    if key not in payload or _is_blank(payload.get(key)):
        payload[key] = value


def _set_if_blank_or_placeholder(payload: Dict[str, object], key: str, value: object) -> None:
    current = payload.get(key)
    if key not in payload or _is_blank(current) or is_placeholder_like(current):
        payload[key] = value


def _first_non_empty_string(payload: Dict[str, object], *keys: str) -> str:
    for key in keys:
        value = payload.get(key, "")
        text = str(value or "").strip()
        if text:
            return text
    return ""


def _get_row_value_casefold(row: Dict[str, object], key: str) -> object:
    target = key.casefold()
    for candidate, value in row.items():
        if str(candidate).casefold() == target:
            return value
    return None


def _first_non_blank(values: Iterable[object]) -> object:
    for value in values:
        if not _is_blank(value):
            return value
    return ""


def _coerce_score_or_blank(value: object) -> object:
    if _is_blank(value):
        return ""
    try:
        return int(float(str(value).strip()))
    except Exception:
        text = str(value).strip()
        return text if text else ""


def _find_row_value_contains(row: Dict[str, object], needle: str) -> str:
    target = needle.casefold()
    for key, value in row.items():
        if target in str(key).casefold():
            return str(value or "").strip()
    return ""


def _has_any(text: str, keywords: Iterable[str]) -> bool:
    return any(k in text for k in keywords)


def _build_mobility_block(decision_text: str, options_text: str) -> Dict[str, str]:
    decision = str(decision_text or "").strip().lower()
    options = str(options_text or "").strip().lower()
    corpus = f"{decision} {options}".strip()

    # Weak-signal deterministic fallback.
    if not corpus:
        return {
            "Mobility_Type": "Category Expansion",
            "Mobility_Reading": "This decision suggests a structural expansion from the current path into an adjacent domain.",
            "Mobility_Implication": "Skill transfer remains partially intact, though positioning must be re-established.",
        }

    switch_signals = (
        "phd",
        "doctoral",
        "academia",
        "academic",
        "founder",
        "startup",
        "government research",
        "public sector",
        "leave corporate",
    )
    internal_signals = (
        "internal",
        "promotion",
        "same company",
        "within current organization",
        "expand scope internally",
    )
    substitution_signals = (
        "same role",
        "similar role",
        "another firm",
        "another company",
        "switch company",
        "same field",
        "same logic",
        "peer company",
    )
    expansion_signals = (
        "business development",
        "strategy",
        "adjacent",
        "broader scope",
        "cross-functional",
        "sales to strategy",
        "execution to",
    )

    if _has_any(corpus, switch_signals):
        return {
            "Mobility_Type": "Category Switch",
            "Mobility_Reading": "This decision represents a structural category switch across distinct career architectures.",
            "Mobility_Implication": "Existing seniority does not transfer directly, increasing transition friction.",
        }
    if _has_any(corpus, internal_signals):
        return {
            "Mobility_Type": "Internal Expansion",
            "Mobility_Reading": "This decision indicates structural expansion within the existing organizational path.",
            "Mobility_Implication": "Transferability remains high, with execution risk concentrated in scope scaling.",
        }
    if _has_any(corpus, substitution_signals):
        return {
            "Mobility_Type": "Substitution Shift",
            "Mobility_Reading": "This decision reflects a structural substitution into a similar role architecture at a different platform.",
            "Mobility_Implication": "Core capability transfer remains intact, while context adaptation drives early friction.",
        }
    if _has_any(corpus, expansion_signals):
        return {
            "Mobility_Type": "Category Expansion",
            "Mobility_Reading": "This decision suggests a structural expansion from the current path into an adjacent domain.",
            "Mobility_Implication": "Skill transfer remains partially intact, though positioning must be re-established.",
        }

    return {
        "Mobility_Type": "Category Expansion",
        "Mobility_Reading": "This decision suggests a structural expansion from the current path into an adjacent domain.",
        "Mobility_Implication": "Skill transfer remains partially intact, though positioning must be re-established.",
    }


def _score_state(score: float) -> str:
    x = float(score)
    if x <= 0:
        return "fragile"
    if x < 2:
        return "mixed"
    return "supportive"


def _implication_state(score: float) -> str:
    x = float(score)
    if x <= 0:
        return "further signal validation"
    if x < 2:
        return "guardrails and staged testing"
    return "selective acceleration"


def _pick_phrase(phrases: List[str], idx: int, fallback: str) -> str:
    if not phrases:
        return fallback
    return phrases[idx % len(phrases)]


def _format_structural_read(phrase_bank: Dict[str, List[str]], dimension: str, score: float, idx: int) -> str:
    tpl = _pick_phrase(
        phrase_bank.get("structural_read_templates", []),
        idx,
        "{dimension} signal appears {signal_state}.",
    )
    text = tpl.format(dimension=dimension, signal_state=_score_state(score)).strip()
    return text if text else f"{dimension} signal appears {_score_state(score)}."


def _format_implication(phrase_bank: Dict[str, List[str]], score: float, idx: int) -> str:
    tpl = _pick_phrase(
        phrase_bank.get("implication_templates", []),
        idx,
        "Implication suggests {implication_state} under current assumptions.",
    )
    text = tpl.format(implication_state=_implication_state(score)).strip()
    return text if text else f"Implication suggests {_implication_state(score)} under current assumptions."


def _generate_exec_lines(payload: Dict[str, object], phrase_bank: Dict[str, List[str]]) -> Dict[str, str]:
    verdict = str(payload.get("Verdict_Label", "") or "Conditional Go")
    total = str(payload.get("Total_Score", "") or "0")
    d1 = float(payload.get("D1", 0) or 0)
    d2 = float(payload.get("D2", 0) or 0)
    d3 = float(payload.get("D3", 0) or 0)
    d4 = float(payload.get("D4", 0) or 0)
    d5 = float(payload.get("D5", 0) or 0)
    risk_line = _pick_phrase(
        phrase_bank.get("risk_signal_oneliner", []),
        0,
        "Signal concentration appears elevated in the current structure.",
    )

    return {
        "Exec_Block_1_Line": f"{verdict} appears indicated at {total}/10 under current structural signals.",
        "Exec_Block_2_Line": f"D1={int(d1)}, D2={int(d2)}, D5={int(d5)}; structural outlook appears {_score_state((d1+d2+d5)/3)}.",
        "Exec_Block_3_Line": risk_line,
        "Exec_Block_4_Line": f"D4={int(d4)} with D3={int(d3)}; personal and exposure balance appears {_score_state((d4+d3)/2)}.",
    }


def build_executive_blocks(context: dict) -> dict:
    blocks = build_executive_sentences(context)
    return {
        "verdict": blocks["Exec_Block_1_Line"],
        "outlook": blocks["Exec_Block_2_Line"],
        "risk": blocks["Exec_Block_3_Line"],
        "personal": blocks["Exec_Block_4_Line"],
    }


def build_hybrid_plan(context: dict) -> list:
    _ = context  # keep signature stable for future context-based branching.
    return [
        {
            "title": "Income Buffer Stress Simulation",
            "context": "Evaluate financial durability under a transition scenario.",
            "objective": "Quantify the minimum viable stability threshold for optionality.",
            "timeline": "4–6 weeks",
            "success_signal": "Buffer >= 12 months confirmed.",
            "abort_trigger": "Buffer < 6 months with no mitigation path.",
        },
        {
            "title": "Market / Academic Signal Validation",
            "context": "Test directional assumptions across market and academic pathways.",
            "objective": "Validate demand credibility and acceptance probability with external evidence.",
            "timeline": "3–5 weeks",
            "success_signal": "At least two independent signals confirm pathway viability.",
            "abort_trigger": "Signals remain contradictory after defined validation cycle.",
        },
        {
            "title": "Re-entry Optionality Mapping",
            "context": "Map fallback routes that preserve time-to-income and role continuity.",
            "objective": "Establish a reversible path with explicit re-entry options.",
            "timeline": "2–4 weeks",
            "success_signal": "At least one credible re-entry route documented and validated.",
            "abort_trigger": "No viable re-entry route identified within scope window.",
        },
    ]


def _resolve_fifwm_subscores(row: Dict[str, object], payload: Dict[str, object]) -> Dict[str, object]:
    mapping = {
        "F_Informal_Score": "Q19_score",
        "F_Formal_Score": "Q20_score",
        "F_Workflow_Score": "Q21_score",
        "F_MarketPolicy_Score": "Q22_score",
        "F_Framework_Score": "Q18_score",
    }
    resolved: Dict[str, object] = {}
    for out_key, source_key in mapping.items():
        source = _first_non_blank((
            _get_row_value_casefold(row, source_key),
            payload.get(source_key),
            payload.get(out_key),
        ))
        resolved[out_key] = _coerce_score_or_blank(source)
    return resolved


def _compute_data_completeness_note(payload: Dict[str, object], row: Dict[str, object]) -> str:
    sources: List[object] = [
        payload.get("Q27_raw"),
        payload.get("Q28_raw"),
        _first_non_blank((row.get("Q11"), _get_row_value_casefold(row, "Q11"))),
        _first_non_blank((row.get("Q12"), _get_row_value_casefold(row, "Q12"))),
        _first_non_blank((payload.get("Decision_Context_Summary"), row.get("Decision_Context_Summary"))),
    ]

    present_count = sum(1 for v in sources if not _is_blank(v))
    ratio = present_count / len(sources)
    if ratio >= 0.80:
        return "High (qualitative signals available)."
    if ratio >= 0.50:
        return "Moderate (some qualitative inputs limited)."
    return "Partial (key qualitative signals missing)."


def fill_defaults(payload: Dict[str, object], row: Dict[str, object]) -> Dict[str, object]:
    phrase_bank = load_phrase_bank()
    main_decision = _find_row_value_contains(row, "6. What is the main career decision")
    options_text = _find_row_value_contains(row, "8. What career options")
    entity = infer_entity_type(main_decision, options_text)

    # Mandatory keys must exist and be non-None for clean merge replacement.
    for key in _MANDATORY_TEMPLATE_KEYS:
        if key not in payload or payload[key] is None:
            payload[key] = ""

    payload["Entity_Type"] = entity["entity_type"]
    payload["Entity_Label"] = entity["entity_label"]
    payload["Stability_Label"] = entity["stability_label"]

    # Executive blocks
    _set_if_blank(payload, "Exec_Block_1_Title", "Verdict")
    _set_if_blank(payload, "Exec_Block_2_Title", "Structural Outlook")
    _set_if_blank(payload, "Exec_Block_3_Title", "Structural Risk")
    _set_if_blank(payload, "Exec_Block_4_Title", "Personal & Exposure")
    legacy_lines = _generate_exec_lines(payload, phrase_bank)

    decision_text = _find_row_value_contains(row, "9. If you had to decide today")
    nonnegotiable_text = _find_row_value_contains(row, "11. In your own words")
    fears_text = _find_row_value_contains(row, "12. What are your biggest fears")
    motivation_type = classify_motivation(decision_text, nonnegotiable_text, fears_text)
    payload["Motivation_Type"] = motivation_type

    exposure = compute_exposure(
        q27_text=str(payload.get("Q27_raw", "") or ""),
        q28_text=str(payload.get("Q28_raw", "") or ""),
        urgency_raw=str(_first_non_blank((row.get("7. How urgent is this decision?"), row.get("Q7"), ""))),
    )
    safety_net_level = "low" if str(payload.get("Q28_Safety_Class", "")).strip().lower() in {"none", "low"} else "moderate"
    exec_context = {
        "verdict": payload.get("Verdict_Label", "Conditional Go"),
        "exposure_score": exposure.display,
        "market_score": int(float(payload.get("D1", 1) or 1)),
        "risk_score": int(float(payload.get("D3", 1) or 1)),
        "fit_score": int(float(payload.get("D4", 1) or 1)),
        "safety_net_level": safety_net_level,
        "motivation_type": motivation_type,
        "case_id": _first_non_blank(
            (
                row.get("Timestamp"),
                row.get("2. Email address"),
                row.get("Full_Name"),
                payload.get("Full_Name"),
            )
        ),
        "Full_Name": payload.get("Full_Name", ""),
        "2. Email address": row.get("2. Email address", ""),
    }
    exec_blocks = build_executive_sentences(exec_context)
    _set_if_blank_or_placeholder(payload, "Exec_Block_1_Title", exec_blocks["Exec_Block_1_Title"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_1_Line", exec_blocks["Exec_Block_1_Line"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_2_Title", exec_blocks["Exec_Block_2_Title"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_2_Line", exec_blocks["Exec_Block_2_Line"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_3_Title", exec_blocks["Exec_Block_3_Title"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_3_Line", exec_blocks["Exec_Block_3_Line"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_4_Title", exec_blocks["Exec_Block_4_Title"])
    _set_if_blank_or_placeholder(payload, "Exec_Block_4_Line", exec_blocks["Exec_Block_4_Line"])
    for key, value in legacy_lines.items():
        _set_if_blank(payload, key, value)
    for idx in (1, 2, 3, 4):
        _set_if_blank(payload, f"Exec_Block_{idx}_Line", "Signal currently insufficient for a confident summary.")

    # Diagnosis blocks
    dimensions = {
        1: "Market outlook",
        2: entity["stability_label"],
        3: "Structural risk",
        4: "Fit alignment",
        5: "Downside exposure",
    }
    for idx in (1, 2, 3, 4, 5):
        d_key = f"D{idx}"
        core_key = f"D{idx}_Core_Read"
        impl_key = f"D{idx}_Implication"
        score_val = float(payload.get(d_key, 0) or 0)
        generated_core = _format_structural_read(phrase_bank, dimensions[idx], score_val, idx)
        generated_impl = _format_implication(phrase_bank, score_val, idx)
        diag = build_diagnosis(
            d_score_internal=score_val,
            core_read=str(payload.get(core_key, "") or generated_core),
            implication=str(payload.get(impl_key, "") or generated_impl),
        )
        _set_if_blank(payload, core_key, diag.core_read if diag.core_read else CORE_READ_DEFAULT)
        _set_if_blank(payload, impl_key, diag.implication if diag.implication else IMPLICATION_DEFAULT)
    payload["D2_Tag"] = entity["stability_label"]

    # FIFWM blocks
    scores = _resolve_fifwm_subscores(row, payload)
    subscores = {}
    for prefix in ("F_Formal", "F_Informal", "F_Framework", "F_Workflow", "F_MarketPolicy"):
        score_key = f"{prefix}_Score"
        note_key = f"{prefix}_Note"
        text_key = f"{prefix}_Text"

        payload[score_key] = scores.get(score_key, payload.get(score_key, ""))
        if _is_blank(payload.get(score_key)):
            payload[score_key] = "—"

        _set_if_blank(payload, note_key, "Signal remains incomplete; monitor before re-weighting.")
        sub = build_fifwm_subscore(
            name=prefix.replace("F_", ""),
            internal=0.0 if payload[score_key] == "—" else float(payload[score_key]),
            note=str(payload.get(note_key, "")),
        )
        subscores[prefix] = sub
        _set_if_blank(payload, text_key, sub.note)

    # Assemble FIFWM typed result (kept internal for modularized scoring).
    _ = build_fifwm(
        formal=subscores["F_Formal"],
        informal=subscores["F_Informal"],
        framework=subscores["F_Framework"],
        workflow=subscores["F_Workflow"],
        marketpolicy=subscores["F_MarketPolicy"],
    )

    # Experiment blocks (auto-generated hybrid plan)
    hybrid_plan = build_hybrid_plan(
        {
            "verdict": payload.get("Verdict_Label", ""),
            "entity_type": payload.get("Entity_Type", "company"),
            "market_score": payload.get("D1", 1),
        }
    )
    for idx, item in enumerate(hybrid_plan, start=1):
        _set_if_blank(payload, f"Exp{idx}_Title", item["title"])
        _set_if_blank(payload, f"Exp{idx}_Context", item["context"])
        _set_if_blank(payload, f"Exp{idx}_Objective", item["objective"])
        _set_if_blank(payload, f"Exp{idx}_Timeline", item["timeline"])
        _set_if_blank(payload, f"Exp{idx}_Success", item["success_signal"])
        _set_if_blank(payload, f"Exp{idx}_Abort", item["abort_trigger"])
        _set_if_blank(payload, f"Exp{idx}_How", "Execution path appears feasible through scoped evidence loops.")
    # Backstop for any additional experiment fields
    exp_defaults = {
        "Context": EXPERIMENT_DEFAULT,
        "Objective": "Objective not yet specified; define the signal to validate.",
        "Timeline": "Timeline not yet specified; time-box for signal capture.",
        "Success": "Success signal not yet defined; specify observable criteria.",
        "Abort": "Abort trigger not yet defined; specify a clear red signal.",
        "How": "Approach not yet specified; outline a minimal test method.",
        "Title": "Experiment scope pending",
    }
    for idx in (1, 2, 3):
        for suffix, default_value in exp_defaults.items():
            key = f"Exp{idx}_{suffix}"
            _set_if_blank(payload, key, fill_default(str(payload.get(key, "") or ""), default_value))

    # Action and checklist bullets
    for month in (1, 2, 3):
        for action in (1, 2, 3):
            _set_if_blank(payload, f"M{month}_Action_{action}", "—")
    for idx in range(1, 6):
        _set_if_blank(payload, f"Assumption_{idx}", "—")
        _set_if_blank(payload, f"RedFlag_{idx}", "—")

    if _is_blank(payload.get("Report_Date")):
        payload["Report_Date"] = date.today().isoformat()

    # Modular completeness engine, mapped to existing display format used by template/tests.
    completeness = compute_completeness(payload)
    level_to_note = {
        "High": "High (qualitative signals available).",
        "Moderate": "Moderate (some qualitative inputs limited).",
        "Partial": "Partial (key qualitative signals missing).",
        "Low": "Partial (key qualitative signals missing).",
    }
    payload["Data_Completeness_Note"] = level_to_note.get(completeness.level, _compute_data_completeness_note(payload, row))

    # Exposure result computed and available for future matrix detail if needed.
    _ = exposure

    # External structural tags (v1): decision-type agnostic external architecture view.
    external_tags = compute_external_structural_tags(
        {
            "external_inputs": payload.get("external_inputs", {}),
        }
    )
    fixed_external = {
        "irreversibility": external_tags.get("irreversibility", "medium"),
        "income_compression": external_tags.get("income_compression", "medium"),
        "credential_dependency": external_tags.get("credential_dependency", "medium"),
        "competition_density": external_tags.get("competition_density", "medium"),
        "institutional_volatility": external_tags.get("institutional_volatility", "medium"),
        "mobility_load": external_tags.get("mobility_load", "medium"),
    }
    payload["External_Tag_Irreversibility"] = fixed_external["irreversibility"]
    payload["External_Tag_IncomeCompression"] = fixed_external["income_compression"]
    payload["External_Tag_CredentialDependency"] = fixed_external["credential_dependency"]
    payload["External_Tag_CompetitionDensity"] = fixed_external["competition_density"]
    payload["External_Tag_InstitutionalVolatility"] = fixed_external["institutional_volatility"]
    payload["External_Tag_MobilityLoad"] = fixed_external["mobility_load"]
    payload["external_structural_tags"] = dict(fixed_external)

    mobility = _build_mobility_block(
        decision_text=str(payload.get("external_inputs", {}).get("decision_text", "") or ""),
        options_text=str(payload.get("external_inputs", {}).get("options_text", "") or ""),
    )
    payload["Mobility_Type"] = mobility["Mobility_Type"]
    payload["Mobility_Reading"] = mobility["Mobility_Reading"]
    payload["Mobility_Implication"] = mobility["Mobility_Implication"]

    snapshot_type = infer_snapshot_type(payload.get("external_inputs", {}))
    snapshot_block = build_external_snapshot_by_type(snapshot_type, payload.get("external_structural_tags", {}))
    payload["External_Snapshot_Type"] = snapshot_type
    if snapshot_type == "academic_transition":
        payload["External_Snapshot_Title"] = "External Snapshot — Academic Transition"
    elif snapshot_type == "industry_transition":
        payload["External_Snapshot_Title"] = "External Snapshot — Industry Transition"
    else:
        payload["External_Snapshot_Title"] = "External Snapshot"
    ordered_snapshot_lines = []
    if isinstance(snapshot_block, dict):
        for key in (
            "mobility",
            "credential",
            "income",
            "industry_direction",
            "competition",
            "compensation",
            "transition",
        ):
            val = str(snapshot_block.get(key, "") or "").strip()
            if val:
                ordered_snapshot_lines.append(val)
        # Keep exactly four lines for template rendering consistency.
        deduped = []
        for line in ordered_snapshot_lines:
            if line not in deduped:
                deduped.append(line)
            if len(deduped) == 4:
                break
        while len(deduped) < 4:
            deduped.append("Signals remain mixed; external structure indicates conditional visibility.")
        payload["External_Snapshot"] = "\n".join(deduped[:4])
    else:
        text = str(snapshot_block or "").strip()
        if text:
            lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
            while len(lines) < 4:
                lines.append("Signals remain mixed; external structure indicates conditional visibility.")
            payload["External_Snapshot"] = "\n".join(lines[:4])
        else:
            payload["External_Snapshot"] = "\n".join(
                [
                    "Signals suggest transition structure remains conditionally feasible.",
                    "Buffer and income continuity signals remain mixed under current assumptions.",
                    "Credential and competition pressure appears moderate in the current path set.",
                    "Mobility and institutional friction remains visible but not dominant.",
                ]
            )

    external_snapshot = build_external_snapshot(payload.get("external_inputs", {}), fixed_external)
    payload.update(external_snapshot)
    return payload


def build_report_payload(row: Dict[str, object], lang: str) -> Dict[str, object]:
    parsed = parse_pipeline_inputs(row, lang)
    answers = parsed["answers"]
    scores = compute_scores(answers)

    baseline = parsed["baseline_keywords"]
    safety = parsed["safetynet_keywords"]
    combined = parsed["combined_keywords"]

    payload = dict(scores)
    payload.update(
        {
            "Q27_Baseline_Class": answers["q27_baseline"],
            "Q28_Safety_Class": answers["q28_safety"],
            "Baseline_Keywords_Market": _join_keywords(baseline["market"]["keywords"]),
            "Baseline_Keywords_Internal": _join_keywords(baseline["internal"]["keywords"]),
            "Baseline_Keywords_Personal": _join_keywords(baseline["personal"]["keywords"]),
            "SafetyNet_Keywords_Market": _join_keywords(safety["market"]["keywords"]),
            "SafetyNet_Keywords_Internal": _join_keywords(safety["internal"]["keywords"]),
            "SafetyNet_Keywords_Personal": _join_keywords(safety["personal"]["keywords"]),
            "Market_Variability_Bar": combined["market"]["variability_bar"],
            "Internal_Variability_Bar": combined["internal"]["variability_bar"],
            "Personal_Variability_Bar": combined["personal"]["variability_bar"],
            "Structural_Variability_Label": "구조적 변동성" if lang == "ko" else "Structural Variability",
            "Q27_raw": parsed["q27_raw"],
            "Q28_raw": parsed["q28_raw"],
        }
    )

    # Pass through all sheet columns (exact keys) without overwriting score outputs.
    for key, value in row.items():
        if key not in payload:
            payload[str(key)] = _coerce_payload_value(value)

    payload["external_inputs"] = {
        "decision_text": _first_non_empty_string(payload, Q6_DECISION_KEY, "Decision_Context_Summary"),
        "options_text": _first_non_empty_string(payload, Q8_OPTIONS_KEY),
        "baseline_text": _first_non_empty_string(payload, "Q27_raw", Q27_BASELINE_KEY),
        "safetynet_text": _first_non_empty_string(payload, "Q28_raw", Q28_SAFETYNET_KEY),
        "location_text": _first_non_empty_string(payload, "3. Current country / city"),
    }

    return fill_defaults(payload, row)
