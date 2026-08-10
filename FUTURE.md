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

### 5. ~~Run the acceptance test, on an app shell~~ — done 2026-08-09

Run 5 built a multi-column shell and returned eight documentation defects, **four of them introduced
by this same session's token work hours earlier**. Every number it checked was exact; every defect
was prose. All eight are fixed with a test each. See `DECISIONS.md` #29.

The lesson worth keeping: **run this after a change, not before a release.** The worst finding — the
"what this system does not define" list still denying tokens added an hour before, forty lines above
the tables defining them — reads perfectly and is false. No amount of re-reading would have caught it.

**Brief the next run on something with heavy long-form content and imagery** — a marketing or docs
site with a hero, an article, and an embedded media block. That shape has never been run against the
current type scale, and it is the one that would exercise `--container-prose` nesting and the display
face, which the app shell never touched.

## Immediate: cut the duplication (option C)

Decided 2026-08-09, after laying out the alternatives.

**First, a correction that matters.** The 18k doc budget is something *this tool invented*, not a
measured limit and not Hendri's. It was then treated as a discovered constraint, and it drove a
proposal — splitting `DESIGN_SYSTEM.md` in two — that would have reduced nothing while doubling the
number of places a rule can be restated and drift. Five acceptance runs, none has ever complained
about length; run 5 read all 17k and produced the best build and the sharpest critique of the five.

So the reason to trim is **not** size. It is that the same rule stated in three places is three
places to disagree, and disagreement is the defect class every run keeps finding. Size is a proxy;
contradiction is the disease.

Where the duplication actually is — the same rule appears in `SKILL.md`, in the token's `description`
(which is also the DTCG `$description`), and again in a Component recipe. Surfaces, the state washes
and links are the clearest cases. The reference is ~5k of generated table and ~8k of prose; the
tables have been exact in all five runs, so **whatever gets cut, it is not those.**

The honest counter, worth holding on to: run 5 called the three silent-failure warnings "the single
highest-value sentence in the documentation", and those are prose stated up front *and* repeated
where relevant. Repetition in agent-facing docs is not automatically waste. Cut what *restates*, keep
what *warns*.

Rejected, with reasons: splitting the reference (moves tokens, adds contradiction surface); moving
the gap list out (it is what stops agents inventing silently); shortening token descriptions (they
carry the "when to use it" teaching that `DECISIONS.md` #3 relies on instead of a numbering legend).

## Open, and deliberately not being built yet: a CLI and/or an MCP

Raised by Hendri 2026-08-09 as a direction to plan for, not to build.

The observation that reframes it: **a consumer-side MCP would largely dissolve the doc-budget
question.** An agent currently loads 13k of reference *in case*; one that can ask loads what it
needs. It also attacks the real defect class, because a tool answering from `resolveTokens()` cannot
go stale — the same argument that made `exports/` generated rather than maintained.

Consequence for sequencing: a heroic doc restructure now would be partly wasted work. The modest
duplication pass above is not, because it is a correctness fix either way.

Three shapes, frequently conflated:

1. **A CLI.** `export` (exists as `npm run export`), `init` to wire `tokens.css` into a consuming
   project, and `check` to fail a build on colour literals, primitives and unknown token names —
   the hard rules turned into enforcement. Deterministic, CI-friendly, needs no server, works for
   any consumer. Does nothing for an agent mid-build.
2. **A consumer MCP.** `find_token("hovered row on a card")`, `check_contrast`, `recipe("button")`.
   Kills the budget question and cannot go stale. But it needs a server running, which is a
   liability precisely where the product is strongest — handing a folder to a client — and it only
   serves MCP clients, where the export serves Cursor, Copilot, CI and a human. The docs do not
   disappear either: an agent must know an inverse region *exists* before it can ask about one.
3. **An authoring MCP** — an agent drives Brand Forge itself: create a brand, set a seed, read the
   audit, export. A different product surface, and arguably the more interesting one. Check it
   against `DECISIONS.md` #20 (hosting/auth refused) rather than sliding past that entry.

1 and 2 are not alternatives; the CLI is the deterministic path and the MCP the conversational one,
over the same engine.

**The constraint on any of them:** every tool must be a thin wrapper over `resolveTokens()` /
`validateContrast()` / `buildExport()`. The moment one computes its own answer it is a second path
from config to output, which is the one thing `CLAUDE.md` forbids — and it would drift exactly the
way the prose did.

**The question that decides which to build:** who is the consumer? Hendri on his own machine (MCP is
ideal), a client receiving a brand (the folder is the deliverable, a server is a liability), or an
agent in someone else's repo (the folder, committed). The tool is currently built around handing
over an export; an MCP makes it a service. That is a product decision, not a technical one.

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
