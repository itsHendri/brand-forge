# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**Phase 5 — multi-brand.** A brand switcher over `brands/*.json` (`listBrands()` in
`persistence.ts` already exists and is unused), and "new client from Hendri template" — which is
just a config clone with a new slug. Then the Dashboard and MarketingHero preview contexts, so the
canvas exercises layout as well as components. Then Phase 6, the static guideline page.

Panels are all built; `ColorPanel.tsx` and `ShapePanel.tsx` are the patterns to copy if another one
is needed. Every panel mutates through `useStore().patch()`, which keeps autosave automatic.

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
  `brands/<slug>.json` and letting it rebuild. (Distinct from the *missing-block* case, which
  `migrateConfig` now handles.)
- **A stray click can write a real edit.** The colour swatches are `<input type="color">`, so an
  accidental interaction autosaves a changed seed. It happened twice during browser automation this
  session. Worth an undo stack, or at least a "revert to preset" action.
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
