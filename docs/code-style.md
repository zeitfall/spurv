# Code style

## Scope and definitions

- These rules apply to all TypeScript in the repository: `src/` (tests included), `scripts/`, and `examples/`. WGSL conventions will be defined together with the shader architecture.
- In the examples below, `// ...` marks omitted code and is not part of the style.
- **Math value type**: a class in `src/math` whose state is held in public component fields or a component array (`Vector3`, `Quaternion`, `Matrix4`).
- **Hot path**: any method of a math value type, and any code executed once or more per frame.

## Formatting

- Indentation: 4 spaces. JSON and YAML use 2.
- Line length: 100 characters at most. URLs and string literals that cannot be split are exempt. This limit is not enforced by tooling.
- UTF-8, LF line endings, a final newline, no trailing whitespace.
- `.editorconfig` encodes these settings.

## Syntax

- Strings use single quotes. Template literals are used only for interpolation or multi-line strings.
- Every statement ends with a semicolon.
- Every multi-line comma-separated list ends with a trailing comma. This covers arrays, objects, parameters, arguments, type parameters, tuples, imports, and exports. Single-line lists never take one.
- Every control-flow body has braces. The opening brace goes on the same line as the statement, the body starts on a new line, and `else` follows the closing brace: `} else {`.
- Arrow function parameters are always parenthesized: `(value) => value * 2`.
- Braces have inner spaces and brackets do not: `{ a, b }`, `[1, 2]`.
- **Negation**: the `!` operator may appear only as the entire condition of a guard clause, applied to a boolean, when the body is a single `return`, `continue`, `break`, or `throw`. Any other negated boolean is written `=== false`. Non-boolean values are compared explicitly (`=== null`, `!== 0`). `!==` is unrestricted. In an `if`/`else`, the positive condition comes first.
- **Ternary**: allowed only when it is not nested, its condition and branches have no side effects, and each branch is a literal (including a signed number) or an identifier: `const sign = value < 0 ? -1 : 1;`. Every other conditional uses `if`.

## Layout

- One blank line separates logical blocks. Two consecutive blank lines never appear.
- A blank line follows a group of declarations, surrounds every control-flow statement (`if`, `for`, `while`, `switch`, `try`), and precedes `return` unless the `return` is the only statement in its block.
- A blank line never directly follows an opening brace or directly precedes a closing brace.
- Class members are separated by one blank line. Consecutive field declarations form one group with no blank lines between them.
- Related variables form a group named with a shared prefix for their entity: `canvasWidth`, `canvasHeight`. A blank line separates groups.

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

