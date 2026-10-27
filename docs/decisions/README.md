# Architecture Decision Records

Format: [Michael Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

- File: `NNNN-kebab-title.md`. Numbers are never reused.
- Status: `Proposed` → `Accepted` → (`Superseded by NNNN` | `Deprecated`).
- An ADR is required for changes to modules and layers, the toolchain, public API conventions, or any rule an existing ADR states. Changes confined to `docs/code-style.md` or `docs/architecture.md` do not need one.
- An Accepted ADR becomes immutable once merged into `main`. A changed decision gets a new ADR that supersedes the old one.
- An Accepted ADR depends only on Accepted ADRs.

## Template

```markdown
# NNNN. Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
```

## Index

| ADR                                              | Title                                 | Status   |
| ------------------------------------------------ | ------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md)    | Record architecture decisions         | Accepted |
| [0002](0002-webgpu-only.md)                      | WebGPU only                           | Accepted |
| [0003](0003-scene-graph-with-components.md)      | Scene graph with components           | Accepted |
| [0004](0004-frame-phases.md)                     | Frame phases and render world         | Accepted |
| [0005](0005-math-conventions.md)                 | Math conventions                      | Accepted |
| [0006](0006-transform-change-tracking.md)        | Transform change tracking             | Accepted |
| [0007](0007-runtime-encapsulation.md)            | Runtime encapsulation and inheritance | Accepted |
| [0008](0008-const-objects-over-enums.md)         | Const objects instead of enums        | Accepted |
| [0009](0009-toolchain.md)                        | Toolchain                             | Accepted |
| [0010](0010-module-boundaries-and-layers.md)     | Module boundaries and layers          | Accepted |
| [0011](0011-colocated-tests.md)                  | Colocated tests                       | Accepted |
| [0012](0012-examples-via-public-api.md)          | Examples via the public API           | Accepted |
