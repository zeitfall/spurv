# Architecture Decision Records

Format: [Michael Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

Each ADR is stored in a file named `NNNN-kebab-title.md`, and a number is never reused. An ADR starts as `Proposed` and then becomes either `Accepted` or `Rejected`; an Accepted ADR may later become `Superseded by NNNN` or `Deprecated`.

An ADR is required to change the set of modules, their layers, the import rules, or the toolchain, as well as to change any rule that an existing ADR states. By contrast, no ADR is needed for a change to the code style, the API conventions, or the architecture document that contradicts no ADR, nor for the creation of a module that the architecture document already plans.

Once merged into `main`, an Accepted ADR is immutable. Only its Status line may change, together with editorial corrections that preserve its meaning, such as fixes to typos, links, or characters. A decision that changes is therefore recorded in a new ADR, which supersedes the old one.

An Accepted ADR builds only on decisions that are themselves Accepted, although it may refer to superseded ADRs as history.

## Template

```markdown
# NNNN. Title

- Status: Proposed
- Date: YYYY-MM-DD

## Context

The forces that make a decision necessary, stated as connected sentences.

## Decision

The decision itself, together with the reasoning that links it to the context.

## Consequences

The effects of the decision, both favorable and unfavorable.
```

Each section is written in connected prose under the documentation rules of [CONTRIBUTING.md](../../CONTRIBUTING.md#documentation). A sentence states a fact or a reason in full, so a bare fragment such as "Mutable classes." is expanded into a statement of what is decided and why. Conjunctions carry the reasoning from one sentence to the next. A list is used only when its items are genuinely parallel and independent, as alternatives under comparison or unrelated consequences often are, and even then each item is a complete sentence.

## Index

| ADR                                           | Title                                 | Status             |
| --------------------------------------------- | ------------------------------------- | ------------------ |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions         | Accepted           |
| [0002](0002-webgpu-only.md)                   | WebGPU only                           | Accepted           |
| [0003](0003-scene-graph-with-components.md)   | Scene graph with components           | Accepted           |
| [0004](0004-frame-phases.md)                  | Frame phases and render world         | Accepted           |
| [0005](0005-math-conventions.md)              | Math conventions                      | Accepted           |
| [0006](0006-transform-change-tracking.md)     | Transform change tracking             | Superseded by 0015 |
| [0007](0007-runtime-encapsulation.md)         | Runtime encapsulation and inheritance | Superseded by 0018 |
| [0008](0008-const-objects-over-enums.md)      | Const objects instead of enums        | Accepted           |
| [0009](0009-toolchain.md)                     | Toolchain                             | Superseded by 0017 |
| [0010](0010-module-boundaries-and-layers.md)  | Module boundaries and layers          | Accepted           |
| [0011](0011-colocated-tests.md)               | Colocated tests                       | Accepted           |
| [0012](0012-examples-via-public-api.md)       | Examples via the public API           | Superseded by 0017 |
| [0013](0013-reversed-z-depth.md)              | Reversed-Z depth                      | Accepted           |
| [0014](0014-scene-and-scene-nodes.md)         | Scene and scene nodes                 | Accepted           |
| [0015](0015-transform-versions.md)            | Transform versions                    | Accepted           |
| [0016](0016-examples-on-github-pages.md)      | Examples on GitHub Pages              | Superseded by 0017 |
| [0017](0017-toolchain-and-examples.md)        | Toolchain and examples                | Accepted           |
| [0018](0018-encapsulation-and-inheritance.md) | Encapsulation and inheritance         | Accepted           |
| [0019](0019-scene-components.md)              | Scene components                      | Accepted           |
| [0020](0020-gpu-layer-scope.md)               | Scope of the GPU layer                | Accepted           |
| [0021](0021-render-device.md)                 | Render device                         | Accepted           |
