# Task 021 — Fix Manus bridge named imports build blocker

Goal: Fix the manus-ui production build failure caused by default imports from AMC Manus mapping/validation modules.

Context: Soft-launch dry-run build failed during server esbuild. The bridge imports default modules from src/mapAmcToManusRenderPackage.ts and src/validateAmcManusRenderPackage.ts, but both files only provide named exports.

Observed failure:
- No matching export for import "default" in src/mapAmcToManusRenderPackage.ts
- No matching export for import "default" in src/validateAmcManusRenderPackage.ts

Scope: Modify only manus-ui/server/amcSubmissionBridge.ts unless strictly necessary.

Required behavior:
- Replace default imports with named imports.
- Use mapAmcPayloadToManusRenderPackageV1 from src/mapAmcToManusRenderPackage.ts.
- Use validateAmcManusRenderPackageV1 from src/validateAmcManusRenderPackage.ts.
- Remove unnecessary module destructuring if no longer needed.
- Do not change report logic, mapping logic, validation logic, payloads, templates, UI copy, payment logic, email logic, or output files.

Acceptance checks:
- pnpm --dir manus-ui build
- git diff --check

Manual read check: The bridge should import the named functions directly and the production build should pass.
