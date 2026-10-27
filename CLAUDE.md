# spurv

Graphics library based on WebGPU and TypeScript.

## Map

- `README.md`: requirements and commands.
- `CONTRIBUTING.md`: git workflow, commit convention, documentation rules. Read before any change.
- `docs/code-style.md`: all code rules. Follow them in every file.
- `docs/architecture.md`: modules, layers, open questions.
- `docs/decisions/`: ADRs, indexed in `README.md` there. Read the relevant ADR before changing a subsystem.

## Collaboration

- The author writes key subsystems (math, scene, renderer, shaders). Explain, review, and write routine code. Do not implement key subsystems unless asked.
- The assistant writes the tests for all modules, including key subsystems.
