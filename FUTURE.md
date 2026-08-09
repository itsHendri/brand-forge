# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**The static guideline page** (Phase 6). With assets and their documentation in place, a generated
page can show the real mark in the real typeface — the artifact a client actually wants, and the
one output the tool still doesn't produce. A second Vite entry SSG-rendering the preview contexts
plus the token tables into `exports/<slug>/guidelines/index.html`.

Worth running before or after: **another acceptance test**. The docs have gained a Brand assets
section, the on-brand rule, and status hover states since the last run, and none of that has been
tested on an agent. Use the `doc-acceptance-test` skill; brief it on something with a full-bleed
brand band, since that is the newest rule.

The canvas has four contexts — Components, Surfaces, Marketing, Dashboard — sharing
`preview/kit.tsx`, and the width selector covers the base (390px) case as well as every breakpoint.

## Two decisions the marketing context surfaced

Both are real gaps in the *system*, not the canvas, and both need Hendri's call.

**1. `--text-display` is fixed at 3.5rem, and it shows.** At the base width (390px) the hero heading
runs to **four lines and 235px** — a quarter of a phone viewport before the page has said anything.
It fits without overflow and nothing breaks mid-word, so this is a taste failure rather than a bug.
The fix is fluid type: a role would gain a min size and grow with the viewport
(`clamp(2.25rem, 1.5rem + 4vw, 3.5rem)`), which means `TypeRole` gains an optional `minSizeRem` and
the CSS emits a `clamp()` instead of a fixed length. Worth doing for `display` and probably
`heading-lg`; the rest are fine fixed. Deliberately not done unilaterally — it changes the token
model, and "no responsive type" is currently an honest, documented position.

**2. There is no role for a control on a brand field.** The outline button hardcodes
`--foreground`, which is correct on a neutral surface and is dark ink on dark indigo when the button
sits on a `--primary` band — the same class of bug as the outline button vanishing inside a card,
which was already fixed once. The kit now has an `inverse` tone composed from
`--primary-foreground`, but **the exported docs say nothing about it**. Either promote it to real
tokens (`--on-brand`, `--on-brand-border`) or document the composition rule: *a control on a brand
field takes the fill's own `-foreground` for both its text and its border.*

## Gaps the acceptance test exposed

A subagent built a page from the exported docs and listed what it had to invent. The docs now
*declare* these gaps honestly, but declaring is not solving:

- ~~**Breakpoints**~~ and ~~**container widths**~~ — done. See `DECISIONS.md` #10 and #11.
- **Icon box size.** The craft rules specify stroke weight to a fraction of a pixel and never the box.
- **Link colour in body copy.** `--primary` is documented as a fill; there is no `--link`.
- **Standalone font weights**, **opacity**, **z-index**, **blur** — not modelled at all.
- **Reduced-motion duration.** The rule says "cut to near zero"; the smallest token is 100ms.
- **A type step between 1.5rem and 2.25rem.** A price or a stat lands awkwardly between them.

## Known rough edges

- **Saved brands don't pick up improved defaults.** `brands/*.json` stores the resolved semantic
  mapping, so when `defaultSemanticMapping` gets smarter, existing files keep the old wiring. That's
  correct for user edits and wrong for untouched defaults. Needs either a "regenerate defaults"
  action or a flag marking which tokens a human actually touched. The workaround is deleting
  `brands/<slug>.json` and letting it rebuild. **This has cost real time repeatedly** — it is the
  main reason exports drift from the code, since the app exports the saved brand, not the preset.
  Fix it before it bites again.
- **Undo history is memory-only.** A browser refresh clears it. `brands/.backup/<slug>.json` is the
  second line of defence and holds only the immediately-previous version. A short on-disk history
  would close the gap.
- **`client-zip` is in the plan but not installed** — the download path writes one file at a time
  instead of a zip.
- **`migrateConfig` fills missing blocks but does not validate their contents.** A file with
  `radius: "nonsense"` still gets through. `zod` was planned for this and isn't installed yet.
- **Preview contexts are `style={{}}` objects, not CSS**, which is fine for now but will not
  translate directly to the static guideline page (Phase 6) — it needs real stylesheets.
- **`DARK_LIFT` interacts with `pickFill` in a way worth revisiting.** The lift decides where the
  dark fill search starts; a very light or very dark seed may deserve a different starting point.

## Deliberately refused

Component tokens, Figma sync, font-file management, per-brand preview content, hosting/auth.
See `DECISIONS.md` #2 and #10 before reopening any of these.
