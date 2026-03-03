from __future__ import annotations

import hashlib
from typing import Dict, List


def _norm(v: object) -> str:
    return str(v or "").strip().lower()


def _cap(text: str, max_len: int) -> str:
    t = " ".join(str(text or "").split()).strip()
    if len(t) <= max_len:
        return t
    return t[: max_len - 3].rstrip() + "..."


def _pick(options: List[str], seed: str) -> str:
    if not options:
        return ""
    idx = int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16) % len(options)
    return options[idx]


def _tag(external_tags: dict, key: str) -> str:
    v = _norm((external_tags or {}).get(key, "medium"))
    return v if v in {"low", "medium", "high"} else "medium"


def build_external_snapshot(external_inputs: dict, external_tags: dict) -> dict:
    inputs = external_inputs or {}
    tags = external_tags or {}

    decision = _norm(inputs.get("decision_text", ""))
    options = _norm(inputs.get("options_text", ""))
    baseline = _norm(inputs.get("baseline_text", ""))
    safetynet = _norm(inputs.get("safetynet_text", ""))
    location = _norm(inputs.get("location_text", ""))

    irr = _tag(tags, "irreversibility")
    inc = _tag(tags, "income_compression")
    cred = _tag(tags, "credential_dependency")
    comp = _tag(tags, "competition_density")
    vol = _tag(tags, "institutional_volatility")
    mob = _tag(tags, "mobility_load")

    base_seed = (decision or "no-decision") + "|" + (location or "no-location")

    trans_bank = {
        "high": [
            "Transition structure appears path-dependent, with reversal flexibility remaining limited.",
            "Signals suggest a high-commit transition profile with constrained rollback options.",
            "Structural transition load remains elevated, with limited near-term reversibility.",
        ],
        "medium": [
            "Transition structure appears mixed, with partial reversibility under defined contingencies.",
            "Signals indicate moderate commitment intensity with selective path flexibility.",
            "Transition trajectory remains conditional, with reversible and fixed elements coexisting.",
        ],
        "low": [
            "Transition structure appears reversible, with optionality preserved across near-term paths.",
            "Signals indicate low lock-in and manageable path-switch flexibility.",
            "Transition framing remains light, with limited structural commitment pressure.",
        ],
    }

    income_bank = {
        "high": [
            "Income-buffer pressure appears elevated; exposure concentrates where cash-flow continuity is uncertain.",
            "Signals suggest high buffer sensitivity, with downside concentration around income continuity.",
            "Buffer resilience appears thin, and pressure remains concentrated in cash-flow stability.",
        ],
        "medium": [
            "Income-buffer pressure appears moderate, with manageable but visible continuity constraints.",
            "Signals indicate partial buffer support with residual cash-flow sensitivity.",
            "Buffer profile remains balanced, though continuity stress remains conditionally active.",
        ],
        "low": [
            "Income-buffer pressure appears contained, with continuity support remaining structurally visible.",
            "Signals suggest low compression risk under current buffer conditions.",
            "Buffer resilience appears supportive, limiting near-term compression concentration.",
        ],
    }

    cred_tag = "high" if (cred == "high" or comp == "high") else ("low" if cred == "low" and comp == "low" else "medium")
    cred_bank = {
        "high": [
            "Credential and competition gates appear dense, with screening intensity structurally elevated.",
            "Signals indicate high gate dependency and concentrated selection pressure.",
            "Entry structure remains gate-heavy, with competition density likely to stay elevated.",
        ],
        "medium": [
            "Credential and competition signals appear mixed, with selective gate effects across options.",
            "Signals indicate moderate screening density and uneven gate dependency.",
            "Gate profile remains balanced, with competition pressure varying by path.",
        ],
        "low": [
            "Credential and competition friction appears limited, with gate effects remaining light.",
            "Signals suggest low screening density and manageable entry requirements.",
            "Gate structure remains shallow, with limited competitive bottleneck pressure.",
        ],
    }

    fric_tag = "high" if (mob == "high" or vol == "high") else ("low" if mob == "low" and vol == "low" else "medium")
    fric_bank = {
        "high": [
            "Mobility and institutional friction remains elevated, with execution exposure concentrated in transition logistics.",
            "Signals indicate high location-policy friction and elevated institutional variance.",
            "Cross-context movement and institutional variance jointly indicate elevated structural friction.",
        ],
        "medium": [
            "Mobility and institutional friction appears moderate, with identifiable but manageable constraints.",
            "Signals suggest mixed mobility load and mid-level institutional variance.",
            "Friction profile remains conditional, with moderate location and institutional drag.",
        ],
        "low": [
            "Mobility and institutional friction appears contained under current operating conditions.",
            "Signals indicate low movement burden and stable institutional context.",
            "Structural friction remains limited across location and institutional dimensions.",
        ],
    }

    if not any([decision, options, baseline, safetynet, location]):
        neutral = "Signal coverage remains limited; structural interpretation remains provisional across external dimensions."
        return {
            "External_Block_1_Title": "Transition Reality",
            "External_Block_1_Line": _cap(neutral, 140),
            "External_Block_2_Title": "Income / Buffer Pressure",
            "External_Block_2_Line": _cap(neutral, 140),
            "External_Block_3_Title": "Credential & Competition",
            "External_Block_3_Line": _cap(neutral, 140),
            "External_Block_4_Title": "Mobility & Institutional",
            "External_Block_4_Line": _cap(neutral, 140),
        }

    return {
        "External_Block_1_Title": _cap("Transition Reality", 32),
        "External_Block_1_Line": _cap(_pick(trans_bank[irr], base_seed + "|b1"), 140),
        "External_Block_2_Title": _cap("Income / Buffer Pressure", 32),
        "External_Block_2_Line": _cap(_pick(income_bank[inc], base_seed + "|b2"), 140),
        "External_Block_3_Title": _cap("Credential & Competition", 32),
        "External_Block_3_Line": _cap(_pick(cred_bank[cred_tag], base_seed + "|b3"), 140),
        "External_Block_4_Title": _cap("Mobility & Institutional", 32),
        "External_Block_4_Line": _cap(_pick(fric_bank[fric_tag], base_seed + "|b4"), 140),
    }
