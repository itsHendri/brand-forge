# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**The static guideline page** (Phase 6) — the one output the tool still doesn't produce, and the
artifact a client actually wants. A second Vite entry SSG-rendering the preview contexts plus the
token tables into `exports/<slug>/guidelines/index.html`, so a brand can be handed over as a page
rather than a folder of Markdown.

Two things make it more valuable than when it was first planned: assets exist, so it can show the
real mark in the real typeface; and the preview kit already renders every documented recipe, so the
page is mostly a second consumer of `preview/kit.tsx` rather than new design work.

One known obstacle, already logged below: **preview contexts are inline `style={{}}` objects, not
CSS.** SSG output needs real stylesheets, so either the kit grows a class-based mode or the
generator serialises the style objects. Decide that first — it shapes the whole phase.

### Before shipping it to anyone

Run the acceptance test again (`doc-acceptance-test` skill). Four runs in, it has found real defects
every single time, including two that had shipped. Brief it on a shape not yet used — a dashboard or
an app shell — since each new shape has surfaced a different class of failure.

### Custom font upload, properly

The upload path works and nothing ships through it. What's missing is the *product* around it: a
face uploaded per family slot, weights detected or entered, and a clear statement in the export
about what is being redistributed. `--font-display` borrows the sans until then.

Rule to keep: **the tool bundles what a user uploads and never acquires a font on their behalf.**
See `DECISIONS.md` #17.

### Cheap wins if you want a short session instead

- **Fluid type** (decision 1 below) — bounded, self-contained, and visibly improves the phone case.
- **`--on-brand` tokens** (decision 2 below) — small, and turns a rule that has been got wrong twice
  into something that cannot be.
- **The stale-export trap** under *Known rough edges* — it has cost time in three separate sessions
  and is the reason exports drift from the code.

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

**2. A control on a brand field has a rule but not a token.** The composition rule is now documented
(*a control on a coloured fill takes that fill's own `-foreground` for text and border*) and the kit
has an `inverse` tone, so this is no longer a silent trap. The open question is whether it should be
**real tokens** — `--on-brand`, `--on-brand-border` — instead of a rule people have to apply. Rules
get followed less reliably than tokens do, and this one has already been got wrong twice. Cheap to
add if you want it; the argument against is that it is one more pair to keep contrast-checked.

## Gaps the acceptance test exposed

A subagent built a page from the exported docs and listed what it had to invent. The docs now
*declare* these gaps honestly, but declaring is not solving:

- ~~**Breakpoints**~~ and ~~**container widths**~~ — done. See `DECISIONS.md` #10 and #11.
- **Icon box size.** The craft rules specify stroke weight to a fraction of a pixel and never the
  box. They also cover weight 400 and 600 only, and every button uses `label` at weight 500.
- **Link colour in body copy.** There is no `--link`, and `--primary` — the obvious substitute — is
  unreadable as text in dark mode (Lc −28.7). Documented as a trap; still not solved.
- **App-shell interiors.** Sidebar and column widths, header heights, z-index, minimum table widths.
  `--container-*` bound the page frame, not what's inside it. Every run has invented these.
- **Card emphasis.** No token or recipe for "this is the recommended plan". `--primary` as a border
  measures Lc 24.7 against `--surface` in dark, just under the visible bar.
- **A scrim.** Opacity isn't modelled, so a real modal backdrop can't be built from these tokens.
- **A wordmark treatment.** Even with a mark defined, nothing says which role, weight or colour the
  brand name takes when set in type.
- **Standalone font weights**, **opacity**, **blur** — not modelled at all.
- **Reduced-motion duration.** The rule says "cut to near zero"; the smallest token is 100ms.
- **A type step between 1.5rem and 2.25rem.** A price or a stat lands awkwardly between them.
- **Theme persistence.** The attribute is defined; storing the choice, seeding from the OS
  preference and avoiding a first-paint flash are left to the implementer. Every run built its own.

## Known rough edges

- **Saved brands don't pick up improved defaults.** `brands/*.json` stores the resolved semantic
  mapping, so when `defaultSemanticMapping` gets smarter, existing files keep the old wiring. That's
  correct for user edits and wrong for untouched defaults. Needs either a "regenerate defaults"
  action or a flag marking which tokens a human actually touched. The workaround is deleting
  `brands/<slug>.json` and letting it rebuild. **This has cost real time repeatedly** — it is the
  main reason exports drift from the code, since the app exports the saved brand, not the preset.
  Fix it before it bites again.
- **The export can silently go stale**, and this is the same bug wearing a different hat. The app
  exports the *saved brand*; the tests compare against the *preset*. When they diverge, an
  acceptance run tests documentation the code no longer generates. **Before any acceptance run or
  handover, regenerate and verify** — drop this into a temp test file and delete it after:
  ```ts
  for (const f of buildExport(resolveTokens(hendriPreset)))
      expect(readFileSync(join("exports/hendri", f.path), "utf8")).toBe(f.content)
  ```
  A permanent version of this check is worth having; it wasn't added because it fails legitimately
  whenever someone edits a brand without re-exporting.
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

Component tokens, Figma sync, per-brand preview content, hosting/auth. See `DECISIONS.md` #2 and
#16 before reopening any of these.

(Font-file management was on this list and is no longer refused — it shipped, see `DECISIONS.md`
#14 and #15.)
