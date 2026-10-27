# 0012. Examples via the public API

- Status: Accepted
- Date: 2026-10-27

## Context

- Examples that import library internals do not validate the public API.
- A build step in the development loop slows iteration.
- Node 26 provides `module.stripTypeScriptTypes()`, which replaces types with whitespace and so preserves line and column positions.

## Decision

- Each milestone ([architecture.md](../architecture.md#milestones)) has an example: `examples/NN-name/{index.html, main.ts}`.
- Examples import only `spurv`. An import map resolves it to `src/index.ts`.
- The dev server strips types from `.ts` files on request and serves them as JavaScript. It reloads the page on file change.

## Consequences

- An example that cannot be written with the public API exposes a gap in that API.
- No build step during development.
- Browser stack traces match source positions without source maps.
- `stripTypeScriptTypes` is experimental and emits a warning. This is acceptable for a dev tool.
- Relies on [0009](0009-toolchain.md) (`erasableSyntaxOnly`).
