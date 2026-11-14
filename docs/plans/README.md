# Plans

A plan is the checklist of one module for the current milestone, stored in `docs/plans/<module>.md`. It states the goal, an ordered checklist, the items that are out of scope, and the open questions. A plan holds no rationale, which belongs in an ADR.

An item is checked once it has been implemented, tested, and reviewed by both the author and the assistant; who implements and who tests is defined in [CLAUDE.md](../../CLAUDE.md#assistant). When an open question is resolved, the answer moves to the checklist, to an ADR, or to one of the convention documents.

A plan is deleted as soon as every item is checked, since the git history preserves it.
