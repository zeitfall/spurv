# Code style

## Scope and definitions

These rules apply to all TypeScript in the repository, including tests, scripts, and examples. The WGSL that a TypeScript file contains follows [Shaders](#shaders). The naming and semantics of the public API are defined in [api-conventions.md](api-conventions.md).

In the examples, `// ...` marks omitted code and is not part of the style. Placeholder names such as `ClassA` or `variableA` stand for any identifier of the corresponding kind.

Two terms are used throughout the document:

- A **value type** is a class whose entire state is held in public component fields or in a single component array, such as a vector or a matrix.
- A **hot path** is any constructor, accessor, or method of a value type, together with any code that runs at least once per frame.

## Formatting

- Code is indented with 4 spaces, and JSON and YAML with 2.
- A line is at most 120 characters long. URLs and string literals that cannot be split are exempt.
- Files are encoded in UTF-8 with LF line endings, end with a newline, and carry no trailing whitespace.
- Only ASCII characters are used ([CONTRIBUTING.md](../CONTRIBUTING.md#documentation)).

These settings are declared in `.editorconfig`.

## Syntax

- Strings use single quotes. Template literals are reserved for interpolation and multi-line strings.
- Every statement ends with a semicolon.
- A comma-separated list that spans several lines ends with a trailing comma, and a single-line list takes none. The rule covers arrays, objects, parameters, arguments, type parameters, tuples, imports, and exports.
- Every control-flow body is enclosed in braces. The opening brace stays on the line of the statement, the body begins on the next line, and `else`, `catch`, and `finally` begin on the line after the closing brace.
- In the product of a scalar and a component, the scalar comes first: `scalarA * this.x`. A product of two components keeps the operand order of the formula it implements: `this.x * variableA.x`.
- The parameters of an arrow function are always parenthesized: `(value) => value * 2`.
- Braces have inner spaces and brackets have none: `{ a, b }`, `[1, 2]`.

### Negation

- The `!` operator appears only in a guard clause, that is, an `if` statement whose entire condition is `!` applied to a boolean and whose body is a single `return`, `continue`, `break`, or `throw`.
- Every other negated boolean is written with `=== false`.
- A value that is not a boolean is compared explicitly: `=== null`, `!== 0`.
- The `!==` operator is unrestricted.
- When an `if` statement has an `else` branch, the positive condition comes first. A condition is negative when it uses `=== false` or `!==`.

### Ternary operator

A ternary expression is allowed only when all of the following hold. Every other conditional is written with `if`.

- It is not nested.
- Neither its condition nor its branches have side effects.
- Each branch is a literal (a signed number included) or an identifier: `const sign = value < 0 ? -1 : 1;`.

## Layout

The rules below place the blank lines. When two rules disagree, the one listed later takes precedence.

1. One blank line separates logical blocks, and two consecutive blank lines never appear.
2. A blank line follows a group of declarations, precedes `return`, and surrounds every control-flow statement (`if`, `for`, `while`, `do`, `switch`, `try`).
3. Related variables form a group, and the variables of a group share a prefix that names their entity, such as `canvasWidth` and `canvasHeight`. A blank line separates one group from the next. The fields of a class are grouped in the same way, by the responsibility they serve, and fields that share a prefix belong to the same group.
4. A declaration that spans more than one line is set apart from its neighbors by blank lines, even inside a group. A comment directly above a declaration belongs to it.
5. A blank line never directly follows an opening brace or directly precedes a closing brace.

Within a class, one blank line separates the static initialization block, the constructor, each accessor, and each method from one another.

```ts
function computeAspectRatio(canvas: HTMLCanvasElement) {
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    if (canvasHeight === 0) {
        return 1;
    }

    return canvasWidth / canvasHeight;
}
```

## Files

- File and directory names use kebab-case: `class-a.ts`. Root documents whose names are conventionally uppercase, such as the README or the license, are exempt.
- A numbered name starts with its number followed by a hyphen: `0001-record-decisions.md`, `01-example-a/`.
- Digits attach to the word they follow: a class `Base64Codec` lives in `base64-codec.ts`.
- An acronym counts as a single word: a class `HTTPClient` lives in `http-client.ts`.
- A test file is named after its subject: `<subject>.test.ts`.

## File structure

A file has one subject, which is one of the following:

- one class;
- one enum object ([Enum objects](#enum-objects));
- one lookup table ([Lookup tables](#lookup-tables)) or one side table ([Side tables](#side-tables)), together with its functions;
- one group of related functions or constants;
- the shared types of a module, in `types.ts` ([Placement](#placement));
- the re-exports of a module, in `index.ts` ([Exports](#exports)).

The parts of a file appear in this order:

1. Imports.
2. Local types.
3. Module constants.
4. Side tables.
5. Classes and functions.
6. Scratch variables ([Scratch variables](#scratch-variables)).
7. The export statement.

A function that serves only the class of its file follows that class. In an enum object file, the type alias follows the object.

```ts
import type { ClassB } from './class-b.ts';

interface EntryA {
    propertyA: number;
    propertyB: number;
}

class Point2 {
    // ...
}

const _point2A = new Point2();

export { Point2 };
```

### Imports

The statements follow these rules:

- A file has at most one import statement for each source.
- A name that is used only in type positions carries the inline `type` modifier.
- When every name of a statement is used only in type positions, the statement is written as `import type { ... }` ([0030](decisions/0030-code-style-reasons.md)).
- Runtime imports between the files of one module never form a cycle ([0030](decisions/0030-code-style-reasons.md)).

The names inside the braces follow these rules:

- The names used as values come first, and the names that carry the `type` modifier follow them.
- Each of the two parts keeps the export order of the source, or alphabetical order when the source is external.
- One or two names stay on one line, and three or more names take one line each.

The statements form three parts, separated by one blank line and arranged in this order:

1. External modules (`node:` built-ins and packages), ordered alphabetically by source.
2. The other modules of the library, in the order of the module table of the [architecture](architecture.md#modules-and-layers). One blank line separates each of these statements from the next.
3. The files of the same module, in two blocks separated by one blank line: the statements that import values, followed by the `import type` statements. Within each block, the statements follow the order in which the `index.ts` of the module arranges its re-exports ([Exports](#exports)), that is, by the kind of the source file and then by the rule of its group. The order holds whether or not `index.ts` re-exports the file. Within a block, only a statement that spans several lines is set apart by blank lines ([Layout](#layout)).

Test files arrange their imports as described in [Tests](#tests).

```ts
import { ClassA, type InterfaceA } from '../module-a/index.ts';

import {
    ClassB,
    functionA,
    CONSTANT_A,
    type ClassC,
    type InterfaceB,
} from '../module-b/index.ts';

import type { ClassD } from '../module-c/index.ts';

import { ClassE } from './class-e.ts';
import { getEnumASize } from './enum-a-sizes.ts';

import type { InterfaceC } from './types.ts';
```

### Exports

Every file except `index.ts` follows these rules:

- The file exports its names through a single `export { ... };` statement at the end, which lists them in the order of their declarations.
- Inline `export` keywords are not used.
- A class file exports only its class.
- The names of an export statement are laid out as the names of an import are: one or two stay on one line, and three or more take one line each.
- Test files, example files, and script entry points have no export statement. Code that several scripts share lives in a separate file next to them, which is not an entry point.
- A default export appears only in a configuration file that a tool loads through its default export. Such a file declares the configuration as a constant and exports it in the final statement as `export { configA as default };`.

The `index.ts` of a module follows these rules:

- The file contains only named re-exports, such as `export { ClassA } from './class-a.ts';` and `export type { InterfaceA } from './types.ts';`. `export *` is not used.
- The file has one re-export for each source file. The names of a re-export keep the export order of that file and are laid out as the names of an import are.
- A re-export that exists only for another module of the library is preceded by the comment `/** @internal */`. The tag stands on the re-export and never on the declaration ([0030](decisions/0030-code-style-reasons.md)).
- The re-exports form groups, separated by one blank line, according to the kind of the source file. The groups appear in this order: classes, functions, enum objects and constants, and types. A lookup table file and a side table file count as files of functions.
- Within the group of classes, a class precedes the classes that it owns or creates, and a base class precedes its subclasses. Value types are ordered by family: vectors, then quaternions, then matrices, and the types of one family by ascending dimension. Classes that none of these rules relates are ordered alphabetically by the path of their source.
- Within every other group, the re-exports are ordered alphabetically by the path of their source.
- Paths are compared without the file extension: `./enum-a.ts` precedes `./enum-a-sizes.ts`.

```ts
export { ClassA } from './class-a.ts';
export { ClassB } from './class-b.ts';

export { functionA, functionB } from './functions-a.ts';

export { EnumA } from './enum-a.ts';

export type { InterfaceA } from './types.ts';
```

The `index.ts` of the library has one re-export for each module. The modules appear in the order of the module table of the [architecture](architecture.md#modules-and-layers), one blank line separates each re-export from the next, and the names used as values precede the names that carry the `type` modifier.

## Module scope

A module-level variable takes one of the following forms:

- a constant, that is, a deeply immutable value, primitive or frozen, named in CONSTANT_CASE ([Case](#case));
- an enum object ([Enum objects](#enum-objects));
- a lookup table ([Lookup tables](#lookup-tables));
- a side table ([Side tables](#side-tables));
- a scratch variable ([Scratch variables](#scratch-variables)).

Any other module-level state, such as a cache, a counter, or a registry, is forbidden ([0030](decisions/0030-code-style-reasons.md)). State that belongs to an instance of a system is a field of that instance.

Scripts and examples are exempt from this section.

### Enum objects

- An enum object lives in a file of its own, which exports only that object.
- The object and its type share one name, and the type alias follows the object.
- The object is frozen with `Object.freeze` and takes no `as const` ([0025](decisions/0025-frozen-enum-objects.md)).
- Each value equals its key. In an enum that mirrors an enumeration of an external API, each value is the string that the API expects.

```ts
const EnumA = Object.freeze({
    KEY_A: 'KEY_A',
    KEY_B: 'KEY_B',
});

type EnumA = (typeof EnumA)[keyof typeof EnumA];

export { EnumA };
```

### Lookup tables

- A lookup table is a frozen object that holds one entry for each value of an enum object.
- A table records one property, and several properties of one enum form several tables.
- The table is named after the relation it records, in the plural and without a suffix that names the container, such as `_MAP` or `_TABLE`.
- The table lives in a file of its own that is named after it: `ENUM_A_SIZES` lives in `enum-a-sizes.ts`.
- The table is never exported ([0030](decisions/0030-code-style-reasons.md)). Its file exports one function, whose name consists of `get` and one entry of the table and whose parameter has the type of the enum.
- The function is re-exported from `index.ts` only when another module requires it, and the re-export is marked `@internal`.

```ts
import { EnumA } from './enum-a.ts';

const ENUM_A_SIZES = Object.freeze({
    [EnumA.KEY_A]: 1,
    [EnumA.KEY_B]: 2,
});

function getEnumASize(value: EnumA) {
    return ENUM_A_SIZES[value];
}

export { getEnumASize };
```

### Side tables

- A side table is a `WeakMap` or `WeakSet` that is keyed by objects and holds private state shared by several classes of one module.
- The table is named after the relation it records.
- The table lives in a file of its own when several files use it.
- The table is never exported ([0030](decisions/0030-code-style-reasons.md)). Its file exports one function for each operation that the module requires.
- Each function is named after its operation and one entry of the table, and the functions that read the table precede those that change it.
- A function is re-exported from `index.ts` only when another module requires it, and the re-export is marked `@internal`.

```ts
import type { ClassA } from './class-a.ts';
import type { ClassB } from './class-b.ts';

const instanceOwners = new WeakMap<ClassA, ClassB>();

function getInstanceOwner(instance: ClassA) {
    return instanceOwners.get(instance) ?? null;
}

function setInstanceOwner(instance: ClassA, owner: ClassB) {
    instanceOwners.set(instance, owner);
}

export { getInstanceOwner, setInstanceOwner };
```

### Scratch variables

- A scratch variable is a module-level instance that a hot path reuses in place of a temporary allocation.
- Its name consists of an underscore, the class name in camelCase with any digits kept, and an uppercase letter that counts from `A`: `_point2A`, `_point2B`.
- A scratch variable is never returned or stored.
- The value of a scratch variable is never relied upon across a call to another function.

## Types

### Placement

- A type used only within its own file is local. It is declared after the imports and is not exported.
- A type shared by several files of one module is declared in the `types.ts` file of that module, is imported directly by those files, and is not re-exported from `index.ts`.
- A type that another module uses, or that appears in a public signature as a parameter, an option, or a return value, is declared in `types.ts` and re-exported from `index.ts`. When the type is not part of the public API, the re-export is marked `@internal`.

There is no global directory of types.

### Annotations

Return types are inferred. A return type is annotated in three cases only:

- on an abstract member;
- where the compiler requires an annotation because of recursion;
- to narrow a frozen or newly created value to a read-only type such as `Readonly<T>`, `ReadonlyMap<K, V>`, `ReadonlySet<T>`, or `readonly T[]`.

The remaining rules are these:

- An internal collection is never returned, with or without a read-only annotation ([0018](decisions/0018-encapsulation-and-inheritance.md)).
- An `interface` describes object shapes and class contracts. A `type` alias is used only for what an interface cannot express, such as unions, tuples, function types, mapped types, and conditional types.
- A value of unknown type is typed as `unknown` and narrowed before use.
- `any` is permitted only where it cannot be avoided, and a comment states the reason ([Comments](#comments)).
- Non-null assertions (`value!`) and definite assignment assertions (`field!: T`) are forbidden.
- A type assertion (`value as T`) is permitted only where the compiler cannot know the type, as in `querySelector('canvas') as HTMLCanvasElement`, and never to silence a type error. `as const` does not count as a type assertion.

### Absence of a value

- `null` means that a value is absent. This holds for fields, properties, return values of the form "an entity or nothing", and parameters that accept "none".
- A parameter that accepts "none" is typed `T | null` and is required.
- `?` appears only on the properties of options objects.
- Absence is tested with `=== null`, and a value is never compared with `undefined`.
- An omitted option is converted with `??` to its default value or to `null` before it is tested: `const valueA = options.optionA ?? null;`.
- When a built-in API returns `undefined`, the value is converted before it is returned: `return this.#entries.get(key) ?? null;`.
- A function that returns nothing exits early with a bare `return;`.

## Class members

Members appear in the following order:

1. Static fields.
2. The static initialization block.
3. Static accessors.
4. Static methods.
5. `#private` fields.
6. Public fields, which only value types have.
7. The constructor.
8. Public accessors.
9. `#private` accessors.
10. Public methods.
11. `#private` methods.

### Fields and initialization

- Every field of a class that is not a value type is `#private` and is exposed through getters ([0018](decisions/0018-encapsulation-and-inheritance.md)).
- A value type that stores its components in an array keeps the array in a `#private` field behind a getter ([0030](decisions/0030-code-style-reasons.md)).
- Fields are declared without initializers. Instance fields are assigned in the constructor, and static fields in the static initialization block (`static {}`).
- A constructor never calls a public or `protected` method of `this` ([0030](decisions/0030-code-style-reasons.md)).
- A static constant is deeply immutable. It is held in a `static #` field that contains an `Object.freeze`d instance, is assigned in `static {}`, and is exposed through a getter named in CONSTANT_CASE.
- A type whose storage cannot be frozen, such as a typed array, has no static constants.
- A member is `protected` only by exception, and its TSDoc states the reason in a `@remarks` tag ([0018](decisions/0018-encapsulation-and-inheritance.md)).

```ts
class Point2 {
    static #origin: Point2;

    static {
        Point2.#origin = Object.freeze(new Point2(0, 0));
    }

    static get ORIGIN(): Readonly<Point2> {
        return Point2.#origin;
    }

    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
```

### Method order

- Public methods are grouped by responsibility, and both the groups and the methods within each group progress from fundamental to derived. The groups of a value type appear in this order: assignment, arithmetic, geometry, transformation, interpolation, comparison, and conversion.
- Private methods follow stepdown order: each one sits below its first caller.
- When the public methods of a class form more than one group, each group opens with a divider that is padded with hyphens to a width of 79 characters, indentation included. The private methods of such a class open with a `Private` divider.

```ts
    // Arithmetic -------------------------------------------------------------
```

```ts
    // Private ----------------------------------------------------------------
```

## Naming

### Case

| Kind                                                  | Case                                   | Example                  |
| ----------------------------------------------------- | -------------------------------------- | ------------------------ |
| Classes, interfaces, type aliases, enum objects       | PascalCase                             | `ClassA`, `InterfaceA`   |
| Methods, functions, variables, parameters, properties | camelCase                              | `methodA()`, `variableA` |
| `#private` fields and methods                         | camelCase                              | `#fieldA`, `#methodA()`  |
| Module-level constants and lookup tables              | CONSTANT_CASE                          | `CONSTANT_A`             |
| Static constants                                      | CONSTANT_CASE                          | `ClassA.CONSTANT_A`      |
| Enum keys and values                                  | CONSTANT_CASE                          | `EnumA.KEY_A`            |
| Type parameters                                       | `T`, or `TName` when there are several | `Map<TKey, TValue>`      |

Every other binding, local `const` included, uses camelCase.

### Acronyms

- An acronym is written in uppercase inside an identifier: `HTTPClient`, `toJSON`, `loadURL`.
- An acronym that opens a camelCase identifier is written in lowercase: `httpClient`, `url`.
- `id` is treated as a word: `id`, `instanceId`.

### Abbreviations

Every name is spelled with full words: `position`, `direction`, `index`. The only short forms permitted are the following:

- the loop counters `i`, `j`, and `k`;
- `id`;
- `min` and `max`, either alone or within a compound identifier such as `minDepth`;
- the acronyms and domain terms listed in [api-conventions.md](api-conventions.md#vocabulary).

Code that implements a mathematical formula, outside of tests, may name its local variables after the notation of that formula: `ax`, `k0`, `c00`. This notation takes precedence over the shared-prefix grouping of [Layout](#layout), and a quantity keeps the same name throughout its module.

### Booleans

- A boolean property or accessor is named with an adjective or a participle (`enabled`, `visible`), or with a verb phrase when a single word is insufficient (`allowOverflow`). The `is` prefix is never used.
- A boolean variable is named with a single adjective when that adjective identifies the state unambiguously. Otherwise its name begins with the subject, continues with `Is`, `Has`, or `Can`, and ends with the condition: `itemIsDisabled`, `nodeHasChildren`.
- A method that answers a question is named with a verb: `equals()`, `contains()`, `intersects()`.

### Prepositions

A method name takes a preposition only when the role of its argument is ambiguous without it: `projectOnto(vectorA)`. Symmetric operations and binary operations that store their result in the receiver take none: `distance(pointA)`, `subtract(fractionA)`.

### Prohibited names

- The `_` prefix is reserved for scratch variables.
- Interfaces carry no `I` prefix.
- Abstract classes carry no `Abstract` or `Base` prefix.
- Vague nouns such as `Manager`, `Helper`, `Util`, `Data`, or `Info` are not used. A name states the responsibility: `ResourceCache`, `ResourceLoader`.
- A name does not begin with a prefix reserved by a platform API that the project depends on.

## Comments

Implementation code is not commented. Code that is hard to follow is rewritten through better naming and extraction.

Only the following comments are permitted:

- TSDoc, where [TSDoc](#tsdoc) requires it.
- The comment `/** @internal */` on a re-export ([Exports](#exports)).
- A link to an external bug that the code works around.
- The reason for a compiler directive or an `any`, as in `// @ts-expect-error TS2542: ArrayLike<number> is read-only.`
- `// TODO: <description>`.
- The reason why code is deliberately duplicated from another member, as in `// Inlined from methodA: the result reuses variableA.`
- Group dividers ([Method order](#method-order)).

### TSDoc

TSDoc is required on every export of a module's `index.ts` and on every public or `protected` member of an exported class. The public fields of value types are exempt.

A comment opens with one sentence that states what the declaration does. The sentence follows these rules:

- It is written in plain English and uses the standard term of the field, such as "dot product" or "linear interpolation".
- It contains no formulas, symbols, or notation, no citations ([references.md](references.md)), and no implementation details.
- It describes what the caller gains and never how the result is computed.
- Outside a mathematical module, it assumes no knowledge of the underlying mathematics or of the internals of the library.
- Its register follows [CONTRIBUTING.md](../CONTRIBUTING.md#documentation): formal, declarative, in the third person and the present tense.

The tags follow these rules:

- The permitted tags are `@param name - Description.`, `@typeParam`, `@returns`, `@throws`, `@remarks`, `@internal`, and `@deprecated`. Tags carry no types.
- `@remarks` states a fact that the caller must know and the sentence cannot state, such as the result for degenerate input, the mutation of an argument, or the reason for a `protected` member. Each fact takes one short sentence. A fact that the sentence can state, such as the order of elements, belongs in the sentence.
- Units are always stated in `@remarks`: "The angle is in radians."
- `@returns` is omitted when the method returns `this` and when the sentence names the returned value, as "Computes..." and "Creates..." do. It is required by "Writes...", "Copies...", and a computation into a target.
- The documentation of a class does not state conventions of its methods, such as which of them return the instance.
- Blank lines separate the sentence, the group of `@typeParam` and `@param` tags, `@returns`, the group of `@remarks` tags, and each remaining tag.

#### Templates

All declarations of one kind share a template, which fixes the verb and the structure of the sentence.

- The verb of a template is never replaced by a synonym.
- The receiver is referred to as "this \<type\>" and an argument as "the given \<noun\>".
- A term keeps its standard preposition: "the distance between", "the interpolation between".
- A parameter is described by the noun of its role or by an infinitive construction, and never by a passive participle: "The task to append".
- A new kind of declaration adds a row to the table before its first comment is written.

| Declaration                     | Template                                                                             | Example                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Class, interface, type alias    | `A <noun phrase>.`                                                                   | A rational number stored as a numerator and a denominator.                  |
| Constructor                     | `Creates <noun phrase> with the given <noun>.`                                       | Creates a fraction with the given numerator and denominator.                |
| Constructor without parameters  | `Creates <noun phrase>.`                                                             | Creates an empty queue.                                                     |
| Value computed without mutation | `Computes the <term> of <operands>.`                                                 | Computes the greatest common divisor of the given integers.                 |
| New instance                    | `Creates a copy of this <type>.`                                                     | Creates a copy of this fraction.                                            |
| Mutation of the receiver        | `Sets this <type> to <result>.`                                                      | Sets this fraction to the sum of itself and the given fraction.             |
| Predicate                       | `Determines whether <condition>.`                                                    | Determines whether this fraction equals the given fraction.                 |
| Output into a target            | `Writes <noun phrase> into the given <noun>.`                                        | Writes the numerator and denominator of this fraction into the given array. |
| Copy into a target              | `Copies <noun phrase> into the given <noun>.`                                        | Copies the bounds of this panel into the given rectangle.                   |
| Computation into a target       | `Computes <noun phrase> into the given <noun>.`                                      | Computes the reduced form of this fraction into the given fraction.         |
| Change of a collection          | `Appends <noun phrase> to <collection>.`, `Removes <noun phrase> from <collection>.` | Appends the given task to the end of this queue.                            |
| Iterator                        | `Creates an iterator over <noun phrase>.`                                            | Creates an iterator over the tasks of this queue, in order.                 |
| Lookup                          | `Looks up <noun phrase>.`                                                            | Looks up the task of this queue with the given name.                        |
| Submission                      | `Submits <noun phrase> to <target>.`                                                 | Submits the given tasks to this queue.                                      |
| Release                         | `Destroys <noun phrase>.`                                                            | Destroys this queue and releases its resources.                             |
| Update of derived state         | `Updates <target> from <source>.`                                                    | Updates the layout of this panel from its current settings.                 |
| Assertion                       | `Asserts that <condition>.`                                                          | Asserts that the given numbers are equal within the tolerance.              |
| Field, constant                 | `The <noun phrase>.`                                                                 | The fraction equal to zero.                                                 |
| Parameter                       | `The <role>.` or `The <noun> to <verb>.`                                             | The addend. The task to append.                                             |

```ts
/**
 * A rational number stored as a numerator and a denominator.
 */
class Fraction {
    /**
     * Sets this fraction to the sum of itself and the given fraction.
     *
     * @param fraction - The addend.
     */
    add(fraction: Fraction) {
        // ...
    }

    /**
     * Sets this fraction to its reciprocal.
     *
     * @remarks A zero fraction is left unchanged.
     */
    reciprocate() {
        // ...
    }
}
```

## Errors

| Situation                            | Response           |
| ------------------------------------ | ------------------ |
| Expected absence of a value          | Return `null`      |
| Argument of the wrong type           | Throw `TypeError`  |
| Argument out of range                | Throw `RangeError` |
| Invalid state or environment failure | Throw `Error`      |

Errors are thrown and caught under these rules:

- Only built-in error classes are used, and only `Error` instances are thrown.
- When an error is wrapped, the original is preserved as its `cause`: `new Error(message, { cause: error })`.
- An `async` function reports failure by throwing and never by constructing a rejected promise.
- An empty `catch` is forbidden. A `catch` block either adds context and rethrows, or recovers deliberately.

Arguments are validated under these rules:

- Outside hot paths, constructors, methods that assign a property, and functions that create resources validate their arguments.
- Hot paths never validate.
- An argument that the underlying platform API validates is not validated again.
- There is no separate validation mode for development builds.
- A validation that several members of a class repeat is extracted into a function of the same file, and a validation that occurs once remains in its member. The name of the function begins with `assert` and states what is checked. The function takes the value to check, followed by the name of the calling member for the error message, and it returns nothing.

An error message follows the format `<source>: expected <expectation>, received <actual>.` The source is `<Class>.<member>` for a member, `<Class>.constructor` for a constructor, and the function name for a free function.

```ts
throw new RangeError(`ClassA.propertyA: expected a value in (0, 1), received ${value}.`);
```

## Accessors and methods

- A getter is used when the value is computed in constant time, has no side effects, allocates nothing, and requires no arguments. A computation over a fixed number of components counts as constant time. In every other case a method is used: `fraction.value` is a getter, and `fraction.reduce()` is a method.
- A class has no setters ([0030](decisions/0030-code-style-reasons.md)). A property is assigned through a method whose name consists of `set` and the name of the property, and the method returns the instance: `instanceA.setPropertyA(value)`.
- The public component fields of a value type are assigned directly. A derived value of a value type is assigned through a `set` method.

## Parameters

- Boolean parameters are not used. Separate methods or an options property express the choice.
- Value types take positional parameters, with default values for the optional ones.
- Any other function takes an options object when it has more than three parameters or more than one optional parameter: `new ClassA({ optionA, optionB })`.
- A single optional parameter is positional, stands last, and has a default value: `methodA(array, arrayOffset = 0)`.
- A method has exactly one signature. A parameter never selects the behavior of a method by its type, and each accepted type takes a separate method.
- An output parameter is named after the kind of object that it is, as an input parameter is, and it is documented. The name of the method states that the parameter receives a result, and the name of the parameter does not. When two parameters of one method are of the same kind, each is named after its role.

## Tests

Tests run on `node:test` and assert with `node:assert/strict`, supplemented by the tolerance-based assertion helpers of the shared test module.

The imports form four groups, separated by one blank line and arranged in this order. Within each group, the imports follow [Imports](#imports).

1. The `node:` modules.
2. The other modules of the library that the test uses.
3. The subject under test, together with any other files of its module.
4. The shared test helpers.

The structure follows these rules:

- A test file is structured as `describe('<Class>')`, a nested `describe('<member>')`, and a nested `it('<behavior>')`.
- Method names carry parentheses (`'methodA()'`), and accessor names carry none (`'propertyA'`).
- A file of functions has one top-level `describe('<function>()')` for each function.
- The name of an `it` block describes the behavior in the present tense and without "should": `'leaves a zero fraction unchanged'`.
- Each `it` block covers one behavior. It may contain several assertions when all of them verify that behavior.
- Blank lines separate the arrange, act, and assert phases.

The content follows these rules:

- Expected values do not depend on the code under test. They are derived by hand or taken from a source cited in the plan or ADR concerned ([references.md](references.md)).
- Every degenerate case documented in TSDoc has a test.
- Every bug fix adds a regression test, which is written before the fix.
- Tests are deterministic: they use no unseeded randomness, do not depend on time, and share no mutable state.
- Results of floating-point arithmetic are compared with the tolerance-based helpers and never with the equality method of the code under test.
- Exact assertions such as `assert.equal` and `assert.deepEqual` are reserved for expected values that involve no arithmetic.

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ClassA } from './class-a.ts';

import { assertArrayClose } from '../testing/index.ts';

describe('ClassA', () => {
    describe('methodA()', () => {
        it('scales the components to unit length', () => {
            const instanceA = new ClassA(3, 0, 4);

            instanceA.methodA();

            assertArrayClose(instanceA.writeToArray([]), [0.6, 0, 0.8]);
        });

        it('leaves zero components unchanged', () => {
            const instanceA = new ClassA(0, 0, 0);

            instanceA.methodA();

            assert.deepEqual(instanceA.writeToArray([]), [0, 0, 0]);
        });
    });
});
```

## Shaders

Shader code is WGSL that is kept in template literals.

### Files

- Shader code is a module constant, and it is indented by one level inside its template literal.
- A part that several shaders share is a constant whose name ends in `_SHADER_CODE`. It lives in a file of its own that is named after it: `PART_A_SHADER_CODE` lives in `part-a-shader-code.ts`.
- A complete shader is a frozen object whose name ends in `_SHADER`. It lives in a file of its own that is named after it, and its code is a constant of the same file whose name is the name of the shader followed by `_CODE`.
- A shader includes a part through an interpolation at the beginning of its code.
- A number that TypeScript defines, such as a shader location, is interpolated and is never repeated as a literal.

### Naming

- Identifiers follow [Naming](#naming): a structure is written in PascalCase, and every other identifier in camelCase and in full words.
- The names that WGSL predeclares remain as they are. A predeclared alias is used in place of its generic form: `vec3f` stands for `vec3<f32>`.
- The entry points are named `vertexStage` and `fragmentStage`.
- The structures of the inputs and outputs of an entry point are named after the stage: `VertexStageInput`, `VertexStageOutput`.
- The parameter of an entry point is named `input`, and the variable that it returns is named `output`.
- A position or a direction is named after its coordinate space: `worldNormal`, `viewPosition`. A position or a direction in the local space of the geometry carries no prefix, and neither does the built-in position ([0030](decisions/0030-code-style-reasons.md)).

### Formatting

- A colon that precedes a type is surrounded by spaces: `memberA : f32`.
- Consecutive lines of one kind that no blank line separates are aligned in columns. Among the members of a structure, the attributes, the names, and the colons each begin in one column. Among declarations and among assignments, the names, the colons, and the equals signs do.
- The alignment is judged in the source as it is written, before any interpolation.
- A value that is never reassigned is declared with `let`, and `var` is reserved for a value that is reassigned.
- Blank lines follow [Layout](#layout).

```wgsl
struct VertexStageOutput {
    @builtin(position) position    : vec4f,
    @location(0)       worldNormal : vec3f,
}

@vertex
fn vertexStage(input : VertexStageInput) -> VertexStageOutput {
    var output : VertexStageOutput;

    let itemA            = itemsA[input.instanceIndex];
    let itemAWorldMatrix = itemA.worldMatrix;

    output.position    = matrixA * itemAWorldMatrix * vec4f(input.position, 1.0);
    output.worldNormal = (itemAWorldMatrix * vec4f(input.normal, 0.0)).xyz;

    return output;
}
```
