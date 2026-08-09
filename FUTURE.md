# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**Phase 6 — the preview canvas.** This is the half of the tool that hasn't had a real pass, and
it's what Hendri keeps gesturing at when he mentions uicolors. Concretely, from his feedback:

- **More surfaces, shown as surfaces.** A dedicated section laying out `background` / `surface` /
  `surface-raised` / `muted` against each other, so the ladder is visible rather than inferred.
- **Elevation as its own section** — the shadow scale, and the fact that dark mode swaps shadows
  for a lighter surface plus a ring. Currently that rule is documented and never demonstrated.
- **More contexts.** Dashboard and MarketingHero were planned and never built; a settings/form
  context would exercise inputs properly. The acceptance-test pages are decent references for what
  a real page needs.
- **More components per context** — the ComponentsSheet is thin next to what the docs describe.

Then asset upload (logo, font files stored next to the brand), and the static guideline page.

Panels are all built; `ColorPanel.tsx` and `ShapePanel.tsx` are the patterns to copy. Every panel
mutates through `useStore().patch()`, which keeps undo and autosave automatic.

**Open question for Hendri:** he asked about referencing Figma design-system files. Figma files
won't transfer directly (this tool isn't in Figma), but published *token documentation* with strong
surface and elevation taxonomies would — the useful thing to collect is examples of how other
systems name and demonstrate their surface ladder, not component libraries.

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
