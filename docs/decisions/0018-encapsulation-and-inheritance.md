# 0018. Encapsulation and inheritance

- Status: Accepted
- Date: 2026-11-08

## Context

This ADR supersedes [0007](0007-runtime-encapsulation.md). It keeps the rules of 0007 on encapsulation and changes only the set of inheritance relations that are permitted.

The TypeScript modifiers `readonly` and `private` exist only at compile time, so plain JavaScript consumers, for example those that load the library from a CDN, bypass them. Deep inheritance with wide contracts between parent and child produces fragile hierarchies.

0007 permits inheritance only for contracts inside a module and names `Camera` and `Material` as examples. The component model of [0019](0019-scene-components.md) departs from this rule in two respects. Its base class `SceneComponent` belongs to the module `scene`, whereas the classes that extend it belong to modules of higher layers, and its `Camera` is a concrete class that holds a projection, so `Camera` no longer illustrates the rule.

## Decision

Every field of a class that is not a math value type ([0005](0005-math-conventions.md)) is a `#private` field, exposed through getters and setters as needed, and the TypeScript modifiers `readonly` and `private` are never relied on for protection. Internal collections are never returned, so access to them goes through methods and iterators such as `children()`. The modifier `protected` is an exception that is justified in the TSDoc `@remarks` of the member.

Inheritance is permitted in two forms. The first is a contract inside a module, such as `Projection`, in which an abstract base owns its state and calls abstract hooks that its subclasses implement. The second is the extension of `SceneComponent` by a class of any module. Such a class extends `SceneComponent` directly and is not extended further, because the component model finds a component by its exact class. The second form crosses a module boundary, and it is acceptable because the contract consists of a single read-only property.

Scene nodes gain behavior through components ([0003](0003-scene-graph-with-components.md)) and are never subclassed.

## Consequences

- Invariants hold at runtime, because ES modules run in strict mode and an assignment to a getter-only property therefore throws a `TypeError`.
- Encapsulation requires more boilerplate than public fields do.
- Subclasses cannot access the `#private` fields of their base class, so contracts are designed explicitly.
- A `#private` field fails through a `Proxy`, as used by Vue `reactive` or MobX, so consumers apply `markRaw` or an equivalent, and the documentation states this requirement.
- The rule that a component class is not extended further is not checked by the compiler, and a violation appears as a component that a lookup by the parent class does not find.
