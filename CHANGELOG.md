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

### Fixed — 2026-08-08

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
