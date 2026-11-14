# 0030. Reasons for code style rules

- Status: Accepted
- Date: 2026-11-14

## Context

The code style and the API conventions state their rules without reasons ([CONTRIBUTING.md](../../CONTRIBUTING.md#documentation)). Several rules of the code style are not obvious without a reason, and no other ADR records it. This ADR records those reasons and changes no rule.

It builds on the following decisions:

- [0010](0010-module-boundaries-and-layers.md), on module boundaries: the `index.ts` of a module may export internals for other modules, and those are marked `@internal`.
- [0017](0017-toolchain-and-examples.md), on the toolchain: `stripInternal` removes `@internal` declarations from the published declaration files.
- [0018](0018-encapsulation-and-inheritance.md), on encapsulation: every field of a class that is not a math value type is `#private`, and compile-time modifiers are never relied on for protection.

## Decision

Each statement names a rule of the code style and gives its reason.

### Imports and exports

- A statement whose names are all used as types is written as `import type { ... }` ([code-style.md](../code-style.md#imports)). Under `verbatimModuleSyntax`, a statement whose names all carry the inline `type` modifier remains an import without names, and it still loads its source at run time.
- Runtime imports between the files of one module never form a cycle ([code-style.md](../code-style.md#imports)), and scratch variables follow the classes of their file ([code-style.md](../code-style.md#file-structure)). A class cannot be used before its declaration has been evaluated, and a cycle can expose a class to code that runs earlier.
- The tag `@internal` stands on the re-export and never on the declaration ([code-style.md](../code-style.md#exports)). `stripInternal` would remove a tagged declaration, and the declaration files would then export a name whose declaration is missing.

### Module scope

- Module-level state outside the permitted forms is forbidden ([code-style.md](../code-style.md#module-scope)). Such state is shared by every instance of a system and by every test, whereas each entry of a side table belongs to its key and is released together with it.
- The file of a lookup table or a side table exports functions and never the table ([code-style.md](../code-style.md#lookup-tables)). No other file can then perform an operation on the table that the module does not require.

### Classes

- A class has no setters, and a property is assigned through a `set` method ([code-style.md](../code-style.md#accessors-and-methods)). In plain JavaScript, an assignment to a misspelled property creates a new property without an error, whereas a call to a misspelled method throws. The form of a call also shows that the assignment can validate its argument and throw.
- A constructor never calls a public or `protected` method of `this` ([code-style.md](../code-style.md#fields-and-initialization)). While the constructor of a base class runs, the fields of a subclass have not yet been assigned.
- A value type that stores its components in an array keeps the array in a `#private` field behind a getter ([code-style.md](../code-style.md#fields-and-initialization)). The components remain public, while the array itself cannot be replaced.

### Shaders

- The built-in position carries no prefix of a coordinate space ([code-style.md](../code-style.md#shaders)). It denotes a different space in each stage.

### Rejected alternatives

- Reasons beside the rules in the code style were rejected. The code style is a set of instructions that is followed literally, and a reason beside a rule lengthens the text without changing what the rule requires.

## Consequences

- The code style links each of these rules to this ADR.
- Each of these rules is now stated by an ADR, so a change to one of them requires a new ADR ([README](README.md)).
- A rule of the code style whose reason is obvious or is recorded in another ADR is not listed here.
