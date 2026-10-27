# 0010. Module boundaries and layers

- Status: Accepted
- Date: 2026-10-27

## Context

- A monorepo (Babylon.js style) adds build and versioning overhead. That pays off only with multiple packages, separate dependencies, or independent release cycles, and none apply.
- Without enforced boundaries, a single package degrades into a tangle that cannot be split later.

## Decision

- Single npm package in a single repository.
- A module is a directory under `src/` with an `index.ts` that defines the module's API.
- Each module belongs to a numbered layer. The current assignment is in [architecture.md](../architecture.md).
- Import rules:
  - A module imports another module only through its `index.ts`, and only from a lower layer. Imports within the same layer and upward are forbidden.
  - Files inside a module import each other directly by relative path, never through their own `index.ts`.
  - Only `renderer` imports `gpu`. Only `gpu` and `renderer` use WebGPU APIs.
  - `src/testing` is imported only by `*.test.ts` files and is excluded from the build.
  - `examples/` import only the public package `spurv`.
- `src/index.ts` is the public API. It re-exports public entities explicitly by name. A module's `index.ts` may export internals for other modules, and those are marked `@internal`.
- A module directory is created only when its first code exists.

## Consequences

- Everything except `gpu` and `renderer` is testable in Node without a GPU.
- Any module can later become a separate package at low cost.
- Named re-exports in `src/index.ts` keep `@internal` exports out of the runtime public API.
- The rules will be enforced by `scripts/check-imports.ts`.
