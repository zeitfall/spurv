# 0007. Runtime encapsulation and inheritance

- Status: Accepted
- Date: 2026-10-27

## Context

- TypeScript `readonly` and `private` exist only at compile time. Plain JavaScript consumers (for example via CDN) bypass them.
- Deep inheritance with wide parent/child contracts produces fragile hierarchies.

## Decision

- Every field of a class that is not a math value type ([0005](0005-math-conventions.md)) is a `#private` field, exposed through getters and setters as needed.
- TypeScript `readonly` and `private` are never relied on for protection.
- Internal collections are never returned. Access goes through methods and iterators (`childCount`, `getChild(index)`, `children()`).
- Inheritance is used only for contracts inside a module (`Camera`, `Material`). The abstract base owns its state and calls abstract hooks implemented by subclasses (template method). Scene nodes gain behavior through components ([0003](0003-scene-graph-with-components.md)), not subclassing.
- `protected` is an exception that must be justified in the member's TSDoc `@remarks`.

## Consequences

- Invariants hold at runtime. ES modules run in strict mode, so assigning to a getter-only property throws `TypeError`.
- More boilerplate.
- Subclasses cannot access their base class's `#` fields, so contracts must be designed explicitly.
- `#` fields fail through a `Proxy` (Vue `reactive`, MobX). Users must use `markRaw` or an equivalent. This must be documented.
