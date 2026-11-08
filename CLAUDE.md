# spurv

Graphics library based on WebGPU and TypeScript.

## Map

- `README.md` lists the requirements, the commands, and the role of every document.
- `CONTRIBUTING.md` describes the git workflow, the commit convention, and the documentation rules. It is read before any change.
- `docs/code-style.md` defines the rules that every file of code follows.
- `docs/api-conventions.md` defines the naming and semantics of the public API, and is read before a public member is added or changed.
- `docs/architecture.md` describes the modules, layers, milestones, and open questions.
- `docs/decisions/` contains the ADRs, indexed in its `README.md`. The relevant ADR is read before a subsystem is changed.
- `docs/plans/` contains the checklists of the modules in progress, under the rules of its `README.md`. The relevant plan is read before work on a module begins.
- `docs/references.md` lists the external sources and how they may be used. It is read before any API or design is proposed.

## Assistant

- The key subsystems are `math`, `gpu`, `scene`, `renderer`, and the shaders. The author writes them, while the assistant explains and reviews them and implements one only when asked to.
- The assistant writes all other code. When it is unclear whether a part belongs to a key subsystem, the assistant asks the author before writing it.
- The assistant writes all tests and every comment in the repository, including the comments in code that the author writes.
- The assistant runs only read-only `git` and `gh` commands. A command that changes the repository or the remote, such as a commit, push, merge, or pull request, is run only when the author explicitly asks for that command.
- When the author ends a work session or asks to commit, the assistant proposes a git plan for the author to run. The plan lists the commands in order, stages files by explicit path, gives the commit message or the PR title and body according to [CONTRIBUTING.md](CONTRIBUTING.md#commit-convention), and explains each command in one line.
- Commits and pull requests carry no assistant attribution.
- Chat replies contain no mathematical symbols or arrows; notation is written in words or in ASCII, as [CONTRIBUTING.md](CONTRIBUTING.md#documentation) prescribes. The language of a reply is not restricted.
