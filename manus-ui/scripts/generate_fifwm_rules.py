"""Generate browser lookup data by executing the unchanged canonical Python functions.

Run from any directory: python3 manus-ui/scripts/generate_fifwm_rules.py [--check]
Only source code and public choice labels enter the artifact; no customer data does.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import get_args, get_type_hints

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "src"))
import engine  # noqa: E402
import intake_parser  # noqa: E402
import report_payload_builder  # noqa: E402

OUTPUT = ROOT / "manus-ui/client/src/data/generated/fifwm-rules.json"
FIELDS = (
    (18, "q18_change", "framework"),
    (19, "q19_sponsor", "informal"),
    (20, "q20_clarity", "formal"),
    (21, "q21_workflow", "workflow"),
    (22, "q22_exposure", "marketPolicy"),
)


def artifact() -> dict:
    fields = []
    for number, field, factor in FIELDS:
        score_field = f"Q{number}_score"
        scorer = getattr(engine, f"map_q{number}")
        argument = next(iter(get_type_hints(scorer).values()))
        choices = get_args(argument)
        assert len(choices) == 3 and all(isinstance(value, str) for value in choices)
        output = report_payload_builder._resolve_fifwm_subscores({}, {score_field: 2})
        matches = [key for key, value in output.items() if value == 2]
        assert len(matches) == 1, (score_field, output)
        fields.append({
            "number": number,
            "field": field,
            "factor": factor,
            "scoreField": score_field,
            "outputField": matches[0],
            "question": getattr(intake_parser, f"Q{number}_HEADER"),
            "choices": {value: scorer(value) for value in choices},
        })
    return {
        "sourceSha256": {
            name: hashlib.sha256((ROOT / "src" / name).read_bytes()).hexdigest()
            for name in ("intake_parser.py", "engine.py", "report_payload_builder.py")
        },
        "fields": fields,
    }


if __name__ == "__main__":
    rendered = json.dumps(artifact(), ensure_ascii=False, indent=2) + "\n"
    if sys.argv[1:] == ["--check"]:
        if not OUTPUT.exists() or OUTPUT.read_text() != rendered:
            raise SystemExit("FIFWM browser artifact differs from canonical Python sources; regenerate it")
    elif len(sys.argv) == 1:
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(rendered)
    else:
        raise SystemExit("usage: generate_fifwm_rules.py [--check]")
