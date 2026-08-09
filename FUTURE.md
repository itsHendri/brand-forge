# Future

Start here next session. Read `STATUS.md` first for where things actually stand.

## Immediate next step

**Close the token gaps, using Carbon and Atlassian as the reference.** Hendri named IBM Carbon and
Atlassian as his two favourite systems on 2026-08-09; both were read in full (core token tables,
colour roles, elevation model) and both answer most of the *Gaps* list below. Phase 6 moves behind
this — see the reasoning under *After that*.

### 0. ~~First, stop the drift~~ — done 2026-08-09

Both halves shipped. `brands/*.json` now stores only `color.semanticOverrides` — the deltas a human
actually made — and everything else regenerates on load, so step 1's new tokens will reach the saved
brand without anyone deleting a file (`DECISIONS.md` #22). `npm run export` regenerates `exports/`
headlessly and `src/export/freshness.test.ts` fails when it goes stale (#23).

Verified rather than assumed: the one real brand file had drifted in zero of its 57 tokens, so the
format conversion froze nothing, and it shrank from 40KB to 14.7KB.

**What this means for step 1:** add a token to `defaultSemanticMapping`, and it appears in the
preview, in `brands/hendri.json` and in `exports/hendri/` without any manual step. If a test reports
a stale export, run `npm run export`.

### 1. ~~The settled batch~~ — done 2026-08-09

All of it shipped. 57 → 68 semantic tokens, plus two opacities. Every one is chosen by measurement
and covered by a contrast pair, and the shipped preset still reports zero warnings.

- **Inverse region** — `--inverse`, `--inverse-foreground`, `--inverse-border`, plus `--link-inverse`
  and `--ring-inverse`. Inverse means *opposite to the mode*, so on a dark page the chip is light.
- **Links** — `--link`, `--link-hover`, `--link-inverse`. Measured as body text against the hardest
  flat surface, which is what `--primary` never was.
- **Focus** — `--ring-inverse` for a coloured or inverted ground, `--ring-inset` as the companion
  hairline. Acceptance run 4's defect is now a token rather than a rule.
- **Opacity** — `--opacity-disabled`, `--opacity-loading`. Two, and neither is for live text.
- **Skeleton** — `--skeleton` on `--skeleton-surface`, measured against each other.
- **Scrim** — `--scrim`, the one translucent token (`DECISIONS.md` #24).

Two findings came out of building it, both worth knowing:

**A link cannot rely on colour here.** `--link` and `--foreground` sit at the *same lightness* in
both modes and differ only in hue, so in greyscale there is no link at all. The palette cannot fix
it — only the two lightest primary steps clear the body bar on the darkest flat ground in dark mode.
So the system mandates an underline instead, as a polish rule (`underline-links`) and in every place
the token is documented.

**Dark mode in the preview had been broken since the iframe landed.** See `DECISIONS.md` #25 — the
canvas rendered light values under a dark label for a session and a half, and every test stayed
green. Fixed.

### 2. ~~Make the state tokens transparent~~ — done 2026-08-09

All four `--state-*` tokens are translucent washes now, and their alphas are **solved against the
palette** rather than picked: `active` is the strongest wash that keeps body text at Lc 75 on every
surface, `hover` the gentlest that still visibly shifts every surface, `disabled` their midpoint,
`selected` the same solve on the primary ramp. See `DECISIONS.md` #26.

Worth knowing before step 3 touches the surfaces: **dark mode is squeezed from both directions by
`surface-raised`.** It is the lightest ground, so a lightening wash eats the foreground's contrast
fastest — and it is nearest the wash on the ramp, so it shifts least. Dark tolerates less wash at
the top (0.18 vs 0.24) and needs more at the bottom (0.12 vs 0.10). Renaming or re-pointing the
surface ladder will move both numbers; the solver will follow, but look at the result.

The audit grew to match: `CONTRAST_PAIRS` gained an `over`, and a wash is composited onto each
ground before being measured. Sixteen pairs where there were two.

### 3. ~~Rename the elevation model on Atlassian's scheme~~ — done 2026-08-09

Five levels now: `--surface-sunken / --background / --surface / --surface-raised / --surface-overlay`,
with shadows renamed to pair by name (`sm`, `raised`, `overlay` — `md` and `lg` are gone). See
`DECISIONS.md` #27 for what the palette refused to give.

The short version: both modes run out of ramp at opposite ends, so light collapses raised and overlay
onto `surface` (shadows carry it) and dark collapses sunken onto `background`. Dark also has a hard
ceiling — `neutral-700` is Lc 79 and `neutral-600` fails at 68 — so 950/900/800/700 is the whole
ladder and there is no fifth level to be had.

That left no opaque step for `--muted`, so **`--muted` is now a translucent wash** (Hendri's call).
Anything nesting a quiet fill inside a surface should layer it rather than replace the surface.

### 4. ~~Z-index and app-shell interiors~~ — done 2026-08-09

Seven stacking layers (`--z-sticky` 100 → `--z-tooltip` 600) and five frame dimensions
(`--shell-header`, `--shell-sidebar`, `--shell-sidebar-collapsed`, `--shell-aside`,
`--shell-table-min`). Both closed sets, both carrying their reasoning in the notes. See
`DECISIONS.md` #28.

The Dashboard context now uses them instead of the numbers it had invented, which is the honest test
of whether they are the right ones.

### 5. Then run the acceptance test, on an app shell

Brief it on an app shell — the shape never yet used, and the one these tokens are meant to unblock.

### Cost so far — and the budget is now the binding constraint

Steps 0–4 took the system from 57 to 70 semantic tokens plus the frame, and the docs from ~11.3k to
**~15.2k against an 18k budget — 84%**. That is no longer comfortable.

Nothing left in the plan adds much: step 5 is an acceptance run, and Phase 6 is a separate artifact.
But the next person to add a token family should look at the meter first, and the honest fix when it
runs out is not a bigger budget — it is that `DESIGN_SYSTEM.md` has grown a lot of prose that an
acceptance run has never been asked to justify. Splitting the reference so `SKILL.md` points at two
smaller files is the obvious move, and nobody has tested whether it helps or hurts.

## After that — Phase 6

**The static guideline page** — the one output the tool still doesn't produce, and the artifact a
client actually wants. A second Vite entry SSG-rendering the preview contexts plus the token tables
into `exports/<slug>/guidelines/index.html`, so a brand can be handed over as a page rather than a
folder of Markdown.

It was the immediate next step until 2026-08-09 and moved behind the token work for one reason: it
is a presentation layer over the system, and the system still has roughly ten documented holes in
it. Building a page that documents a system with ten holes just publishes the holes.

Two things make it more valuable than when it was first planned: the wordmark exists, so it can show
the real mark; and the preview kit already renders every documented recipe, so the page is mostly a
second consumer of `preview/kit.tsx` rather than new design work. (The real *typeface* is a separate
matter — see custom font upload below.)

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

## One decision still open from the marketing context

(~~Fluid type~~ — done 2026-08-09. `display` and `heading-lg` scale across 390–1280px; see
`DECISIONS.md` #18, and #19 for the iframe canvas it forced.)

(~~A control on a brand field has a rule but not a token~~ — closed 2026-08-09. Carbon and Atlassian
both make this a token family rather than a rule, and both cover icon and focus as well as text and
border. It is now step 1 of the immediate next step above.)

**Is Ember the button colour, or is the darkened stand-in?** Both references treat "a bold fill that
cannot carry white text" as solved: Atlassian gives bold yellow its own `warning.inverse` tokens
rather than darkening the fill. We darkened instead — `--secondary` resolves to `#cc6000` while the
ramp keeps Ember `#f1760f` at its anchor. Hendri's call, deferred until it can be seen: build the
inverse tokens in step 1, render real `#f1760f` with a dark foreground beside the current `#cc6000`
with a white one, and choose with both in front of you. Do not settle this by argument.

## Gaps the acceptance test exposed

A subagent built a page from the exported docs and listed what it had to invent. The docs now
*declare* these gaps honestly, but declaring is not solving:

- ~~**Breakpoints**~~ and ~~**container widths**~~ — done. See `DECISIONS.md` #10 and #11.
- **Icon box size.** The craft rules specify stroke weight to a fraction of a pixel and never the
  box. They also cover weight 400 and 600 only, and every button uses `label` at weight 500.
- ~~**Link colour in body copy.**~~ Done — `--link`, `--link-hover`, `--link-inverse`, plus a polish
  rule requiring the underline, because the colour alone is not distinguishable in greyscale.
- **App-shell interiors.** Sidebar and column widths, header heights, z-index, minimum table widths.
  `--container-*` bound the page frame, not what's inside it. Every run has invented these.
  **Planned — step 4 above.**
- **Card emphasis.** No token or recipe for "this is the recommended plan". `--primary` as a border
  measures Lc 24.7 against `--surface` in dark, just under the visible bar. Atlassian's answer is
  the raised elevation plus its paired shadow, used "sparingly, limited to one focal point" — which
  step 3 makes available.
- ~~**A scrim.**~~ Done — `--scrim`, the one translucent token (`DECISIONS.md` #24).
- ~~**Skeleton colours.**~~ Done — `--skeleton` on `--skeleton-surface`.
- **A wordmark treatment.** Even with a mark defined, nothing says which role, weight or colour the
  brand name takes when set in type.
- **Standalone font weights** and **blur** — not modelled at all. (~~Opacity~~ is, as exactly two
  tokens: `--opacity-disabled` and `--opacity-loading`.)
- **Reduced-motion duration.** The rule says "cut to near zero"; the smallest token is 100ms.
- **A type step between 1.5rem and 2.25rem.** A price or a stat lands awkwardly between them.
- **Theme persistence.** The attribute is defined; storing the choice, seeding from the OS
  preference and avoiding a first-paint flash are left to the implementer. Every run built its own.

## Known rough edges

- (~~Saved brands don't pick up improved defaults~~ and ~~the export can silently go stale~~ — both
  fixed 2026-08-09. `DECISIONS.md` #22 and #23.)
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
#20 before reopening any of these.

(Font-file management was on this list and is no longer refused — it shipped, see `DECISIONS.md`
#14 and #15.)
