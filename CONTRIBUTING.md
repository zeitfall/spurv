# Contributing to spurv

## Git workflow

- `main` is always in a working state. Nothing is committed to it directly.
- Every change (a feature, fix, milestone, or refactor) is made on a short-lived branch and merged through a Pull Request.
- Pull Requests are merged with **squash merge**. The PR title becomes the single commit on `main`, so **the PR title must follow the commit convention below**. Commit messages on a branch are free-form.

### Branch names

```
<type>/<short-description-in-kebab-case>
```

Examples: `feat/quaternion-slerp`, `fix/projection-depth-range`, `docs/adr-scene-model`.

## Commit convention

spurv follows [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type       | Use for                                                       |
| ---------- | ------------------------------------------------------------- |
| `feat`     | A new feature or public API                                   |
| `fix`      | A bug fix                                                     |
| `perf`     | A change that improves performance without changing behavior |
| `refactor` | A code change that neither fixes a bug nor adds a feature     |
| `test`     | Adding or fixing tests                                        |
| `docs`     | Documentation only, including ADRs and code comments          |
| `build`    | Build scripts, TypeScript config, dependencies                |
| `ci`       | CI configuration                                              |
| `chore`    | Maintenance that fits nowhere else                            |
| `revert`   | Reverting a previous commit                                   |

### Scopes

The scope is the single module (`math`, `scene`, `renderer`) or repository area (`testing`, `examples`, `scripts`, `deps`) that the change affects. Omit it when the change affects more than one, or when it would repeat the type (`docs`).

### Rules

- **First line**: 72 characters at most, including type and scope.
- **Subject**: imperative mood ("add", not "added" or "adds"), lowercase except for code identifiers, no trailing period.
- **Body**: omitted by default. Written only when the subject cannot convey a non-obvious *what* or *why*, such as a subtle fix, a trade-off, or a workaround. Explains *what* and *why*, not *how*. Wrap at 72 characters. The PR body becomes the body of the squash commit, so it follows the same rule.
- **Breaking changes**: put `!` after the type or scope **and** add a `BREAKING CHANGE:` footer that describes the migration.

### Examples

```
feat(math): add Quaternion.slerp
```

```
fix(math): use [0, 1] depth range in perspective projection

WebGPU clip space uses z in [0, 1], unlike WebGL's [-1, 1].
The previous matrix was ported from a WebGL formula and pushed
the near half of the frustum outside the clip volume.
```

```
refactor(scene)!: replace Node.children array with iterator

BREAKING CHANGE: `node.children` is now a method that returns an
iterator. Use `for (const child of node.children())` instead of
indexing the array, and `node.childCount` instead of `.length`.
```

## Documentation

- Language: English.
- Style: compact and precise. No filler.
- Characters: ASCII only, in documents, comments, string literals, commit messages, and PR titles and bodies. Mathematical notation is written in words ("pi", "at least") or with ASCII operators (`>=`, `*`, `+/-`, `-Z`), or the sentence is rephrased. Arrows are replaced by words or lists.
- Each fact is stated in one file; other files link to it. The role of each file is listed in [CLAUDE.md](CLAUDE.md).
- When an ADR is required: [docs/decisions/README.md](docs/decisions/README.md).
