# spurv

Graphics library based on WebGPU and TypeScript.

> Status: early development. No usable API yet.

## Requirements

- Node.js 26 or later
- A browser with WebGPU support

## Scripts

| Command                 | Action                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run dev`           | Serve the examples at `http://localhost:8000` with live reload                                   |
| `npm run typecheck`     | Type-check sources, tests, scripts, and examples                                                 |
| `npm test`              | Run unit tests (`node:test`)                                                                     |
| `npm run check-imports` | Check module boundaries and layers ([0010](docs/decisions/0010-module-boundaries-and-layers.md)) |
| `npm run build`         | Emit ESM and `.d.ts` to `dist/`                                                                  |
| `npm run build:site`    | Build the examples site in `site/` ([0016](docs/decisions/0016-examples-on-github-pages.md))     |

## Documentation

- [Contributing](CONTRIBUTING.md) describes the git workflow, the commit convention, and the rules for documentation.
- [Code style](docs/code-style.md) defines how code is formatted, structured, named, commented, and tested.
- [API conventions](docs/api-conventions.md) define the naming and semantics of the public API of the library.
- [Architecture](docs/architecture.md) describes the current modules and layers, the milestones, and the open questions.
- [Architecture decisions](docs/decisions/README.md) record each significant decision together with its rationale.
- [Plans](docs/plans/README.md) hold the checklists of the modules in progress.
- [References](docs/references.md) list the external sources and the terms on which they may be used.

## License

[MIT](LICENSE)
