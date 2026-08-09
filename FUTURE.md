# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**Asset upload.** A brand names `"Geist"` and ships a Google Fonts `<link>`; it cannot yet carry a
logo or a font file. Storing assets next to the brand (`brands/<slug>/` instead of
`brands/<slug>.json`) is the change that makes a brand genuinely self-contained and portable to a
client. This is the last thing standing between the current tool and "forge a whole identity".

Then a **marketing context** (the one build shape the canvas still lacks — display type at scale,
a hero, long-form copy), and the **static guideline page**.

The canvas now has three contexts (Components, Surfaces, Dashboard) sharing `preview/kit.tsx`.
Add new ones there; every kit component is the exported recipe rendered literally, which is what
keeps the canvas honest about the docs. Panels are all built — `ColorPanel.tsx` and
`ShapePanel.tsx` are the patterns to copy. Everything mutates through `useStore().patch()`, which
keeps undo and autosave automatic.

**Open question for Hendri:** he offered to find Figma design-system references. Figma files won't
transfer directly (this tool isn't in Figma). What would help is published *token documentation*
with strong surface and elevation taxonomies — examples of how other systems name and demonstrate
their surface ladder, not component libraries.

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