- File and directory names use kebab-case: `perspective-camera.ts`. Exempt: root documents (`README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `LICENSE`).
- Numbered names start with the number and a hyphen: `0005-math-conventions.md`, `examples/01-triangle/`.
- Digits attach to the preceding word: `vector3.ts`, `matrix4.ts`.
- An acronym counts as a single word: `WebGPURenderer` → `webgpu-renderer.ts`.
- Test files are named `<subject>.test.ts`.

## File structure

- A file contains one class, one enum object, or a group of related functions or constants.
- Order: imports → local types → module constants → classes and functions → scratch variables → export statement.
- Scratch variables follow the class they instantiate, because a class cannot be instantiated before its declaration (TDZ).
- Exports are named and grouped in a single `export { … };` statement at the end of the file. No `export default` and no inline `export`.
- A class file exports exactly its class. An enum file exports exactly its enum object; the value and its type share the name. `types.ts` may export several types.
- `index.ts` contains only named re-exports: `export { Vector3 } from './vector3.ts';` and `export type { Renderable } from './types.ts';`. `export *` is forbidden.
- Test, script, and example files have no export statement.

```ts
import { Matrix4 } from './matrix4.ts';

interface ProjectionParameters {
    near: number;
    far: number;
}

class Vector3 {
    // ...
}

const _vector3A = new Vector3();

export { Vector3 };
```

## Types

### Placement

- **Local**: used only within its file. Declared after the imports and not exported.
- **Module-shared**: used by several files of one module. Placed in `src/<module>/types.ts`, imported directly by those files, and not exported from `index.ts`.
- **Cross-module or public**: used by another module or appearing in a public signature (parameters, options, return values). Placed in `src/<module>/types.ts` and exported from `index.ts`. If it is not part of the public API, it is marked `@internal`.
- A shared enum object lives in its own file: `src/materials/blend-mode.ts`.
- There is no global `src/types/` directory.

### Annotations

- Return types are inferred. They are annotated only in these cases:
  - abstract members;
  - narrowing to a read-only type (`Readonly<T>`, `ReadonlyMap<K, V>`, `ReadonlySet<T>`, `readonly T[]`) for a value that is frozen or newly created. A read-only annotation never replaces runtime protection, so internal collections are never returned ([0007](decisions/0007-runtime-encapsulation.md));
  - recursion, where the compiler requires an annotation.
- `interface` describes object shapes and class contracts. `type` is used only for what an interface cannot express: unions, tuples, function types, mapped types, and conditional types.
- `unknown` is used for values of unknown type and narrowed before use. `any` is permitted only when unavoidable, with a comment stating why.
- Non-null assertions (`value!`) and definite assignment assertions (`field!: T`) are forbidden.
- Type assertions (`value as T`) are permitted only where the compiler cannot know the type: `querySelector('canvas') as HTMLCanvasElement`. They are never used to silence a type error. `as const` is not a type assertion.

### Absence of a value

- `null` means absent. This applies to fields, properties, return values of the form "entity or nothing", and parameters that accept "none". Such parameters are typed `T | null` and are required.
- `?` appears only on properties of options objects.
- A function that returns nothing exits early with a bare `return;`.
- `undefined` from built-in APIs is converted before returning: `return this.#cache.get(key) ?? null;`.
- Absence is tested with `=== null`.

## Class members

Order:

1. Static fields.
2. Static methods.
3. `#private` fields.
4. Public fields (math value types only).
5. Constructor.
6. Accessors, each getter immediately followed by its setter.
7. Public methods.
8. `#private` methods.

- **Fields**: every field of a class that is not a math value type is `#private` and is exposed through accessors ([0007](decisions/0007-runtime-encapsulation.md)).
- **Initialization**: fields are declared without initializers. Instance fields are assigned in the constructor. Static fields are assigned in a static initialization block (`static {}`).
- **Constructors** call only `#private` methods of `this`. A subclass's fields are not yet assigned while the base constructor runs.
- **Static constants** are deeply immutable. A `static #` field holds an `Object.freeze`d instance, is assigned in `static {}`, and is exposed through a CONSTANT_CASE getter. Writes throw `TypeError` because ES modules run in strict mode. Types whose storage cannot be frozen (typed arrays) have no static constants.
- **`protected`** members state the reason for the exception in a TSDoc `@remarks` tag ([0007](decisions/0007-runtime-encapsulation.md)).
- **Public methods** are grouped by responsibility. Groups, and members within a group, go from fundamental to derived. Example for `Vector3`: assignment → arithmetic → geometry → transformation → interpolation → comparison → conversion.
- **Private methods** follow stepdown order: each sits below its first caller.
- **Dividers**: when public methods form more than one group, each group starts with a divider, padded with hyphens to column 80:

```ts
    // Arithmetic -------------------------------------------------------------
```

```ts
class Vector3 {
    static #up: Vector3;

    static {
        Vector3.#up = Object.freeze(new Vector3(0, 1, 0));
    }

    static get UP(): Readonly<Vector3> {
        return Vector3.#up;
    }

    x: number;
    y: number;
    z: number;

    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
```

## Naming

### Case

| Kind                                                     | Case          | Example                         |
| -------------------------------------------------------- | ------------- | ------------------------------- |
| Classes, interfaces, type aliases, enum objects          | PascalCase    | `Vector3`, `Renderable`         |
| Methods, functions, variables, parameters, properties    | camelCase     | `normalize()`, `worldMatrix`    |
| `#private` fields and methods                            | camelCase     | `#position`, `#updateMatrix()`  |
| Module-level deeply immutable values (primitive or frozen) | CONSTANT_CASE | `MAX_LIGHTS`                  |
| Static constants                                         | CONSTANT_CASE | `Vector3.UP`, `Vector3.ZERO`    |
| Enum keys and values                                     | CONSTANT_CASE | `BlendMode.ALPHA_BLEND`         |
| Type parameters                                          | `T`; `TName` when there are several | `Map<TKey, TValue>` |

Every other binding, including local `const`, uses camelCase.

### Acronyms

- An acronym is uppercase inside an identifier (`WebGPURenderer`, `toJSON`, `loadURL`) and lowercase at the start of a camelCase identifier (`gpuDevice`, `uvOffset`, `url`).
- `id` is an abbreviation, not an acronym: `id`, `nodeId`.
- No class, interface, or type name starts with `GPU`. That prefix belongs to WebGPU.

### Abbreviations

Identifiers use full words: `position`, `direction`, `index`, `fieldOfView`. These are the only permitted short forms:

- Loop counters: `i`, `j`, `k`.
- Vector components: `x`, `y`, `z`, `w`.
- Acronyms: `GPU`, `URL`, `JSON`, `WGSL`, `GLTF`, `RGB`, `RGBA`, `HDR`, `UV`, `NDC`, `LOD`.
- `id`.

The list is extended only by editing this document.

### Booleans

- **Properties and accessors**: an adjective or participle (`enabled`, `visible`, `hidden`), or a verb phrase when one word is insufficient (`castShadow`). Never the `is` prefix.
- **Variables**: a single adjective when it names the state unambiguously (`enabled`). Otherwise the subject comes first, then `Is`, `Has`, or `Can`, then the condition: `attributeIsDisabled`, `nodeHasChildren`.
- **Methods**: verbs: `equals()`, `contains()`, `intersects()`.

### Enum objects

```ts
const BlendMode = {
    OPAQUE: 'OPAQUE',
    ALPHA_BLEND: 'ALPHA_BLEND',
} as const;

type BlendMode = (typeof BlendMode)[keyof typeof BlendMode];

export { BlendMode };
```

- Each value equals its key. When the enum mirrors a WebGPU enumeration, the value is instead the WebGPU string, so it passes to the API without mapping: `TextureFormat.RGBA8_UNORM = 'rgba8unorm'`.

### Scratch variables

- Name: `_` + the class name in camelCase, digits included + an uppercase letter starting at `A`: `_vector3A`, `_vector3B`, `_matrix4A`, `_quaternionA`.
- Declared at module scope. A scratch variable is never returned or stored, and its value is never relied upon across a call to another function.
- This is the only permitted use of the `_` prefix.

### Prohibited

- The `_` prefix outside scratch variables. Privacy is expressed with `#`.
- The `I` prefix on interfaces: `Renderable`, not `IRenderable`.
- `Abstract` or `Base` prefixes on abstract classes: `Camera`, not `AbstractCamera`.
- Vague names: `Manager`, `Helper`, `Util`, `Data`, `Info`. A name states the responsibility: `TextureCache`, `TextureLoader`.

## Comments

Comments document the public API. Implementation code is not commented. Unclear code is rewritten through naming and extraction instead of being explained.

Only these comments are permitted:

- TSDoc on the public API.
- Reference comments: the source of an algorithm or formula taken from external work, or a link to an external bug being worked around.
- `// TODO: description`.
- Group dividers ([Class members](#class-members)).

### TSDoc

- Required on every export of a module's `index.ts` and on every public member of an exported class. Public fields of math value types are exempt.
- Register: formal, precise, concise. Complete sentences, no contractions, no colloquialisms.
- The first sentence is a summary in the third-person indicative: "Computes…", "Returns…", "Sets…".
- Tags carry no types. TypeScript provides them.
- Methods that return `this` omit `@returns`. The class documentation states this convention once.
- Documentation states what the types cannot: units, coordinate system, mutation of arguments, thrown errors.
- Sources are cited with `@see`: author, title, venue, and year, or a URL.
- Tags: `@param name - Description.`, `@typeParam`, `@returns`, `@throws`, `@remarks`, `@example`, `@see`, `@internal`, `@deprecated`.

```ts
/**
 * A unit quaternion representing a rotation in three-dimensional space.
 *
 * Methods modify this quaternion and return it unless stated otherwise.
 */
class Quaternion {
    /**
     * Sets this quaternion to the spherical linear interpolation between itself and the
     * given quaternion.
     *
     * @param quaternion - The target rotation.
     * @param factor - The interpolation factor in the range [0, 1].
     * @see K. Shoemake, "Animating Rotation with Quaternion Curves", SIGGRAPH 1985.
     */
    slerp(quaternion: Quaternion, factor: number) {
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

- Only built-in error classes are used.
- In `async` functions, a throw becomes a rejection with the same error.
- Constructors, setters, and resource-creating functions outside hot paths validate their arguments. Hot paths never validate. Math value types handle degenerate input as defined in [0005](decisions/0005-math-conventions.md).
- Only `Error` instances are thrown. A wrapped error is preserved as `cause`: `new Error(message, { cause: error })`.
- Errors are never swallowed. An empty `catch` is forbidden. A `catch` either adds context and rethrows, or recovers deliberately.
- GPU errors (validation, out-of-memory, device loss, shader compilation) are always surfaced.
- Message format: `<Owner>.<member>: expected <expectation>, received <actual>.` The owner is the class name for members, `<Class>.constructor` for constructors, and the function name for free functions.

```ts
throw new RangeError(`PerspectiveCamera.fieldOfView: expected a value in (0, π), received ${value}.`);
```

## API conventions

### Accessors and methods

- A getter is used when the value is computed in O(1), has no side effects, allocates nothing, and takes no arguments: `vector.length`, `vector.lengthSquared`. Everything else is a method: `vector.dot(other)`, `matrix.determinant()`.
- Math value types have no setters for derived values. Use `vector.setLength(5)`, not `vector.length = 5`.

### Units

- Angles: radians everywhere, including `fieldOfView`. Conversion uses `degreesToRadians()` and `radiansToDegrees()`.
- Distances: meters.
- Time: seconds. Milliseconds from browser APIs are converted at the boundary.

### Standard methods

Every copyable type uses these names and semantics:

| Method                            | Semantics                                                     |
| --------------------------------- | ------------------------------------------------------------- |
| `set(x, y, z)`                    | Assigns components                                            |
| `copy(source)`                    | Copies from an instance of the same type                      |
| `clone()`                         | Returns a new instance                                        |
| `equals(other, tolerance = 0)`    | Every component differs by at most `tolerance` (absolute)     |
| `notEquals(other, tolerance = 0)` | Negation of `equals`                                          |
| `fromArray(array, offset = 0)`    | Reads components from an array                                |
| `toArray(target, offset = 0)`     | Writes components into the provided array, without allocating |

### Operations

- A binary operation computes `this = this ∘ operand`. There are no two-operand variants (`addVectors`, `multiplyMatrices`). Results are composed by chaining: `target.copy(a).add(b)`.
- Non-commutative multiplication (matrices, quaternions) also offers `premultiply(operand)`, which computes `this = operand × this`.
- Each method has one signature. A parameter never changes behavior based on its type (`Vector3 | number`): `multiply(vector)` and `multiplyScalar(scalar)` are separate methods.

### Parameters

- No boolean parameters. Use separate methods or an options property instead.
- Math value types take positional parameters, with default values for optional ones. Elsewhere, more than three parameters, or any optional parameter, require an options object: `new PerspectiveCamera({ fieldOfView, near, far })`.
- Output parameters are named `target` (`targetPosition`, `targetRotation`) and documented.

## Tests

- Runner: `node:test`. Assertions: `node:assert/strict`, plus the float helpers from `src/testing`.
- Structure: `describe('<Class>')` → `describe('<member>')` → `it('<behavior>')`. Methods include parentheses (`'normalize()'`) and accessors do not (`'length'`).
- An `it` name describes behavior in the present tense, without "should": `'leaves a zero-length vector unchanged'`.
- Each `it` covers one behavior. Several assertions are allowed if they verify that one behavior.
- Blank lines, not comments, separate arrange, act, and assert.
- Expected values are independent of the code under test: derived by hand or taken from a cited source.
- Every degenerate case documented in TSDoc has a test. Every bug fix adds a regression test, written before the fix.
- Tests are deterministic: no unseeded randomness, no dependence on time, no mutable state shared between tests.
- Results of floating-point arithmetic are compared with `assertClose` or `assertArrayClose` (default tolerance `1e-12`), never with the `equals` method of the code under test. Exact assertions (`assert.equal`, `assert.deepEqual`) are used only when the expected value involves no arithmetic.

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { assertArrayClose } from '../testing/index.ts';
import { Vector3 } from './vector3.ts';

describe('Vector3', () => {
    describe('normalize()', () => {
        it('scales the vector to unit length', () => {
            const vector = new Vector3(3, 0, 4);

            vector.normalize();

            assertArrayClose(vector.toArray([]), [0.6, 0, 0.8]);
        });

        it('leaves a zero-length vector unchanged', () => {
            const vector = new Vector3(0, 0, 0);

            vector.normalize();

            assert.deepEqual(vector.toArray([]), [0, 0, 0]);
        });
    });
});
```
