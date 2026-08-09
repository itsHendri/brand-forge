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

### 1. The settled batch — where Carbon and Atlassian independently agree

Both systems make these tokens rather than rules, which is about as settled as the evidence gets.

- **An inverse / on-fill family.** This closes the `--on-brand` question that was open below. Carbon:
  `$text-on-color`, `$icon-on-color`, `$border-inverse`, `$focus-inverse`, `$link-inverse`.
  Atlassian makes `inverse` a first-class colour role for "UI elements that sit on bold emphasis
  backgrounds". Both cover **icon and focus too**, not just text and border as previously planned.
  Per-role `-foreground` already handles text on a fill; what's missing is border, ring, icon and
  secondary text.
- **A link family** — `--link`, hover, visited, and an inverse. Carbon ships eight link tokens and
  its `$link-primary` is *the same blue* as `$interactive`; it still names them separately, because
  `$link-inverse` has to diverge. That is our documented dark-mode trap (`--primary` as body-copy
  link, Lc −28.7) with the industry answer attached.
- **Focus is three tokens, not one.** `$focus`, `$focus-inset` (a contrast border paired with focus,
  for when one colour can't work on both grounds) and `$focus-inverse`. Acceptance run 4 found focus
  invisible on a brand field because `--ring` **is** `--primary`; this is the named fix.
- **Opacity is two tokens** — Atlassian ships exactly `opacity.disabled` and `opacity.loading`. The
  gap list phrased this as a project. It isn't.
- **Skeleton is two tokens** — Carbon separates `$skeleton-element` from `$skeleton-background`.
  This was not previously on the gap list at all, and every dashboard needs it.
- **A scrim** — Carbon `$overlay` is black at 60%; Atlassian has a blanket token group.

### 2. Make the state tokens transparent — a defect the comparison exposed

Not previously on any list. Carbon's `$background-hover` is **Gray 50 at 12%, transparent**, so it
works on any surface. Ours are opaque aliases to neutral steps:

```
--background: var(--neutral-100);  --surface: var(--neutral-50);  --muted: var(--neutral-200);
--state-hover: var(--neutral-200);
```

`--state-hover` is calibrated for exactly one surface. On `--surface` it is a three-step grey slab,
and on `--muted` it is **the same colour** — a hover that does nothing. Atlassian states the
principle directly in its `elevation.surface.sunken` vs `color.background.neutral` note: opaque
tokens darken in both modes, transparent ones adapt to whatever they sit on.

Switching the four `--state-*` tokens to alpha fixes hover on every surface without a hover token
per layer, and it is why "a clickable card" is not currently buildable from this system.

### 3. Rename the elevation model on Atlassian's scheme

Decided 2026-08-09 — see `DECISIONS.md` #21. `--surface-sunken / --surface / --surface-raised /
--surface-overlay`, each with a paired shadow. Also fixes two existing faults: `--shadow-overlay` has
no matching surface, and `--surface` and `--surface-raised` are **the same value in light mode**, so
"raised" is currently shadow-only.

### 4. Z-index and app-shell interiors

Atlassian ships an actual z-index table (100 nav → 500 blanket → 510 modal → 600 flag → 800 tooltip)
with the elevation level each layer sits at. The gap list says every acceptance run invents z-index;
there is now a proven shape to copy. Sidebar and column widths go in the same pass.

### 5. Then run the acceptance test, on an app shell

Brief it on an app shell — the shape never yet used, and the one these tokens are meant to unblock.

### Cost to watch

Roughly 25 new tokens, 57 → low 80s. The docs are at ~11.3k against an 18k budget, so there is room,
but the token-budget meter is the thing to watch as the tables grow.

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

### Cheap wins if you want a short session instead

- **`--on-brand` tokens** (see below) — small, and turns a rule that has been got wrong twice into
  something that cannot be.
- **The stale-export trap** under *Known rough edges* — it has cost time in three separate sessions
  and is the reason exports drift from the code.

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
- **Link colour in body copy.** There is no `--link`, and `--primary` — the obvious substitute — is
  unreadable as text in dark mode (Lc −28.7). Documented as a trap; still not solved. **Planned —
  step 1 above.**
- **App-shell interiors.** Sidebar and column widths, header heights, z-index, minimum table widths.
  `--container-*` bound the page frame, not what's inside it. Every run has invented these.
  **Planned — step 4 above.**
- **Card emphasis.** No token or recipe for "this is the recommended plan". `--primary` as a border
  measures Lc 24.7 against `--surface` in dark, just under the visible bar. Atlassian's answer is
  the raised elevation plus its paired shadow, used "sparingly, limited to one focal point" — which
  step 3 makes available.
- **A scrim.** Opacity isn't modelled, so a real modal backdrop can't be built from these tokens.
  **Planned — step 1 above** (scrim, plus `opacity.disabled` / `opacity.loading`).
- **Skeleton colours.** Not previously listed. Carbon separates the element from its container;
  nothing here models either. **Planned — step 1 above.**
- **A wordmark treatment.** Even with a mark defined, nothing says which role, weight or colour the
  brand name takes when set in type.
- **Standalone font weights**, **opacity**, **blur** — not modelled at all.
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
