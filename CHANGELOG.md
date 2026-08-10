# Changelog

Keep-a-Changelog style. Newest first.

## [Unreleased]

- **An editorial layer.** Every component recipe was app-shaped, so a long-form content page had
  nothing behind roughly seventy per cent of what it needed — and the gap list did not admit it. The
  reference gained an **Editorial** section (paragraph rhythm, headings, lists, blockquote, figures
  and captions, inline and fenced code, button sizes, the container gutter) and three tokens:
  `--inverse-muted-foreground` (a footer had one text colour for four levels), `--container-intro`
  at 52rem (nothing sat between the reading measure and the page frame), and a documented job for
  `--shadow-sm`, which previously had none. `DECISIONS.md` #33.
- **`--text-display`'s floor rises to 2.5rem.** The two fluid roles were designed in isolation and
  converge as the screen narrows — 1.56× apart at 1280px, 1.29× at 390px — so a hero was only a
  third larger than a section heading on a phone. Now 1.43×.
- **A placeholder for media must be `--muted`, not `--surface-sunken`** — sunken is opaque and
  collapses into `--background` in dark mode, so the block disappears and only its border survives.
- The doc budget is raised to 24k and reframed in the code as a smoke alarm rather than a limit.

- **Acceptance run 5 (app shell) — eight documentation defects fixed**, four of them introduced by
  the same session's token work hours earlier. The worst: the "what this system does not define" list
  still claimed there was no sidebar width, header height, z-index scale or table minimum, forty
  lines above the tables defining all four. Also fixed — a primary button told to use `--ring`, which
  in light mode *is* its own fill; dialog supporting text pointed at the weaker of two colours that
  both fail on `--surface-overlay` in dark; "dark mode replaces shadows with a ring" (only
  `--shadow-sm` does); a documented sticky table header that is impossible under the mandated scroll
  wrapper; "layer the wash over its surface" stated three times and never shown; a `@theme` block
  claimed to forward token groups it cannot; and "set every fill to `currentColor`" flattening a
  two-tone wordmark. Every number the run checked was exact — the defects were all prose.
  `DECISIONS.md` #29.

- **A stacking order and an app frame**, the last two things every acceptance run had to invent.
  Seven z layers (`--z-sticky` 100 → `--z-tooltip` 600) and five shell dimensions (`--shell-header`,
  `--shell-sidebar`, `--shell-sidebar-collapsed`, `--shell-aside`, `--shell-table-min`). Two values
  carry an argument rather than a convention: `--z-modal` sits ten above `--z-scrim` because a dialog
  belongs immediately on top of its own backdrop, and `--z-toast` outranks `--z-modal` because a
  confirmation behind the dialog that caused it is invisible when it matters. `DECISIONS.md` #28.
- **Fixed, generally this time: a block that gains a field no longer arrives `undefined`.**
  `migrateConfig` merged blocks but replaced each wholesale, so a saved brand crashed at first render
  when the schema grew — the same failure three times now (`layout` absent, `shadows` changing shape,
  `layout` gaining `zLayers`/`shell`). Blocks merge key by key, and missing keys are reported.

- **The elevation ladder is five named levels** — `--surface-sunken`, `--background`, `--surface`,
  `--surface-raised`, `--surface-overlay` — and shadows are renamed to pair with them (`--shadow-sm`,
  `--shadow-raised`, `--shadow-overlay`; `md` and `lg` are gone). An overlay shadow with no overlay
  surface was the orphan that started this. Both modes run out of ramp at opposite ends, so light
  collapses raised and overlay onto `surface` and dark collapses sunken onto `background`; each is
  distinct in the other mode, and both are measured rather than chosen. `DECISIONS.md` #27.
- **`--muted` is a translucent wash.** The dark ladder uses every step the ramp can carry
  (950/900/800/700 — `neutral-600` fails body contrast at Lc 68), leaving no opaque value for a quiet
  fill that does not collide with a surface. It adapts to whatever elevation it lands on, which is
  Atlassian's own answer to this problem.
- **Text levels can no longer silently merge.** `pickAgainst` takes an `exclude` list, so a level
  that would resolve to the same step as the one above it takes the next passing step instead. Both
  supporting-text tokens landed on `neutral-100` while the ladder was being fitted, one step off the
  body ink, with nothing to catch it.
- **Fixed: a renamed shadow level silently lost its dark mode.** `migrateConfig` filled missing
  blocks but never reconciled one whose shape had changed, so a saved brand kept `md`/`lg` and got no
  dark override at all — `DARK_SHADOWS` is keyed by name. Unknown levels are dropped, missing ones
  restored, and a test now pins that light and dark emit the same shadow names.

