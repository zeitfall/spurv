# 0011. Colocated tests

- Status: Accepted
- Date: 2026-10-27

## Context

A separate `tests/` tree must either deep-import module internals, which violates [0010](0010-module-boundaries-and-layers.md), or test only public APIs.

## Decision

- A test lives next to its subject: `src/math/vector3.test.ts` tests `src/math/vector3.ts`.
- Tests belong to their module and may import its internal files.
- Shared test helpers (float comparison) live in `src/testing/` ([0010](0010-module-boundaries-and-layers.md)).
- `tsconfig.build.json` excludes `src/**/*.test.ts` and `src/testing/` from `dist/`.

## Consequences

- Tests can cover internals without breaking the boundary rule.
- Tests are visible next to the code they verify.
