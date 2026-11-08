# Contributing to spurv

## Git workflow

The `main` branch is always in a working state, and nothing is committed to it directly. Every change is instead made on a short-lived branch and merged through a pull request.

Pull requests are merged with **squash merge**, which turns the PR title into the single commit that lands on `main`. For this reason **the PR title must follow the commit convention below**, whereas the commit messages on a branch are free-form.

### Branch names

```
<type>/<short-description-in-kebab-case>
```

The type is one of the commit types below, as in `feat/add-feature-a`, `fix/correct-behavior-a`, or `docs/describe-decision-a`.

## Commit convention

The project follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Use for                                                      |
| ---------- | ------------------------------------------------------------ |
| `feat`     | A new feature or public API                                  |
| `fix`      | A bug fix                                                    |
| `perf`     | A change that improves performance without changing behavior |
| `refactor` | A code change that neither fixes a bug nor adds a feature    |
| `style`    | Formatting that does not change the meaning of the code      |
| `test`     | Adding or fixing tests                                       |
| `docs`     | Documentation only, including ADRs and code comments         |
| `build`    | Build scripts, TypeScript configuration, dependencies        |
| `ci`       | CI configuration                                             |
| `chore`    | Maintenance that fits nowhere else                           |
| `revert`   | Reverting a previous commit                                  |

### Scopes

The scope names the single module or repository area that the change affects. Modules are listed in [docs/architecture.md](docs/architecture.md#modules-and-layers), and the repository areas are `testing`, `examples`, `scripts`, and `deps`. The scope is omitted when the change affects more than one of them, or when it would merely repeat the type, as `docs(docs)` would.

### Rules

- The first line is at most 72 characters long, type and scope included.
- The subject is written in the imperative mood ("add", not "added" or "adds"), in lowercase except for code identifiers, and without a trailing period.
- The body is omitted unless the subject cannot convey a non-obvious *what* or *why*, as is often the case with a subtle fix, a trade-off, or a workaround. It explains what changed and why, never how, and it is wrapped at 72 characters. Since the PR body becomes the body of the squash commit, it follows the same rule.
- A breaking change is marked with `!` after the type or scope **and** with a `BREAKING CHANGE:` footer that describes the migration.

### Examples

```
feat(module-a): add ClassA.methodA
```

```
fix(module-a): clamp the factor of ClassA.methodA to [0, 1]

A factor outside [0, 1] extrapolated beyond both endpoints, which
callers did not expect from an interpolation.
```

```
refactor(module-a)!: replace the ClassA.items array with an iterator

BREAKING CHANGE: `instanceA.items` is now a method that returns an
iterator. Use `for (const item of instanceA.items())` instead of
indexing the array, and `instanceA.itemCount` instead of `.length`.
```

## Documentation

Documentation is written in English, in a formal and technical register. Sentences are declarative and use the third person and the present tense; they contain no first or second person, no contractions, no hedging, and no filler such as "simply", "just", "basically", or "note that". The prose should nevertheless read naturally: sentences are complete and connected by conjunctions, and a list is used only when its items are genuinely parallel.

Documents, comments, string literals, commit messages, and PR titles and bodies contain ASCII characters only. Mathematical notation is therefore written in words ("pi", "at least") or with ASCII operators (`>=`, `*`, `+/-`, `-Z`), or else the sentence is rephrased. Arrows are replaced with words or lists.

Instructions, that is, this file, the code style, and the workflow rules for ADRs and plans, are written so that they would apply unchanged to another project. They name no class, module, or function of the library; where an example is unavoidable, it uses placeholder names such as `ClassA` or `variableA`.

Each fact is stated in exactly one file, and other files link to it. The role of each document is listed in the [README](README.md#documentation), and the criteria for when an ADR is required are given in [docs/decisions/README.md](docs/decisions/README.md).