- **The interactive states are translucent washes**, and their alphas are solved rather than chosen.
  The four `--state-*` tokens were opaque aliases calibrated for one surface each — `--state-hover`
  and `--muted` were *the same colour*, so a hovered row on a muted surface was identical to a
  resting one, and a clickable card was not buildable from this system. A mid grey at low alpha
  darkens every light surface and lightens every dark one, so one token now covers all four grounds.
  `active` is solved as the strongest wash that keeps body text readable everywhere, `hover` as the
  gentlest that is still visible everywhere; light hover lands on 0.10 against Carbon's hand-tuned
  0.12. `DECISIONS.md` #26.
- **The contrast audit can measure a translucent token.** `CONTRAST_PAIRS` gained an optional `over`,
  and `composite()` blends a wash onto its ground before measuring — sixteen state pairs where there
  used to be two. A new `channelShift()` covers the one question APCA cannot answer, since it clamps
  everything below its noise floor to zero and so cannot tell "subtle" from "invisible".
- **Fixed: DTCG dropped the alpha.** Translucent tokens were exported as plain aliases, handing
  Figma and Style Dictionary an opaque colour. They now state their own value with the alpha in it.

- **Eleven tokens taken from Carbon and Atlassian**, 57 → 68. An inverse region (`--inverse`,
  `--inverse-foreground`, `--inverse-border`) that means *opposite to the current mode*, so on a
  dark page the chip is light. Links (`--link`, `--link-hover`, `--link-inverse`) measured as body
  text, closing the trap where `--primary` as a link reads at Lc −28.7 in dark. Two more focus rings
  — `--ring-inverse` for a coloured ground and `--ring-inset` as the companion hairline — which turns
  acceptance run 4's defect from a rule into a token. A `--scrim`, `--skeleton` on
  `--skeleton-surface`, and exactly two opacities. Every one is covered by a contrast pair and the
  preset still reports zero warnings.
- **A link must be underlined, and that is now a rule.** `--link` and `--foreground` sit at the same
  lightness in both modes and differ only in hue, so in greyscale there is no link at all. The
  palette cannot fix it, so the system states the requirement instead — a new `underline-links`
  polish rule, and the same warning wherever the token is documented.
- **`SemanticRef` can carry an `alpha`**, and a ref that does emits a literal `oklch(L C H / a)`
  instead of aliasing its primitive — the one documented exception to `DECISIONS.md` #6, because a
  `var()` has no alpha channel to bend. The docs learned about it too: the token table printed
  `#1f262d` for `--scrim`, which is a lie somebody would build an opaque backdrop from.
- **Fixed: dark mode in the preview had been showing light values.** The canvas set `data-theme` on
  a wrapper div while the injected stylesheet scoped its dark block to `:root[data-theme="dark"]`,
  so the selector matched nothing — since the iframe landed, a session and a half ago. Every test
  stayed green throughout; it was caught by rendering the new inverse token and seeing it come back
  dark on a dark page. `DECISIONS.md` #25.

- **A brand persists only what a human changed.** `brands/*.json` stored all 57 resolved semantic
  tokens, which froze every saved brand at whatever the generator produced the day it was written —
  so improving `defaultSemanticMapping` reached new brands and no others, and the app exports the
  saved brand. `color.semantics` becomes `color.semanticOverrides`: sparse, per token, per mode.
  Everything untouched is regenerated on load by the new `semanticDefs()`. Overriding is per-mode,
  an override cannot rewrite a description, and one naming a token that no longer exists is a
  warning rather than a silent drop. The Semantics panel says how many tokens are pinned and gives
  each a ↺ to put it back on the seeds. `hendri.json` fell from 40KB to 14.7KB with zero hand edits
  found. `DECISIONS.md` #22.
- **`npm run export`**, and a test that fails when `exports/` is stale. The export could only be
  written from a browser, so it drifted from the code repeatedly — an acceptance run could critique
  documentation the engine no longer produced. Regeneration is now headless and goes through the
  same path the app does; `src/export/freshness.test.ts` compares every generated file against disk
  and names the fixing command in each failure. It caught a stale `brand.json` on its first run.
  `DECISIONS.md` #23.
- Docs gained a **Brand assets** section (the mark and the typefaces, including the family-name trap
  and the keep-assets-beside-the-stylesheet warning) and the **on-brand rule** — a control on a
  coloured fill takes that fill's own `-foreground` for text and border. The outline recipe is now
  marked as assuming a neutral ground.
