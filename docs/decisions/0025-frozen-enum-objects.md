# 0025. Frozen enum objects

- Status: Accepted
- Date: 2026-11-10

## Context

This ADR supersedes [0008](0008-const-objects-over-enums.md). It keeps the decision of 0008 to express an enumeration as a constant object with a derived union type, and it changes only the manner in which that object is made constant.

0008 declares an enum object with `as const`. That assertion exists only at compile time, so the object remains mutable at runtime, and a consumer of plain JavaScript can assign to one of its properties and thereby change the value for every other reader of the object. Two rules that were adopted after 0008 conflict with this. [0018](0018-encapsulation-and-inheritance.md) does not rely on compile-time modifiers for protection, and the code style permits a module-level binding only for a deeply immutable value, a scratch variable, or a side table ([code-style.md](../code-style.md#module-scope)). An enum object is a module-level binding, and `as const` does not make it immutable.

TypeScript infers the literal type of every primitive property of an object literal that is passed to `Object.freeze`, and it marks these properties as read-only. The union type that is derived from such an object therefore equals the one that `as const` produces. The reasons for which 0008 rejects the `enum` keyword of TypeScript remain valid, among them its incompatibility with type stripping ([0017](0017-toolchain-and-examples.md)).

## Decision

An enum object is an object literal that is passed to `Object.freeze`, and its union type is derived as before:

```ts
const BlendMode = Object.freeze({
    OPAQUE: 'OPAQUE',
    ADDITIVE: 'ADDITIVE',
});

type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];
```

`Object.freeze` replaces `as const` and is not combined with it, because the frozen literal already has literal types and the assertion would add nothing. An assignment to a property of the object throws a `TypeError`, since ES modules run in strict mode.

The values of an enum object are primitives. `Object.freeze` is shallow, and the inference of literal types covers primitive properties only, so a nested object would be neither frozen nor typed precisely.

The rules of naming, placement, and export remain in [code-style.md](../code-style.md#enum-objects).

## Consequences

- An enum object is immutable at runtime, so it satisfies the rule of the code style on module scope and the principle of 0018.
- Both `BlendMode.ADDITIVE` and `'ADDITIVE'` remain accepted, and an enum that mirrors a WebGPU enumeration still passes its values to the API without mapping.
- The template of enum objects in the code style changes to the form above.
- The enum object `RenderDeviceEventType` of the module `gpu`, which was written under 0008, is converted to this form.
- Each enum object costs one call of `Object.freeze` when its module is loaded.
- A value of an enum object cannot be an object or an array.
