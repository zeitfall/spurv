# spurv

Graphics library based on WebGPU and TypeScript.

> Status: early development. No usable API yet.

## Requirements

- Node.js 26 or later
- A browser with WebGPU support

## Scripts

| Command                    | Action                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run build:library`    | Emit ESM and `.d.ts` to `dist/library/`                                                                                |
| `npm run check:types`      | Type-check sources, tests, scripts, examples, and the Vite configuration                                               |
| `npm run check:imports`    | Check module boundaries and layers ([0010](docs/decisions/0010-module-boundaries-and-layers.md))                       |
| `npm test`                 | Run unit tests (`node:test`)                                                                                           |
| `npm run dev:examples`     | Serve the examples at `http://localhost:5173` with live reload ([0017](docs/decisions/0017-toolchain-and-examples.md)) |
| `npm run build:examples`   | Build the examples to `dist/examples/` ([0017](docs/decisions/0017-toolchain-and-examples.md))                         |
| `npm run preview:examples` | Serve the built examples from `dist/examples/` at `http://localhost:4173`                                              |

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
