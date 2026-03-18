#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT_DIR/fixtures/golden/manifest.json"
OUT_DIR="$ROOT_DIR/output/golden"
TEMPLATE="$ROOT_DIR/templates/AMC_Strategic_Career_Decision_Template_v3_3.docx"

mkdir -p "$OUT_DIR"

ROOT_DIR_ENV="$ROOT_DIR" python3 - << 'PY'
import json, pathlib
import os
root=pathlib.Path(os.environ['ROOT_DIR_ENV'])
manifest=pathlib.Path(root,'fixtures/golden/manifest.json')
out=pathlib.Path(root,'output/golden')
out.mkdir(parents=True,exist_ok=True)
with open(manifest,'r',encoding='utf-8') as f:
    m=json.load(f)
items=[]
for fx in m['fixtures']:
    items.append({
        'id': fx['id'],
        'type': fx['type'],
        'intake': str(pathlib.Path(root, fx['path'])),
        'docx': str(pathlib.Path(out, f"{fx['id']}.docx")),
        'payload': str(pathlib.Path(out, f"{fx['id']}.payload.json")),
    })
with open(pathlib.Path(out,'_run_plan.json'),'w',encoding='utf-8') as f:
    json.dump(items,f,ensure_ascii=False,indent=2)
PY

while IFS= read -r row; do
  id="$(echo "$row" | cut -d'|' -f1)"
  intake="$(echo "$row" | cut -d'|' -f2)"
  docx="$(echo "$row" | cut -d'|' -f3)"
  payload="$(echo "$row" | cut -d'|' -f4)"

  echo "[golden] rendering $id"
  pnpm --dir "$ROOT_DIR/manus-ui" exec tsx "$ROOT_DIR/scripts/run_amc_report.ts" \
    --intake "$intake" \
    --template "$TEMPLATE" \
    --out "$docx" \
    --payload "$payload" \
    --strict-undeclared

done < <(python3 - << 'PY'
import json, pathlib
root=pathlib.Path.cwd()
plan=pathlib.Path(root,'output/golden/_run_plan.json')
rows=json.load(open(plan,'r',encoding='utf-8'))
for r in rows:
    print(f"{r['id']}|{r['intake']}|{r['docx']}|{r['payload']}")
PY
)

python3 - << 'PY'
import json, pathlib, re
from docx import Document

root=pathlib.Path.cwd()
plan=json.load(open(root/'output/golden/_run_plan.json','r',encoding='utf-8'))
summary=[]
for item in plan:
    doc=Document(item['docx'])
    text=[]
    for p in doc.paragraphs:
        text.append(p.text or '')
    for t in doc.tables:
        for r in t.rows:
            for c in r.cells:
                for p in c.paragraphs:
                    text.append(p.text or '')
    full='\n'.join(text)
    leftovers=sorted(set(re.findall(r'\{\{[^}]+\}\}', full)))
    payload=json.load(open(item['payload'],'r',encoding='utf-8'))
    summary.append({
        'id': item['id'],
        'type': item['type'],
        'docx': item['docx'],
        'payload': item['payload'],
        'leftover_placeholders': len(leftovers),
        'case_type': payload.get('case',{}).get('case_type'),
        'comparative_section_visible': 'External Comparative Snapshot' in full,
        'fallback_count': full.count('[Not applicable]')
    })

out_json=root/'output/golden/review_summary.json'
out_md=root/'output/golden/review_summary.md'
json.dump(summary, open(out_json,'w',encoding='utf-8'), ensure_ascii=False, indent=2)

lines=['# AMC Golden Fixture Review Summary','']
for s in summary:
    lines.append(f"- `{s['id']}` ({s['type']})")
    lines.append(f"  - case_type: `{s['case_type']}`")
    lines.append(f"  - leftover_placeholders: `{s['leftover_placeholders']}`")
    lines.append(f"  - comparative_section_visible: `{s['comparative_section_visible']}`")
    lines.append(f"  - fallback_count: `{s['fallback_count']}`")
    lines.append(f"  - payload: `{s['payload']}`")
    lines.append(f"  - docx: `{s['docx']}`")
    lines.append('')

open(out_md,'w',encoding='utf-8').write('\n'.join(lines)+'\n')
print('WROTE',out_json)
print('WROTE',out_md)
PY

echo "[golden] complete: outputs in $OUT_DIR"