- **Marketing context** — hero at display scale, feature grid, stat row, long-form copy at the prose
  measure, a full-width brand band, and logo lockups in the header and footer. The context that
  tests whether the display role and the brand colour carry a page rather than a component sheet.
- The preview width selector gained a **base (390px)** option. Mobile-first means everything below
  the smallest breakpoint is where the design starts, and it was the one width that could not be
  selected, because it isn't a breakpoint.
- **Syne** is the display face, paired with Space Grotesk. Hosted on Google Fonts, so it links
  rather than ships. Alpha Lyrae — the real face on hendri.design — is licensed and deliberately
  not bundled; a licensed font was briefly pulled from the live site and wired into the export, and
  has been removed from the working tree and from git history.
- **Fluid type.** `--text-display` and `--text-heading-lg` scale across 390–1280px via `clamp()`,
  keeping a `rem` term so zoom still works. Everything else holds still.
- **`display` is a family slot**, not a role borrowing the sans — Alpha Lyrae is a different
  typeface. A type role is now documented as five properties; the family column was missing, which
  meant the display face silently rendered in the body font.
- **The preview canvas is an iframe.** A constrained `div` is not a viewport: `vw` and media queries
  resolved against the browser window, so pinned widths had been showing the right columns and the
  wrong type size since the selector shipped.
- Hendri's real brand: Ember `#f1760f` (read off the live site's token layer), Space Grotesk, and
  the wordmark lifted from hendri.design as a themeable two-colour mark.
- Asset upload — logo and font files stored in `brands/assets/<slug>/`. Uploaded fonts become
  `@font-face` rules in the preview and the exported stylesheet, and ship with the export as real
  bytes. An SVG logo is stored inline so its ink follows the foreground token and inverts in dark
  mode; a raster logo is stored as a file and used as-is.
- Preview canvas rebuilt around a shared component kit (`preview/kit.tsx`), with three contexts:
  **Components**, **Surfaces & elevation**, and **Dashboard**. Surfaces are shown nested so the
  ladder is judgeable rather than inferred, and elevation is its own section demonstrating the
  dark-mode swap from shadow to ring.
- Undo/redo with ⌘Z / ⇧⌘Z, a brand switcher with duplicate / new-from-template / delete, and an
  on-disk backup of the version each save replaces.

### Added — 2026-08-08 (session 1)

- OKLCH scale generator: shared lightness targets across hues, chroma bell, hue rotation centred on
  the anchor, per-step gamut clamping, and seed warping so a typed colour appears verbatim.
- Contrast-aware default semantic mapping — 49 tokens derived from seeds alone, with every text
  colour chosen by measuring APCA rather than by step index.
- `resolveTokens` pipeline emitting a single `declarations` array shared by the preview and all
  exporters.
- APCA contrast validation (WCAG 2 reported alongside) with a suggested fix per failure.
- App at `localhost:5300`: colour panel with per-step overrides, semantics panel, live preview
  canvas, light/dark, warnings drawer with one-click fixes, export dialog with a token-budget meter.
- Vite dev-server middleware acting as the file sidecar — brand read/write and export-tree write.
- Export: `SKILL.md`, `DESIGN_SYSTEM.md`, `tokens.css` (+ Tailwind v4 `@theme`), DTCG `tokens.json`,
  `brand.json`.
- `lint:preview-colors` — fails on any colour literal in a preview context.

- All seven editing panels. Brand (identity, voice, deviations), Type (families, font links, role
  table), Space & shape (radius knob with derived steps, a live concentric-radius demo driven by a
  padding slider, and a spacing editor that refuses off-grid values), Motion (playable durations and
  easings, enter and exit side by side), Rules (craft toggles wired to SKILL.md).

- **Breakpoints and container widths** — the two largest gaps the acceptance test found. Four
  mobile-first min-widths and four named max-widths, a Layout panel to edit them, a documented
  layout section with the media-query trap spelled out, and DTCG output. The preview can be pinned
  to any breakpoint, at its real width, so the responsive rules are visible rather than asserted.
- `migrateConfig` — a loaded brand is merged over a complete default block by block, so adding a
  field to `BrandConfig` no longer crashes every file written before it existed.

### Fixed — 2026-08-09 (fourth acceptance run)

- **Focus was invisible on a brand field.** `--ring` and `--primary` are the same value in light
  mode, so the mandated `outline: 2px solid var(--ring)` measured Lc 0 on exactly the section the
  docs flag as dangerous. The on-brand rule now covers the ring.
