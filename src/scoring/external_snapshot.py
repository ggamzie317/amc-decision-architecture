def infer_snapshot_type(external_inputs):
    decision = (external_inputs.get("decision_text") or "").lower()

    if "phd" in decision or "doctor" in decision:
        return "academic_transition"

    return "industry_transition"


def build_external_snapshot(snapshot_type, tags):
    _ = tags

    if snapshot_type == "academic_transition":
        return {
            "mobility": "Mobility and institutional friction appears moderate, with identifiable but manageable constraints.",
            "credential": "Signals indicate high gate dependency and concentrated selection pressure.",
            "income": "Buffer resilience appears thin, and pressure remains concentrated in cash-flow stability.",
            "transition": "Signals suggest a high-commit transition profile with constrained rollback options.",
        }

    if snapshot_type == "industry_transition":
        return {
            "industry_direction": "Hiring demand appears cyclical with moderate sensitivity to macro conditions.",
            "competition": "Signals indicate moderate competition with differentiation driven by domain expertise.",
            "compensation": "Compensation bands remain relatively stable while upside dispersion increases at senior levels.",
            "transition": "Transition feasibility depends primarily on network access and role-specific signaling.",
        }

    return {}
