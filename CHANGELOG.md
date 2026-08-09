# Changelog

Keep-a-Changelog style. Newest first.

## [Unreleased]

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
