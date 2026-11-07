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

- [Architecture](docs/architecture.md)
- [Architecture decisions](docs/decisions/README.md)
- [Code style](docs/code-style.md)
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE)
