import json, argparse, re
from pathlib import Path
from docx import Document

def replace_in_paragraph(paragraph, mapping):
    # Replace placeholders like {{KEY}} even if split across runs
    full = "".join(run.text for run in paragraph.runs)
    if not full:
        return
    changed = False
    for k, v in mapping.items():
        ph = "{{" + k + "}}"
        if ph in full:
            full = full.replace(ph, str(v))
            changed = True
    if not changed:
        return
    # rewrite runs (simple: put all text into first run, clear others)
    if paragraph.runs:
        paragraph.runs[0].text = full
        for r in paragraph.runs[1:]:
            r.text = ""
    else:
        paragraph.add_run(full)

def replace_in_table(table, mapping):
    for row in table.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                replace_in_paragraph(p, mapping)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--payload", default="output/report_payload_latest.json")
    ap.add_argument("--out", default="output/AMC_Report_Latest.docx")
    args = ap.parse_args()

    payload = json.load(open(args.payload))
    # Only allow string/number values; coerce None to empty string
    mapping = {k: ("" if payload[k] is None else payload[k]) for k in payload.keys()}

    doc = Document(args.template)

    # paragraphs
    for p in doc.paragraphs:
        replace_in_paragraph(p, mapping)

    # tables
    for t in doc.tables:
        replace_in_table(t, mapping)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(out_path))
    print("WROTE:", out_path)

if __name__ == "__main__":
    main()
