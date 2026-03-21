# AMC Render Stabilization Note

- CI failure root cause was `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
- Workflow pnpm version was aligned with `manus-ui/packageManager` (`pnpm@10.4.1`).
- `pnpm/action-setup` now runs before `actions/setup-node` cache usage.
- Node 20 deprecation annotation is currently treated as warning-only, not a blocking failure.
- Local smoke verification confirmed:
  - strict single render succeeds
  - strict comparative render succeeds
  - golden fixture render succeeds
  - `leftover_placeholders = 0` for all fixtures in `output/golden/review_summary.json`
- Generated render outputs are ignored via `.gitignore`.

See also: `docs/amc_render_ci_troubleshooting.md` for current triage and local reproduction commands.
