# Code style

## Scope and definitions

These rules apply to all TypeScript in the repository, including tests, scripts, and examples. Conventions that concern the public API of this particular library, rather than the shape of the code, are kept in [api-conventions.md](api-conventions.md).

In the examples below, `// ...` marks omitted code and is not itself part of the style. Placeholder names such as `ClassA` or `variableA` stand for any identifier of the corresponding kind.

Two terms recur throughout the document:

- A **value type** is a class whose entire state is held in public component fields or in a single component array, as is the case for a vector or a matrix.
- A **hot path** is any method of a value type, together with any code that runs at least once per frame.

## Formatting

Code is indented with 4 spaces, while JSON and YAML use 2. A line is at most 120 characters long; URLs and string literals that cannot be split are exempt. Files are encoded in UTF-8 with LF line endings, end with a newline, and carry no trailing whitespace. Only ASCII characters are used ([CONTRIBUTING.md](../CONTRIBUTING.md#documentation)).

These settings are declared in `.editorconfig`. The line length, however, is advisory, since no tool enforces it.

## Syntax

- Strings use single quotes. Template literals are reserved for interpolation and multi-line strings.
- Every statement ends with a semicolon.
- A comma-separated list that spans several lines ends with a trailing comma, whereas a single-line list never takes one. The rule covers arrays, objects, parameters, arguments, type parameters, tuples, imports, and exports alike.
- Every control-flow body is enclosed in braces. The opening brace stays on the line of the statement, the body begins on the next line, and `else`, `catch`, and `finally` begin on the line after the closing brace.
- In the product of a scalar and a component, the scalar comes first, as in `scalarA * this.x`. A product of two components, by contrast, keeps the operand order of the formula it implements: `this.x * variableA.x`.
- The parameters of an arrow function are always parenthesized, even when there is only one: `(value) => value * 2`.
- Braces have inner spaces and brackets do not: `{ a, b }`, `[1, 2]`.

### Negation

The `!` operator may appear only in a guard clause, where it forms the entire condition, is applied to a boolean, and guards a body that consists of a single `return`, `continue`, `break`, or `throw`. Any other negated boolean is written as `=== false`, and a value that is not a boolean is always compared explicitly, for instance with `=== null` or `!== 0`. The `!==` operator itself is unrestricted.

When an `if` statement has an `else` branch, the positive condition comes first. A condition counts as negative when it uses `=== false` or `!==`.

### Ternary operator

A ternary expression is allowed only when it is not nested, when neither its condition nor its branches have side effects, and when each branch is a literal (a signed number included) or an identifier, as in `const sign = value < 0 ? -1 : 1;`. Every other conditional is written with `if`.

## Layout

Blank lines make the structure of a function visible, and the rules below decide where they go. When two rules disagree, the one listed later takes precedence.

1. One blank line separates logical blocks, and two consecutive blank lines never appear.
2. A blank line follows a group of declarations, precedes `return`, and surrounds every control-flow statement (`if`, `for`, `while`, `do`, `switch`, `try`).
3. Related variables form a group, and the variables of a group share a prefix that names their entity, such as `canvasWidth` and `canvasHeight`. A blank line separates one group from the next. The same applies to the fields of a class: they are grouped by the responsibility they serve, and fields that share a prefix always belong to the same group.
4. A declaration that spans more than one line is set apart from its neighbors by blank lines, even inside a group. A comment directly above a declaration belongs to it.
5. A blank line never directly follows an opening brace or directly precedes a closing brace.

Within a class, the constructor, accessors, and methods are separated from one another by one blank line, while fields follow the grouping of rule 3.

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

- File and directory names use kebab-case, as in `class-a.ts`. Root documents whose names are conventionally uppercase, such as the README or the license, are exempt.
- A numbered name starts with its number followed by a hyphen: `0001-record-decisions.md`, `01-example-a/`.
- Digits attach to the word they follow, so a class `Base64Codec` lives in `base64-codec.ts`.
- An acronym counts as a single word, so a class `HTTPClient` lives in `http-client.ts`.
- A test file is named after its subject: `<subject>.test.ts`.

## File structure

A file contains one class, one enum object, or a group of related functions or constants. Its parts appear in a fixed order: imports, local types, module constants, side tables ([Module scope](#module-scope)), classes and functions, scratch variables, and finally the export statement. Scratch variables come after the classes because a class cannot be instantiated before its declaration has been evaluated. An enum object file is the one exception to this order, since its type alias is derived from the object and therefore follows it ([Enum objects](#enum-objects)).

### Imports

Imports form groups separated by one blank line. External modules (`node:` built-ins and packages) come first, followed by other modules of the library, then by files of the same module, and finally by type imports. External modules are ordered alphabetically. Within the remaining groups, a file is listed after the files it depends on, and files unrelated to each other are ordered alphabetically. The names inside braces follow the export order of their source, or alphabetical order when the source is external. The type group repeats the ordering of the groups above it, starting with external modules. Test files arrange their groups as described in [Tests](#tests).

An import used only in type positions is written as `import type`, and the inline `type` modifier is not used. A source that provides both runtime values and types therefore appears in both groups.

Runtime imports between the files of one module never form a cycle, because a cycle can expose a class to code that runs before its declaration has been evaluated.

### Exports

With the exception of `index.ts`, a file exports its names through a single `export { ... };` statement at the end, which lists them in the order of their declarations. Default exports and inline `export` keywords are not used. A class file exports exactly its class, whereas `types.ts` may export several types.

An `index.ts` file contains nothing but named re-exports, such as `export { ClassA } from './class-a.ts';` and `export type { InterfaceA } from './types.ts';`; `export *` is forbidden. The re-exports form groups separated by one blank line according to the kind of source file, in this order: functions and constants, enum objects, classes, and types. Within each group they follow the ordering rules for imports.

Test files, example files, and script entry points have no export statement at all. When several scripts share code, that code lives in a separate file next to them, which is not itself an entry point. A configuration file that a tool loads through its default export is the one exception to the rule against default exports: it declares the configuration as a constant and exports it in the final statement as `export { configA as default };`.

```ts
import type { ClassB } from './class-b.ts';

interface OptionsA {
    optionA: number;
    optionB: number;
}

class Point2 {
    // ...
}

const _point2A = new Point2();

export { Point2 };
```

## Module scope

In library code, a module-level binding takes one of three forms:

- a deeply immutable value, named in CONSTANT_CASE ([Case](#case));
- a scratch variable ([Scratch variables](#scratch-variables));
- a side table, that is, a `WeakMap` or `WeakSet` keyed by objects that holds private state shared by several classes of one module. A side table is named after the relation it records, is never exported from `index.ts`, and lives in a file of its own when several files use it.

Any other module-level state, whether a cache, a counter, or a registry, is forbidden. State that belongs to an instance of a system is a field of that instance instead. The reason is that module-level state is shared by every instance and every test, whereas each entry of a side table belongs to its key and is released together with it.

Scripts and examples are programs rather than libraries. Their module scope is their state, so this section does not apply to them.

```ts
import type { ClassA } from './class-a.ts';

const detachedInstances = new WeakSet<ClassA>();

export { detachedInstances };
```

## Types

### Placement

Where a type is declared depends on who uses it:

- A type used only within its own file is local. It is declared after the imports and is not exported.
- A type shared by several files of one module is placed in the `types.ts` file of that module, imported directly by those files, and not exported from `index.ts`.
- A type used by another module, or one that appears in a public signature (as a parameter, an option, or a return value), is likewise placed in `types.ts` but is also exported from `index.ts`. If it is not part of the public API, it is marked `@internal`.

There is no global directory of types.

### Annotations

Return types are inferred and are annotated in three cases only: on abstract members; where the compiler requires an annotation because of recursion; and to narrow a frozen or newly created value to a read-only type such as `Readonly<T>`, `ReadonlyMap<K, V>`, `ReadonlySet<T>`, or `readonly T[]`. A read-only annotation never substitutes for runtime protection, which is why internal collections are never returned ([0007](decisions/0007-runtime-encapsulation.md)).

An `interface` describes object shapes and class contracts. A `type` alias is used only for what an interface cannot express, namely unions, tuples, function types, mapped types, and conditional types.

A value of unknown type is typed as `unknown` and narrowed before use. `any` is permitted only where it cannot be avoided, and a comment then states why ([Comments](#comments)).

Non-null assertions (`value!`) and definite assignment assertions (`field!: T`) are forbidden. A type assertion (`value as T`) is permitted only where the compiler cannot know the type, as in `querySelector('canvas') as HTMLCanvasElement`, and never to silence a type error. `as const` is not a type assertion in this sense.

### Absence of a value

`null` means that a value is absent. This holds for fields, properties, return values of the form "an entity or nothing", and parameters that accept "none"; such a parameter is typed `T | null` and is required rather than optional. Consequently, `?` appears only on the properties of options objects, and absence is always tested with `=== null`.

When a built-in API returns `undefined`, the value is converted before it is returned: `return this.#entries.get(key) ?? null;`. A function that returns nothing exits early with a bare `return;`.

## Class members

Members appear in the following order:

1. Static fields.
2. Static methods.
3. `#private` fields.
4. Public fields, which only value types have.
5. The constructor.
6. Public accessors, with each getter immediately followed by its setter.
7. `#private` accessors.
8. Public methods.
9. `#private` methods.

Members are grouped by kind before anything else, so a `#private` accessor stays among the accessors rather than next to the method that uses it.

### Fields and initialization

Every field of a class that is not a value type is `#private` and is exposed through accessors ([0007](decisions/0007-runtime-encapsulation.md)). A value type that stores its components in an array keeps the array in a `#private` field behind a getter, so that the components remain public while the array itself cannot be replaced.

Fields are declared without initializers. Instance fields are assigned in the constructor, and static fields in a static initialization block (`static {}`). A constructor never calls a public or `protected` method of `this`, because the fields of a subclass have not yet been assigned while the base constructor runs.

A static constant is deeply immutable. It is held in a `static #` field that contains an `Object.freeze`d instance, is assigned in `static {}`, and is exposed through a getter named in CONSTANT_CASE. A type whose storage cannot be frozen, such as a typed array, has no static constants.

A `protected` member states the reason for this exception in a TSDoc `@remarks` tag ([0007](decisions/0007-runtime-encapsulation.md)).

### Method order

Public methods are grouped by responsibility, and both the groups and the members within each group progress from fundamental to derived. For a value type, for instance, assignment comes first, followed by arithmetic, geometry, transformation, interpolation, comparison, and conversion. Private methods follow stepdown order, so each one sits below its first caller.

When the public methods of a class form more than one group, each group opens with a divider that is padded with hyphens to a width of 79 characters, indentation included. The private methods of such a class then open with a `Private` divider:

```ts
    // Arithmetic -------------------------------------------------------------
```

```ts
    // Private ----------------------------------------------------------------
```

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

## Naming

### Case

| Kind                                                       | Case                                   | Example                  |
| ---------------------------------------------------------- | -------------------------------------- | ------------------------ |
| Classes, interfaces, type aliases, enum objects            | PascalCase                             | `ClassA`, `InterfaceA`   |
| Methods, functions, variables, parameters, properties      | camelCase                              | `methodA()`, `variableA` |
| `#private` fields and methods                              | camelCase                              | `#fieldA`, `#methodA()`  |
| Module-level deeply immutable values (primitive or frozen) | CONSTANT_CASE                          | `CONSTANT_A`             |
| Static constants                                           | CONSTANT_CASE                          | `ClassA.CONSTANT_A`      |
| Enum keys and values                                       | CONSTANT_CASE                          | `EnumA.KEY_A`            |
| Type parameters                                            | `T`, or `TName` when there are several | `Map<TKey, TValue>`      |

Every other binding, local `const` included, uses camelCase.

### Acronyms

An acronym is written in uppercase inside an identifier (`HTTPClient`, `toJSON`, `loadURL`) but in lowercase when it opens a camelCase identifier (`httpClient`, `url`). `id` is an abbreviation rather than an acronym, so it is written `id` and `instanceId`.

### Abbreviations

Names that are visible outside a function body, that is, exports, types, class members, parameters, and module-level bindings, are spelled with full words: `position`, `direction`, `index`. The only exceptions are the following short forms:

- the loop counters `i`, `j`, and `k`;
- the acronyms listed in [api-conventions.md](api-conventions.md#vocabulary), together with `id`;
- `min` and `max`, either alone or within a compound identifier such as `minDepth`;
- the domain terms listed in [api-conventions.md](api-conventions.md#vocabulary).

Local variables follow the same rule, with one exception: code that implements a mathematical formula, outside of tests, may name its locals after the notation of that formula (`ax`, `k0`, `c00`). This notation takes precedence over the shared-prefix grouping of [Layout](#layout), and a given quantity keeps the same name throughout its module.

### Booleans

A boolean property or accessor is named with an adjective or a participle (`enabled`, `visible`), or with a verb phrase when a single word is insufficient (`allowOverflow`); the `is` prefix is never used. A boolean variable is named with a single adjective when that adjective identifies the state unambiguously. Otherwise its name begins with the subject, continues with `Is`, `Has`, or `Can`, and ends with the condition, as in `itemIsDisabled` or `nodeHasChildren`. A method that answers a question is named with a verb: `equals()`, `contains()`, `intersects()`.

### Prepositions

A method name takes a preposition only when the role of its argument would otherwise be ambiguous. Symmetric operations, as well as binary operations that store their result in the receiver, therefore take none (`distance(pointA)`, `subtract(fractionA)`), while an asymmetric one does (`projectOnto(vectorA)`).

### Enum objects

```ts
const EnumA = {
    KEY_A: 'KEY_A',
    KEY_B: 'KEY_B',
} as const;

type EnumA = (typeof EnumA)[keyof typeof EnumA];

export { EnumA };
```

An enum object lives in a file of its own, which exports only that object, and the object and its type share one name. Each value equals its key, unless the enum mirrors an enumeration of an external API, in which case each value is the string that API expects, so that it can be passed through without mapping.

### Scratch variables

A scratch variable is a module-level instance that a hot path reuses instead of allocating a temporary. Its name consists of an underscore, the class name in camelCase with any digits kept, and an uppercase letter that counts from `A`: `_point2A`, `_point2B`. A scratch variable is never returned or stored, and its value is never relied upon across a call to another function.

### Prohibited names

- The `_` prefix is reserved for scratch variables, since privacy is expressed with `#`.
- Interfaces carry no `I` prefix, so the name is `InterfaceA` rather than `IInterfaceA`.
- Abstract classes carry no `Abstract` or `Base` prefix.
- Vague nouns such as `Manager`, `Helper`, `Util`, `Data`, or `Info` are not used. A name states the responsibility instead, as `ResourceCache` or `ResourceLoader` do.
- A name does not begin with a prefix reserved by a platform API that the project depends on.

## Comments

Comments document the public API; implementation code is not commented. Code that is hard to follow is rewritten, through better naming and extraction, rather than explained.

Only the following comments are permitted:

- TSDoc on the public API.
- A link to an external bug that the code works around.
- The reason for a compiler directive or an `any`, as in `// @ts-expect-error TS2542: ArrayLike<number> is read-only.`
- `// TODO: <description>`.
- The reason why code is deliberately duplicated from another member, as in `// Inlined from methodA: the result reuses variableA.`
- Group dividers ([Method order](#method-order)).

### TSDoc

TSDoc is required on every export of a module's `index.ts` and on every public member of an exported class, with the exception of the public fields of value types.

A comment consists of one sentence that states what the declaration does, in plain English and with the standard term of the field, such as "dot product" or "linear interpolation". It contains no formulas, symbols, or notation, no citations ([references.md](references.md)), and no implementation details. Unless the declaration belongs to a mathematical module, the reader is assumed to know neither the underlying mathematics nor the internals of the library, so the sentence describes what the caller gains rather than how it is computed.

The register follows [CONTRIBUTING.md](../CONTRIBUTING.md#documentation): formal, declarative, in the third person and the present tense.

`@remarks` is reserved for a fact that the caller must know but the sentence cannot state, such as the result for degenerate input, the mutation of an argument, or the reason for a `protected` member. Each fact takes one short sentence. A fact that the sentence can state, such as the order of elements, belongs in the sentence. Units are the one exception: they are always stated in `@remarks`, as in "The angle is in radians.", so that every unit can be found in the same place.

Tags carry no types, because TypeScript already provides them. The permitted tags are `@param name - Description.`, `@typeParam`, `@returns`, `@throws`, `@remarks`, `@internal`, and `@deprecated`. A method that returns `this` omits `@returns`, and the documentation of its class states this convention once, in a second sentence. Otherwise, `@returns` appears only when the sentence does not already name the returned value: "Computes..." and "Creates..." omit it, whereas "Writes..." and "Copies..." require it.

Blank lines separate the sentence, the group of `@typeParam` and `@param` tags, `@returns`, and each remaining tag.

#### Templates

All declarations of one kind share a template, which fixes the verb and the structure of the sentence. Synonyms are forbidden, so the verb is always "Computes" and never "Calculates", "Gets", "Finds", or "Returns". The receiver is referred to as "this \<type\>" and an argument as "the given \<noun\>", and a term keeps its standard preposition, as in "the distance between" or "the interpolation between". A parameter is described either by the noun of its role or by an infinitive construction, but never by a passive participle, so the description reads "The task to append" rather than "The appended task". A new kind of declaration first adds a row to the table, and only then is its first comment written.

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
| Copy into a target              | `Copies <noun phrase> into the given <noun>.`                                        | Copies the reduced form of this fraction into the given fraction.           |
| Change of a collection          | `Appends <noun phrase> to <collection>.`, `Removes <noun phrase> from <collection>.` | Appends the given task to the end of this queue.                            |
| Iterator                        | `Creates an iterator over <noun phrase>.`                                            | Creates an iterator over the tasks of this queue, in order.                 |
| Update of derived state         | `Updates <target> from <source>.`                                                    | Updates the layout of this panel from its current settings.                 |
| Assertion                       | `Asserts that <condition>.`                                                          | Asserts that the given numbers are equal within the tolerance.              |
| Field, constant                 | `The <noun phrase>.`                                                                 | The fraction equal to zero.                                                 |
| Parameter                       | `The <role>.` or `The <noun> to <verb>.`                                             | The addend. The task to append.                                             |

```ts
/**
 * A rational number stored as a numerator and a denominator.
 *
 * Methods modify this fraction and return it unless stated otherwise.
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

Only built-in error classes are used, and only `Error` instances are thrown. When an error is wrapped, the original is preserved as its `cause`: `new Error(message, { cause: error })`. An `async` function reports failure by throwing, never by constructing a rejected promise.

Constructors, setters, and functions that create resources validate their arguments, provided they lie outside hot paths; hot paths never validate. There is no separate validation mode for development builds.

Errors are never swallowed, and an empty `catch` is therefore forbidden. A `catch` block either adds context and rethrows, or recovers deliberately.

An error message follows the format `<Owner>.<member>: expected <expectation>, received <actual>.` The owner is the class name for a member, `<Class>.constructor` for a constructor, and the function name for a free function.

```ts
throw new RangeError(`ClassA.propertyA: expected a value in (0, 1), received ${value}.`);
```

## Accessors and methods

A getter is appropriate when the value is computed in constant time, has no side effects, allocates nothing, and requires no arguments; a computation over a fixed number of components counts as constant time. In every other case a method is used. Thus `fraction.value` is a getter, while `fraction.reduce()` is a method.

A value type has no setters for derived values. Such a value is assigned through a method instead, for example `setPropertyA(value)` in place of `instanceA.propertyA = value`.

## Parameters

- Boolean parameters are not used. Separate methods or an options property express the choice instead.
- Value types take positional parameters, with default values for the optional ones. Elsewhere, a function that has more than three parameters, or any optional parameter, takes an options object: `new ClassA({ optionA, optionB })`.
- Each method has exactly one signature, so a parameter never changes the behavior of a method according to its type. Rather than accepting `ClassA | number`, a class offers two separate methods.
- An output parameter is named `target` and is documented. When a method has several output parameters, each is named `target` followed by its noun, such as `targetPosition`.

## Tests

Tests run on `node:test` and assert with `node:assert/strict`, supplemented by the tolerance-based assertion helpers of the shared test module.

Imports form three groups separated by one blank line: `node:` modules first, then the subject under test together with any files of its module that the test uses, and finally the shared test helpers. Type imports, if there are any, form a fourth group at the end. Within each group, imports follow [Imports](#imports).

A test file is structured as `describe('<Class>')`, a nested `describe('<member>')`, and a nested `it('<behavior>')`. Method names carry parentheses (`'methodA()'`) and accessor names do not (`'propertyA'`). A file of functions instead has one top-level `describe('<function>()')` per function. The name of an `it` block describes the behavior in the present tense, without "should", as in `'leaves a zero fraction unchanged'`.

Each `it` block covers one behavior; it may contain several assertions, as long as they all verify that behavior. Blank lines, not comments, separate the arrange, act, and assert phases.

Expected values do not depend on the code under test. They are either derived by hand or taken from a source cited in the plan or ADR concerned ([references.md](references.md)). Every degenerate case documented in TSDoc has a test, and every bug fix adds a regression test that is written before the fix.

Tests are deterministic: they use no unseeded randomness, do not depend on time, and share no mutable state. Results of floating-point arithmetic are compared with the tolerance-based helpers rather than with the equality method of the code under test. Exact assertions such as `assert.equal` and `assert.deepEqual` are reserved for expected values that involve no arithmetic.

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
