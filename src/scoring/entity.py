from __future__ import annotations

from typing import Dict


def infer_entity_type(main_decision_text: str, options_text: str) -> Dict[str, str]:
    text = f"{main_decision_text or ''} {options_text or ''}".lower()

    program_signals = ["phd", "doctoral", "program", "school", "university", "master", "campus"]
    venture_signals = ["startup", "business", "venture", "founding", "founder", "company build", "entrepreneur"]

    if any(sig in text for sig in program_signals):
        return {
            "entity_type": "program",
            "entity_label": "program",
            "stability_label": "Program Stability & Institutional Fit",
        }

    if any(sig in text for sig in venture_signals):
        return {
            "entity_type": "venture",
            "entity_label": "venture",
            "stability_label": "Venture Stability & Execution Risk",
        }

    return {
        "entity_type": "company",
        "entity_label": "company",
        "stability_label": "Company Stability & Governance",
    }
