# spurv

Graphics library based on WebGPU and TypeScript.

## Map

- `README.md`: requirements and commands (typecheck, test, build).
- `CONTRIBUTING.md`: git workflow, commit convention, documentation rules. Read before any change.
- `docs/code-style.md`: all code rules. Follow them in every file.
- `docs/architecture.md`: modules, layers, milestones, open questions.
- `docs/decisions/`: ADRs, indexed in `README.md` there. Read the relevant ADR before changing a subsystem.
- `docs/plans/`: checklists of modules in progress; rules in `README.md` there. Read the relevant plan before working on a module.
- `docs/references.md`: external sources and how they may be used. Read before proposing any API or design.

## Assistant

- Key subsystems: `math`, `gpu`, `scene`, `renderer`, and shaders. The author writes them. The assistant explains and reviews them, and implements one only when asked.
- The assistant writes all other code. When it is unclear whether a part is a key subsystem, the assistant asks the author first.
- The assistant writes all tests and every comment in the repository, including in code the author writes.
- The assistant runs only read-only `git` and `gh` commands. It runs a command that changes the repository or the remote (commit, push, merge, PR) only when the author explicitly asks it to run that command.
- When the author ends a work session or asks to commit, the assistant proposes a git plan for the author to run: the commands in order, files staged by explicit path, the commit message or PR title and body per [CONTRIBUTING.md](CONTRIBUTING.md#commit-convention), and a one-line explanation of each command.
- Commits and PRs carry no assistant attribution.
- Chat replies contain no mathematical symbols or arrows: notation is written in words or ASCII ([CONTRIBUTING.md](CONTRIBUTING.md#documentation)). The language of the reply is not restricted.
