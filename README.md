# Brand Forge

A brand + design system builder. Author the system, see it live on realistic UI, export it as
something machines can actually use.

**This is a tool, not a Framer project.** It lives at `~/brand-forge/` with its own git repo. It
borrows the `~/Framer/` dossier convention (README / STATUS / PLAN / FUTURE / DECISIONS / CHANGELOG)
because that convention works, not because it belongs to that workspace.

## Why

Three kinds of tool exist today and none of them meet:

- **Token tooling** (Tokens Studio, Style Dictionary, Terrazzo) — powerful, dev-only, no visualisation.
- **Palette toys** (uicolors.app, Realtime Colors, tweakcn) — delightful, but a flat vocabulary and one preview.
- **Brand platforms** (Corebook, Standards, Frontify) — beautiful, human-only, token-dead.

Brand Forge sits in the empty middle: primitive → semantic authoring, realistic live preview, and a
machine-readable export whose flagship artifact is an **AI skill** — the design system as context a
coding agent can follow.

## The model in one paragraph

You type a handful of seed colours. Each becomes an 11-step OKLCH ramp (`50…950`, Tailwind
numbering) with lightness targets shared across every hue, so the whole system reads as one family.
**Primitives are where a human edits colour.** On top sits a **semantic layer** — `background`,
`foreground`, `border`, `primary`, `state-hover`… — which is **how everything else, including AI,
refers to colour**. Semantics alias primitives; they never restate values. Add role-named type,
a 4px spacing grid, one radius knob, elevation and motion, and the system is complete enough to
build from.

## Run it

```bash
npm install
npm run dev     # http://localhost:5300
npm test        # engine golden tests
npm run typecheck
```

The dev server doubles as the file sidecar: `GET/PUT /api/brands/:slug` reads and writes
`brands/<slug>.json`, and `POST /api/export/:slug` writes a whole export tree into
`exports/<slug>/` — so the generated skill folder can be symlinked straight into `~/.claude/skills/`.

## Layout

| Path | What lives there |
|---|---|
| `src/engine/` | Pure functions. No React. The scale generator, semantic mapping, and the one `resolveTokens` pipeline. |
| `src/export/` | `ResolvedTokens` → files. Each exporter is a pure `→ string`. |
| `src/app/` | The editor UI and the preview canvas. |
| `src/presets/` | Hendri's brand, seeded from the real hendri.design token values. |
| `brands/` | Saved brand configs — one JSON file each. Multi-brand is just multiple files. |
| `exports/` | Generated output trees, committed so the diffs are reviewable. |

## The one rule

`resolveTokens()` produces `declarations` — an ordered `[--var, value][]` per mode. The live preview
injects that array; every exporter prints that array. **There is exactly one serialization of the
system**, which is why the preview and the export cannot drift apart. Don't add a second path.
