# Task 022 — Fix Manus bridge runtime module interop

Goal: Fix the manus-ui server runtime startup failure caused by TypeScript/tsx module interop for AMC Manus mapping and validation modules.

Context: Task 021 fixed the production build default-import blocker, and pnpm --dir manus-ui build now passes. However, running pnpm exec tsx server/index.ts fails because direct named imports from src/mapAmcToManusRenderPackage.ts and src/validateAmcManusRenderPackage.ts are not available at runtime.

Observed runtime behavior:
- import * as mapModule exposes keys: default, module.exports
- mapAmcPayloadToManusRenderPackageV1 exists under mapModule.default and mapModule["module.exports"]
- validateAmcManusRenderPackageV1 exists under validateModule.default and validateModule["module.exports"]

Scope: Modify only manus-ui/server/amcSubmissionBridge.ts unless strictly necessary.

Required behavior:
- Use a build-safe and runtime-safe import pattern for the mapping and validation modules.
- Resolve mapAmcPayloadToManusRenderPackageV1 from namespace/default/module.exports as needed.
- Resolve validateAmcManusRenderPackageV1 from namespace/default/module.exports as needed.
- Fail clearly at startup if either function cannot be resolved.
- Do not change report logic, mapping logic, validation logic, payloads, templates, UI copy, payment logic, email logic, or output files.

Acceptance checks:
- pnpm --dir manus-ui build
- pnpm --dir manus-ui exec tsx server/index.ts should not fail immediately with import/export errors
- git diff --check

Manual read check: The bridge should handle the current tsx runtime interop shape without changing AMC mapping or validation semantics.
