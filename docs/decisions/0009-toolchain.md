# 0009. Toolchain

- Status: Accepted
- Date: 2026-10-27

## Context

- A library does not need bundling: consumers' bundlers tree-shake ESM.
- Node 26 executes TypeScript natively through type stripping.
- Every dependency is a maintenance and supply-chain cost.

## Decision

| Need              | Tool                                                                |
| ----------------- | ------------------------------------------------------------------- |
| Type checking     | `tsc` (`tsconfig.json`)                                             |
| Build             | `tsc -p tsconfig.build.json` → unbundled ESM + `.d.ts` in `dist/`   |
| Tests             | `node:test`, run directly on `.ts` sources                          |
| Example dev server | Custom `node:http` server with live reload ([0012](0012-examples-via-public-api.md)) |
| Formatter, linter | None for now                                                        |
| Bundler, Vite, Vitest | Not used                                                        |

Compiler constraints:

- `erasableSyntaxOnly`: no `enum`, `namespace`, or parameter properties.
- `verbatimModuleSyntax`: type-only imports use `import type`.
- Relative imports use the `.ts` extension. `rewriteRelativeImportExtensions` maps them to `.js` on build.
- `stripInternal`: `@internal` declarations are removed from the published `.d.ts` files.
- The build uses only `@webgpu/types`, so library code cannot reference Node globals. Tests may use Node APIs.

## Consequences

- Dependencies: `@webgpu/types` (runtime dependency, because published `.d.ts` files reference WebGPU types), plus `typescript` and `@types/node` as development dependencies.
- `node:assert` has no float approximation, so a custom epsilon assertion is required.
- No single-file bundle. One can be added later if CDN usage requires it.
- GPU and visual tests will need a browser runner (likely Playwright). That is deferred.
