# Status — 2026-08-09

**Phases 0–5 done, plus assets and a rebuilt token layer.** Three sessions. 166 tests pass, typecheck
clean, preview-colour lint clean, working tree committed and pushed to
`github.com/itsHendri/brand-forge`.

Type a seed colour → get a complete system → see it on realistic UI → export it as something an AI
agent can actually build from. That runs end to end today.

**The export's audience is an agent building UI**, confirmed by Hendri 2026-08-09. Not a human
reader — that is why Phase 6 (the guideline page) sits behind everything else.

## What exists

**Engine** (`src/engine/`, pure, no React)

- `generateScale` — seed → 11-step OKLCH ramp. Shared lightness targets across hues, chroma bell, hue
  rotation centred on the anchor, per-step gamut clamping, and seed warping so the typed colour
  appears verbatim. Dark ramps generated from their own targets, never inverted.
- `defaultSemanticMapping` — 7 seeds → **71 semantic tokens**, every text and border colour chosen by
  *measuring* APCA against the surface it actually sits on. Links, an inverse region, three focus
  rings, a scrim, skeletons, a five-level elevation ladder, and four interactive states that are
  translucent washes whose alphas are **solved against the palette** rather than picked.
- `semanticDefs` — the full set for a brand: generated from the seeds, then the sparse
  `semanticOverrides` applied on top. **Call this, never `defaultSemanticMapping` directly.**
- `resolveTokens` — the one pipeline. Emits `declarations`, the single serialization the preview
  injects and every exporter prints. Also emits the stacking order and the app frame.
- `validateContrast` — APCA judges, WCAG 2 reported alongside. Handles translucent tokens by
  compositing them over each ground first (`composite()`, and the `over` field on a pair).
  **The shipped preset reports zero warnings of any level.**
- `migrateConfig` — a loaded brand merged over a complete default: block by block, then key by key,
  then **item by item** for the named collections. Each of those three levels was added after the
  previous one let a new default go silently missing. See "what will catch you out" below.

**App** at `localhost:5300` — eight panels, four preview contexts (Components, Surfaces, Marketing,
Dashboard) sharing `preview/kit.tsx`, a width selector covering base (390px) and every breakpoint,
light/dark, a contrast badge and warnings drawer with one-click fixes, undo/redo, a brand switcher,
and an export dialog with a budget meter.

**Export** writes `exports/<slug>/`: `skill/SKILL.md`, `skill/references/DESIGN_SYSTEM.md`,
`tokens.css` (+ Tailwind v4 `@theme`, + `@font-face`), `tokens.json` (DTCG), `brand.json`, and
`assets/` when the brand carries any. Docs total ~17.7k LLM tokens; `DOC_BUDGET` is 24k and is a
**smoke alarm, not a limit** — it exists to notice a jump, not to justify cutting.

The shipped brand is Hendri's real one — Signal `#574cff`, Ember `#f1760f`, Space Grotesk with Syne
for display, and the wordmark from hendri.design. No fonts are bundled.

## How work is protected

Autosave is instant and unconditional, so four layers:

1. **Undo/redo** (⌘Z / ⇧⌘Z) — every mutation snapshots first.
2. **The seed field holds its own text**, committing only when the value parses.
3. **`brands/.backup/<slug>.json`** — the dev server keeps the version each save replaces.
4. **A test pins `brands/hendri.json`'s seeds to the preset's.** Added after the shipped primary
   silently became `#47abe1` — the dev server autosaved a stray edit and a `git add -A` swept it into
   an unrelated commit. Two acceptance runs then tested a brand nobody had chosen, and the freshness
   test stayed green throughout because the export was faithful to the changed brand the whole time.

A brand also persists only the semantic tokens a human moved (`color.semanticOverrides`), everything
else regenerates on load, and `exports/` is held to the engine by a test whose fix is
`npm run export`. See `DECISIONS.md` #22 and #23.

## The quality gate

**The acceptance test has run seven times.** Each time a subagent with no knowledge of this project
built a real page from the exported folder alone, then critiqued *the documentation*. All seven
succeeded; every critique found genuine defects. The method is a skill:
`~/skills/skills/doc-acceptance-test/` (pushed to `github.com/itsHendri/skills`).

| Run | Brief | Worst thing it found |
|---|---|---|
| 1 | Pricing page | `font: var(--text-label)` in every recipe — invalid CSS, dropped silently |
| 2 | Docs/changelog | Layout gaps: no breakpoints, containers, sidebar widths |
| 3 | Settings page | Every status border at Lc 0; contrast claim counting half its warnings |
| 4 | Plans/upgrade | Focus invisible on a brand field (`--ring` **is** `--primary`) |
| 5 | App shell | The "does not define" list still denying tokens added an hour earlier |
| 6 | Content site | Six hand-written measurements true of one palette only — and the shipped brand had silently become a different colour |
| 7 | Docs site | `--container-intro` documented, justified, and absent from the stylesheet |

Runs 2–7 independently recomputed every token hex from the OKLCH sources and confirmed the doc tables
are exact — run 7 checked all 71 semantics in both modes, both shared-value tables, both `clamp()`
endpoints and the concentric worked examples.

**The generated numbers have never been wrong. Every defect has been in prose.** That is the argument
for keeping generated tables generated and treating every hand-written sentence as a liability until
an agent has tried to build from it — and, since run 7, for remembering that *computed* is not the
same as *correct*: one generated figure quoted the wrong token.

## Open for Hendri — decisions, not bugs

1. **Is Ember orange enough, or do you want it redder?** `#f1760f` is your real declared secondary.
   You asked for "orangey red"; this is orange. Shifting toward red (~`#e8501a`) is one field.
2. **Is `--secondary` the darkened `#cc6000`, or the real seed with a dark label?** The Components
   preview shows all three side by side under *When a fill can't carry a label*. Look at it rather
   than reasoning about it.
3. **`--font-display` is Syne**, standing in for Alpha Lyrae, which is licensed and deliberately not
   bundled. Both hosted, so the export links and ships no font files.
4. **No mono face is declared** on the live site; `--font-mono` is a neutral system stack.
5. **Assets are committed, not ignored.** Fine for your own brand; a licensing decision the moment a
   client's licensed font is involved. See `DECISIONS.md` #14.

## Next

See `FUTURE.md` — it is the entry point and is current.
