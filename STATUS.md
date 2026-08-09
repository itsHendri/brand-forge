# Status — 2026-08-09

**Phases 0–5 done, plus assets. The tool does the whole loop it was built for.**
Two sessions. 94 tests pass, typecheck clean, preview-colour lint clean, working tree committed.

Type a seed colour → get a complete system → see it on realistic UI → export it as something an AI
agent can actually build from. That runs end to end today.

## What exists

**Engine** (`src/engine/`, pure, no React)
- `generateScale` — seed → 11-step OKLCH ramp. Lightness targets shared across every hue, chroma
  bell, hue rotation centred on the anchor, per-step gamut clamping, and seed warping so the typed
  colour appears verbatim. Dark ramps generated from their own targets, never inverted.
- `defaultSemanticMapping` — 7 seeds → **57 semantic tokens**, every text and border colour chosen
  by *measuring* APCA against the surface it actually sits on, not by picking a step number.
- `resolveTokens` — the one pipeline. Emits `declarations` (206 light / 138 dark), the single
  serialization the preview injects and every exporter prints.
- `validateContrast` — APCA judges, WCAG 2 reported alongside. **The shipped preset reports zero
  warnings of any level.**
- `migrateConfig` — a loaded brand is merged over a complete default, block by block.

**App** at `localhost:5300` — eight panels (Brand, Colour, Semantics, Type, Layout, Space & shape,
Motion, Rules), four preview contexts (Components, Surfaces & elevation, Marketing, Dashboard)
sharing `preview/kit.tsx`, a width selector covering **base (390px)** and every breakpoint,
light/dark, a contrast badge and warnings drawer with one-click fixes, undo/redo, a brand switcher
with duplicate / new / delete, and an export dialog with a token-budget meter.

**Export** writes `exports/<slug>/`: `skill/SKILL.md`, `skill/references/DESIGN_SYSTEM.md`,
`tokens.css` (+ Tailwind v4 `@theme`, + `@font-face`), `tokens.json` (DTCG), `brand.json`, and
`assets/` when the brand carries any. Docs total ~11.3k LLM tokens against an 18k budget.

## How work is protected

Three layers, because autosave is instant and unconditional and a stray click on a colour input used
to be permanent — it silently turned this project's own primary seed `#000000` three times.

1. **Undo/redo** (⌘Z / ⇧⌘Z) — every mutation snapshots first.
2. **The seed field holds its own text**, committing only when the value parses.
3. **`brands/.backup/<slug>.json`** — the dev server keeps the version each save replaces, which
   covers the case undo can't (a browser refresh clears in-memory history).

## The quality gate

**The acceptance test has run four times.** Each time a subagent with no knowledge of this project
built a real page from the exported skill folder alone, then critiqued *the documentation*. All four
succeeded; every critique found genuine defects. The method is now a skill:
`~/skills/skills/doc-acceptance-test/` (pushed to `github.com/itsHendri/skills`).

| Run | Brief | Worst thing it found |
|---|---|---|
| 1 | Pricing page | `font: var(--text-label)` in every recipe — invalid CSS, dropped silently |
| 2 | Docs/changelog | Layout gaps: no breakpoints, containers, sidebar widths |
| 3 | Settings page | Every status border at Lc 0; contrast claim counting half its warnings |
| 4 | Plans/upgrade | Focus invisible on a brand field (`--ring` **is** `--primary`) |

Runs 2–4 independently recomputed every token hex from the OKLCH sources and confirmed the doc
tables and shared-value list are exact — run 4 checked all 90. **The numbers have never been wrong.
Every failure has been in what the prose *infers* from them.** That is the argument for keeping
generated tables generated and treating every hand-written sentence as a liability until an agent
has tried to build from it.

## Open for Hendri — decisions, not bugs

1. **The secondary scale does no work.** Seeded provisionally from Foreground Secondary (`#40525e`),
   it renders almost identically to the neutral ramp — same hue family, both low chroma.
   hendri.design has no declared secondary. Pick one, or drop the slot.
2. **Type families are placeholders** (Geist / Geist Mono via Google Fonts), unconfirmed against the
   live site. No font files are uploaded, so the preview renders in the hosted faces.
3. **No logo is set.** The upload works; nothing has been uploaded. The docs currently tell an agent
   "no mark is defined — set the brand name in type and say that you did."
4. **`--text-display` is fixed at 3.5rem** and runs to four lines / 235px at 390px. Fluid type is a
   token-model change — see FUTURE.
5. **Assets are committed, not ignored.** Fine for your own brand; a licensing decision the moment a
   client's licensed font is involved. See DECISIONS #14.

## Next

See `FUTURE.md` — it is the entry point and is current.
