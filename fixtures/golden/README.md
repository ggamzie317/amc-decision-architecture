# AMC Golden Fixtures

Canonical semantic review fixture set for AMC render pipeline.

## Coverage
- Single cases: 3
- Comparative cases: 3
- Edge/fallback-heavy cases: 4

## Files
- `manifest.json`: fixture manifest with IDs and intake paths.
- `single_*.json`, `comparative_*.json`, `edge_*.json`: raw intake fixtures.

## Render command

```bash
./scripts/render_golden_fixtures.sh
```

This generates per-fixture outputs in `output/golden/`:
- `<fixture_id>.payload.json`
- `<fixture_id>.docx`
- `review_summary.json`
- `review_summary.md`

These outputs are intentionally generated artifacts for review and are not committed by default.