- **Four of nine type roles shipped no `letter-spacing`**, so copying the documented
  four-property pattern produced `letter-spacing: var(--undefined)` — invalid, dropped silently.
  Every role emits it now, `normal` when unset.
- The contrast claim still over-reached: `--border-subtle` and `--foreground-tertiary` are defined
  as below the visible threshold and are never validated. The section now names what is checked and
  what is exempt, and defines "large text", which two thresholds depended on.
- The concentric rule contradicted itself on buttons — a full-width control is flush and follows
  the formula; an auto-width one keeps its radius.
- Copy on a brand field is limited to `body-lg` and up; `--primary-foreground` is validated as a
  label colour and nothing smaller passes there.
- `tokens.css` warns that `--color-*` exists only inside the `@theme` block.
- Declared four more gaps rather than leaving them to be discovered: card emphasis, a scrim, a
  wordmark treatment, and the hover wash reading as a darkening on raised surfaces in dark.

### Fixed — 2026-08-08 (second acceptance run)

- **Every status border was invisible.** `--{status}-border` sat one step from `--{status}-subtle`,
  measuring Lc 0 — an outline nobody can see. Borders are now picked by measuring against the fill
  they divide, like text is.
- **The contrast claim was false.** It counted only `fail`-level warnings; non-text boundaries
  report as `warn`, so fourteen were being ignored while the docs said every pair cleared.
- **Supporting text failed on raised surfaces.** Text colours were solved against the page, so
  `--foreground-secondary` on a dialog measured Lc 48.7. `surface-raised` is now a checked ground,
  and the two supporting colours are scoped to the surfaces they serve.
- **Status colours had no interactive states.** The docs prescribed destructive buttons and made
  their hover inexpressible. `--{status}-hover` and `--{status}-active` now exist (57 tokens, was 49).
- The concentric rule claimed nested children "just aren't flush" — in a form, most are. It now says
  square is the expected outcome, and which recipe wins when they disagree.
- Inputs no longer specify `--surface` (the card's own colour) as their fill.
- Added a neutral badge role; `--secondary-subtle` is invisible against a card.
- Flagged `--primary` as unreadable link text in dark mode (Lc −28.7).
- The "does not define" list gained six gaps it hadn't admitted to.

### Fixed — 2026-08-08

- **Tailwind's `lg:` variants silently never applied.** The `@theme` block emitted
  `--breakpoint-lg: var(--breakpoint-lg)`, which Tailwind compiles into
  `@media (width >= var(--breakpoint-lg))` — invalid CSS, dropped without a warning. Breakpoints now
  ship as literal values. Found by compiling the exported stylesheet with a real Tailwind v4 build;
  the docs had warned about this exact trap while the export walked into it.
- **The preview hardcoded a `980px` page width** — the same invented value the acceptance test
  complained about. It now uses `--container-page`, and its intro copy uses `--container-prose`.

Found by the acceptance test (a subagent building from the exported docs alone):

- **Every component recipe told readers to write `font: var(--text-label)`** — invalid CSS that
  browsers drop silently, producing an unstyled element with no error. Recipes now set the four
  properties individually, and the type table names the companion `--text-*--line-height` tokens
  instead of printing their values as prose.
- **`tokens.css` shipped a `prefers-color-scheme` block while the docs claimed dark mode was an
  attribute.** On a dark-preference OS that renders dark with no attribute set, and a toggle that
  removes the attribute can never return to light. The media block is now opt-in.
- **The card recipe prescribed a border and a shadow**, which the craft rules forbid in the same
  document; `--shadow-sm` carries its own hairline layer, so cards drew a doubled edge — worst in
  dark mode, where the shadow is a ring. Cards are border-only; floating surfaces are shadow-only.
- **The outline button was filled with `--surface`**, making it invisible inside a card. Now
  transparent, so it works on whatever it sits on.
- **Labels on solid fills picked the quietest passing neutral**, reading as washed grey on a
  saturated button. They now take the strongest.
- **`--foreground-secondary` was byte-identical to `--muted-foreground`**, so a documented hierarchy
  was unfalsifiable. It's now held to the large-text bar, which makes it a genuine step and explains
  why smaller text uses the darker token.
- **`--surface-raised` collided with `--muted` in dark and with `--surface` in light.** The dark
  collision was a bug (fixed); the light one is by design and is now explained in the token's own
  description.
- Docs now list tokens that share a value, and state what the system deliberately does not define.

Found by tests:

- **Base chroma was solved per-mode**, which made dark ramps *more* chromatic than light ones — the
  opposite of what dark mode needs. Both modes now solve against the light ramp, with dark applying
  its own bell plus a global trim.
