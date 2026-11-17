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

The question that requires a decision, and the decisions that it builds on.

## Decision

The statements of the decision, followed by the rejected alternatives.

## Consequences

The effects of the decision that a reader would not expect.
```

An ADR is as short as its decision allows.

- **Context** states the question in a few sentences. Each decision that the ADR builds on is listed as a link, followed by its topic and by the fact that is taken from it, so that the reader does not have to open it.
- **Decision** states what is decided as a list of short statements, grouped under subheadings when it covers several topics. A reason accompanies a statement only where the statement is not obvious without it.
- **Rejected alternatives** is the last subsection of the decision. It lists only the alternatives that were seriously considered, each with its strongest reason.
- **Consequences** lists only the effects that a reader would not expect, together with the questions that the ADR resolves and the decisions that it defers.

Every list item is a complete sentence under the documentation rules of [CONTRIBUTING.md](../../CONTRIBUTING.md#documentation).

## Index

| ADR                                            | Title                                 | Status             |
| ---------------------------------------------- | ------------------------------------- | ------------------ |
| [0001](0001-record-architecture-decisions.md)  | Record architecture decisions         | Accepted           |
| [0002](0002-webgpu-only.md)                    | WebGPU only                           | Accepted           |
| [0003](0003-scene-graph-with-components.md)    | Scene graph with components           | Accepted           |
| [0004](0004-frame-phases.md)                   | Frame phases and render world         | Accepted           |
| [0005](0005-math-conventions.md)               | Math conventions                      | Accepted           |
| [0006](0006-transform-change-tracking.md)      | Transform change tracking             | Superseded by 0015 |
| [0007](0007-runtime-encapsulation.md)          | Runtime encapsulation and inheritance | Superseded by 0018 |
| [0008](0008-const-objects-over-enums.md)       | Const objects instead of enums        | Superseded by 0025 |
| [0009](0009-toolchain.md)                      | Toolchain                             | Superseded by 0017 |
| [0010](0010-module-boundaries-and-layers.md)   | Module boundaries and layers          | Accepted           |
| [0011](0011-colocated-tests.md)                | Colocated tests                       | Accepted           |
| [0012](0012-examples-via-public-api.md)        | Examples via the public API           | Superseded by 0017 |
| [0013](0013-reversed-z-depth.md)               | Reversed-Z depth                      | Accepted           |
| [0014](0014-scene-and-scene-nodes.md)          | Scene and scene nodes                 | Accepted           |
| [0015](0015-transform-versions.md)             | Transform versions                    | Accepted           |
| [0016](0016-examples-on-github-pages.md)       | Examples on GitHub Pages              | Superseded by 0017 |
| [0017](0017-toolchain-and-examples.md)         | Toolchain and examples                | Accepted           |
| [0018](0018-encapsulation-and-inheritance.md)  | Encapsulation and inheritance         | Accepted           |
| [0019](0019-scene-components.md)               | Scene components                      | Superseded by 0026 |
| [0020](0020-gpu-layer-scope.md)                | Scope of the GPU layer                | Accepted           |
| [0021](0021-render-device.md)                  | Render device                         | Accepted           |
| [0022](0022-render-device-resources.md)        | Render device resources               | Accepted           |
| [0023](0023-camera-and-projection.md)          | Camera and projection                 | Accepted           |
| [0024](0024-geometry-and-vertex-data.md)       | Geometry and vertex data              | Accepted           |
| [0025](0025-frozen-enum-objects.md)            | Frozen enum objects                   | Accepted           |
| [0026](0026-scene-components-and-meshes.md)    | Scene components and meshes           | Accepted           |
| [0027](0027-renderer.md)                       | Renderer                              | Accepted           |
| [0028](0028-materials-and-shaders.md)          | Materials and shaders                 | Accepted           |
| [0029](0029-render-world-and-gpu-resources.md) | Render world and GPU resources        | Accepted           |
| [0030](0030-code-style-reasons.md)             | Reasons for code style rules          | Accepted           |
