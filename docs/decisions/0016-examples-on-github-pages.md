# 0016. Examples on GitHub Pages

- Status: Accepted
- Date: 2026-11-08

## Context

- Examples run only through the dev server ([0012](0012-examples-via-public-api.md)). It strips types from `.ts` files on request, and the import map resolves `spurv` to `src/index.ts`.
- A static host serves `.ts` files with a media type that browsers refuse for module scripts, and a GitHub Pages project site lives under a sub-path (`/spurv/`), so absolute paths break.
- Published examples show the progress of the library and run in any browser with WebGPU support.

## Decision

- `scripts/build-site.ts` (`npm run build:site`) builds a static site in `site/`:
  - the library from `npm run build`;
  - each example with types stripped by `stripTypeScriptTypes`, as the dev server does, and its import map pointed at the built library;
  - an index page that lists the examples.
- Example import maps use relative paths (`../../src/index.ts`), so the dev server and the site resolve them under any sub-path.
- The `CD` workflow deploys `site/` to GitHub Pages on every push to `main`. CI and CD are separate workflows: CD needs write access to Pages, which pull requests must not get.

## Consequences

- Every merge into `main` updates the published examples.
- Examples import only `spurv` ([0010](0010-module-boundaries-and-layers.md)), so stripped scripts need no rewriting of imports.
- The site build relies on `stripTypeScriptTypes`, which is experimental, as the dev server does.
- GitHub Pages must use GitHub Actions as its source in the repository settings.
- CD deploys what is on `main` without running tests. Status checks required before merging keep a failing build off `main`.
