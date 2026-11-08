# 0017. Toolchain and examples

- Status: Accepted
- Date: 2026-11-08

## Context

This ADR supersedes [0009](0009-toolchain.md), [0012](0012-examples-via-public-api.md), and [0016](0016-examples-on-github-pages.md). It keeps their decisions about the library, its tests, and the purpose of the examples, and it replaces the custom tools that serve and publish the examples.

Those three decisions together produced about three hundred lines of custom code in `scripts/`: a development server that strips types on request and reloads the page, a script that builds the examples site, and a helper that generates the index page shared by both. This code belongs neither to the library nor to its tests, and yet every new need of the examples extends it. Upcoming examples will load textures, models, and shaders from separate files and may run workers, and each of these requires new media types, new copying rules, or new path handling in both the server and the site script.

Vite provides all of this as an existing tool. Its development server does not bundle; it transforms each module on request and serves it individually, so the development loop keeps the property of 0012 that no build step precedes a page load. Only its production build bundles, and that build applies to the examples site, which is a demonstration rather than the published package. A build with a relative base resolves under any sub-path, which the GitHub Pages project site requires, and a multi-page build accepts one entry for each example.

esbuild was considered as a smaller alternative. It does not process HTML, however, and its live reload requires a script inserted into every page by hand, so most of the site script would remain and would merely call esbuild instead of `stripTypeScriptTypes`.

The reasoning of 0009 about the library itself still holds. The consumers' bundlers tree-shake unbundled ESM, so the package needs no bundling, and neither Vite nor esbuild emits declaration files, so `tsc` remains the build tool of the library. Every dependency remains a maintenance and supply-chain cost as well: Vite 8.3 installs fifteen packages, two of which are native binaries, and it occupies about 30 MB.

## Decision

The library keeps the toolchain of 0009. `tsc` type-checks the sources, tests, scripts, examples, and the Vite configuration through `tsconfig.json`. `tsc -p tsconfig.build.json` builds the library into `dist/library/` as unbundled ESM with `.d.ts` files, and the build uses only `@webgpu/types`, so library code cannot reference Node globals, whereas tests may use Node APIs. Tests run on the `.ts` sources directly under `node:test`. The import rules of [0010](0010-module-boundaries-and-layers.md) remain enforced by `scripts/check-imports.ts`. No formatter or linter is used for now, and Vitest is not adopted, since tests that need a GPU are still deferred.

The compiler constraints of 0009 also remain in force, because both Node type stripping and the per-file transform of Vite depend on them:

- `erasableSyntaxOnly` forbids `enum`, `namespace`, and parameter properties.
- `verbatimModuleSyntax` requires type-only imports to use `import type`.
- Relative imports use the `.ts` extension, and `rewriteRelativeImportExtensions` maps them to `.js` in the build.
- `stripInternal` removes `@internal` declarations from the published `.d.ts` files.

The purpose of the examples follows 0012 unchanged. Each milestone ([architecture.md](../architecture.md#milestones)) has an example in `examples/NN-name/`, consisting of an `index.html` and a `main.ts`, and an example imports only the public package `spurv`, so that an example which cannot be written with the public API exposes a gap in that API.

Vite replaces the custom tools for the examples, and its configuration lives in `vite.config.ts` at the repository root. Its root is `examples/`, and an alias resolves `spurv` to `src/index.ts`, so the import maps are removed from the example pages. `npm run dev:examples` starts the Vite development server, which reloads the page when a source file changes. `npm run build:examples` runs the Vite production build with a relative base and writes the built examples to `dist/examples/`. The configuration derives the list of entries from the directories in `examples/`, whereas the index page `examples/index.html` is written by hand and links to each example. Both builds thus share `dist/` as their output directory, and the `files` field of `package.json` lists only `dist/library/`, so the published package never contains the built examples, whichever builds have run before it is packed.

Integration and deployment follow 0016. The `Continuous Integration` workflow checks the types, runs the tests and the import check, and builds the library on every pull request and on every push to `main`, and a required status check on its job lets a pull request merge only after that job passes. The `Deploy Examples` workflow deploys `dist/examples/` to GitHub Pages on every push to `main`. It remains separate from the `Continuous Integration` workflow, because it needs write access to Pages, which pull requests must not get, and it runs no tests, since the required status check already keeps a failing change off `main`.

Library code uses no feature that only Vite understands, such as an import specifier with a query suffix like `?raw`, `import.meta.glob`, or `import.meta.env`. Such a feature works in the examples, but `tsc` leaves it unchanged in `dist/library/`, where the bundler of a consumer cannot resolve it. Shader code in the library therefore remains in TypeScript string literals.

The scripts `dev-server.ts`, `build-site.ts`, and `example-index.ts` are removed, and Vite is added as a development dependency.

## Consequences

- Only the import check and its tests remain in `scripts/`, and new needs of the examples, such as assets or workers, are met by Vite without custom code.
- Vite remains a development dependency and never reaches the consumers of the package. Its major versions appear about once a year, however, and each of them may require a migration of the configuration.
- The experimental `stripTypeScriptTypes` and its warning are no longer used by any tool of the project.
- The transform of Vite does not preserve line and column positions, so browser stack traces match the sources only through source maps, which the developer tools of the browser apply automatically.
- The built examples bundle the library from `src/` and therefore no longer exercise the contents of `dist/library/`. The `Continuous Integration` workflow still runs `npm run build:library`, which verifies that the library builds, but not that the built files run in a browser.
- Adding an example requires a link in the index page, which happens once per milestone.
- The rule against Vite-only features in library code is not yet checked mechanically, so a violation is found only in review or by a consumer.
- Vitest can later reuse the same configuration for tests in a browser, although that decision is deferred.
- [0008](0008-const-objects-over-enums.md) refers to 0009 for type stripping. On acceptance of this ADR, that link is updated to this ADR as an editorial correction, since the constraint it relies on is now stated here.
