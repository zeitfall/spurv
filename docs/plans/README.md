# Plans

A plan is the checklist of one module for the current milestone: `docs/plans/<module>.md`.

- Content: goal, ordered checklist, out-of-scope items, open questions. Rationale belongs in ADRs or `code-style.md`, not in a plan.
- An item is checked after it is implemented (by the author for a key subsystem, by the assistant otherwise), tested by the assistant, and reviewed by both.
- A resolved open question moves to the checklist, an ADR, or `code-style.md`.
- A plan is deleted when every item is checked. Git history preserves it.
