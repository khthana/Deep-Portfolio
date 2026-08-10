# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One `CONTEXT.md` and one `docs/adr/` at the repo root.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/adr/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

`CONTEXT.md` does not exist yet in this repo. `docs/adr/` does, and holds the
decisions taken after the refactor. All of them so far are about who may act on
what: `0001-portfolio-access.md` (a student's own rows),
`0002-section-access.md` (a teacher's own sections) and
`0003-enrolment-access.md` (a student's own sections). Read all three before
adding an authorisation check anywhere.
Everything the refactor itself decided is in `docs/spec-refactor-redeploy.md`,
whose Implementation Decisions (D1–D13) and Testing Decisions (T1–T7) sections
function as ADRs for that period. Treat a contradiction with either the same
way: surface it, don't override it silently.

## File structure

Single-context repo (most repos):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (presence of `CONTEXT-MAP.md` at the root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

Note: this repo uses an npm-workspaces layout (`apps/api`, `apps/web`, and an
empty `packages/`). That is a package boundary, not a bounded-context
boundary — it does not on its own justify switching to multi-context. Revisit
only if `packages/` grows genuinely separate domains.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

This domain carries a lot of Thai higher-education vocabulary (CLO, PLO,
rubric levels, score weights, semester courses, sections). The database uses
one set of names and the thesis document another; where they disagree,
`prisma/schema.prisma` is the source of truth, per spec D2.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders) — but worth reopening because…_
