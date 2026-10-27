# 0008. Const objects instead of enums

- Status: Accepted
- Date: 2026-10-27

## Context

- TS `enum` emits runtime code and is incompatible with type stripping ([0009](0009-toolchain.md)).
- String enums are nominal: a literal `'ADDITIVE'` is not assignable to `BlendMode.ADDITIVE`, which is hostile to plain-JS consumers.
- Numeric enums produce reverse mappings, so `Object.keys` yields both names and numbers.
- `const enum` breaks under isolated transpilation and in published `.d.ts` files.
- WebGPU's own enums are string unions (`'rgba8unorm'`, `'triangle-list'`).

## Decision

Use `as const` objects with a derived union type:

```ts
const BlendMode = {
    OPAQUE: 'OPAQUE',
    ADDITIVE: 'ADDITIVE',
} as const;

type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];
```

Naming, placement, and export rules are in [code-style.md](../code-style.md#enum-objects).

## Consequences

- Both `BlendMode.ADDITIVE` and `'ADDITIVE'` are accepted.
- Enums that mirror WebGPU enumerations pass their values to the API unmapped.
- One extra line per enum for the type.

References: TypeScript Handbook, "Enums: Objects vs Enums"; D. Vanderkam, *Effective TypeScript*, "Prefer ECMAScript Features to TypeScript Features".
