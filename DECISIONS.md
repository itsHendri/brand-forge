# Decisions

Rationale for non-obvious choices. Supersede entries; don't rewrite them.

---

### 1. A custom local web app, not Framer — 2026-08-08

Brand Forge is a tool: generation algorithms, app state, file exports. Framer is excellent at
publishing sites and hostile to all three. Framer may later host the *published guideline page* that
this tool generates — that's an output, not the builder.

### 2. Two token tiers only: primitives → semantics. No component tokens — 2026-08-08

Primitives (`--primary-600`) are where a human edits colour. Semantics (`--primary`, `--border`) are
what components and AI agents consume. Component tokens (`--button-bg`) are deliberately absent:
Salesforce is actively retreating from them, shadcn thrives without them, and they triple the
surface area for no benefit at this scale. Component-level guidance lives in the exported docs as
**recipes** ("a button is `--primary` + `--primary-foreground` + `--radius-md`") instead.

**Amended 2026-08-09 — the industry is not unanimous, and this entry implied it was.** Carbon ships
component tokens as a documented tier of its system: `$button-primary`, `$tag-background-red`,
`$notification-background-error`, each scoped with "should never be used for anything other than
their own component". It is one of the two systems this project is now benchmarked against.

The refusal stands, on a narrower and more honest argument: Carbon maintains a React component
library those tokens have to stay in sync with, and a component token is how you version a component
independently of the palette. We ship documentation and recipes and have no components to version,
so the tier would cost surface area and buy nothing. If Brand Forge ever emits components, reopen
this.

### 3. Primitives use Tailwind 50–950; semantics use role names — 2026-08-08

Two audiences, two vocabularies. `50…950` is the numbering every developer and every language model
already knows, and it's the right shape for *editing* a ramp. But step numbers carry no meaning, so
exposing them to an agent produces hardcoded values. Radix's science (which step is a background,
which is a border) is encoded in `defaultSemanticMapping()` rather than in the step names — the
mapping does the teaching, so the export never has to explain a numbering legend.

Semantic names follow Hendri's working vocabulary (surfaces, foregrounds, states, borders) and keep
shadcn-compatible names wherever they fit, because that vocabulary dominates model training data.
Radix's own terms — "solids", "text" as step roles — are not used; they're jargon outside Radix.

### 4. The seed colour appears verbatim in its ramp — 2026-08-08

`generateScale` bends the lightness curve so the typed colour lands exactly on its nearest step
("seed warping"), and `defaultSemanticMapping` points `primary` at that *anchor* step rather than a
fixed 600. Type `#574cff`, get `#574cff` buttons. The bend is clamped to half the gap to the
neighbouring step so ordering can never invert; when the clamp bites, the UI says so rather than
silently shipping a near-match.

### 5. Base chroma is solved against the LIGHT ramp for both modes — 2026-08-08

Superseded an earlier per-mode solve. Solving base chroma separately per mode made dark ramps *more*
chromatic than light ones — the opposite of what dark mode needs — because the dark bell's value at
the anchor is lower, which inflated the base. Now the anchor and base chroma are always solved
against the light targets (the seed's canonical identity), and dark applies its own bell plus a
global `DARK_CHROMA_TRIM`. Caught by a test asserting dark ramps run calmer.

Note: at the saturated end of a vivid hue both ramps hit the sRGB gamut ceiling, so clamping — not
the trim — decides the final chroma. Assertions about the trim must use a seed comfortably inside
gamut, or they measure the clamp instead.

### 6. Semantics alias primitives in the emitted CSS — 2026-08-08

`--primary: var(--primary-700)`, not `--primary: oklch(...)`. Each colour value appears exactly once
per mode, the mapping is legible in the exported stylesheet without reading the docs, and a human
editing the CSS by hand can re-point a semantic without hunting values.

### 7. `BrandConfig` is the source of truth; DTCG JSON is an export — 2026-08-08

DTCG (stable since 2025.10) cannot express *generative intent* — seeds, chroma curves, aliasing
rules, rule toggles — without abusing `$extensions`, which would make it the source in name only.
So the typed config is authoritative and DTCG is generated deterministically from it, carrying
`$extensions` metadata so a future re-import stays possible.

### 8. The Vite dev server is the file sidecar — 2026-08-08

The app only runs locally under `vite dev`, so a small middleware plugin gives it real file
read/write without a second process. The File System Access API was rejected: Chromium-only,
permission-prompty, and worse at the one job that matters — writing a whole skill *folder* that can
be symlinked into `~/.claude/skills/`.

### 9. Dark mode is generated, never inverted — 2026-08-08

The dark ramp has its own lightness targets (floored at ~0.245, not near-black, to avoid halation)
and its own chroma bell. Naive inversion of a light scale produces neon accents and dead surfaces,
because dark grounds amplify perceived saturation. Elevation follows the same logic: light mode uses
layered shadows, dark mode uses a hairline ring plus a lighter surface.

### 10. Breakpoints are mobile-first only, and a closed set — 2026-08-08

Four min-widths (640/768/1024/1280) using the industry-standard names, so they cost nothing to learn
and interoperate with Tailwind for free. No `max-width` breakpoints: a system carrying both
directions has two sources of truth for the same layout and they drift. No `xs` either — the
narrowest case is the base styles, not a breakpoint.

Breakpoints ship as tokens even though CSS cannot read a custom property inside a media query. They
exist to state the legitimate set once, and to feed Tailwind's `--breakpoint-*` namespace.

**In the `@theme` block they must be literal values, never `var()`.** Tailwind compiles its variants
into `@media` rules, so `--breakpoint-lg: var(--breakpoint-lg)` becomes
`@media (width >= var(--breakpoint-lg))` — invalid CSS, and every `lg:` utility silently stops
applying. Found by compiling the exported stylesheet with a real Tailwind v4 build rather than
reasoning about it; a test now pins the literal form. Colour tokens keep the `var()` form because
they have to re-point per mode and are never used in a media query.

### 11. Containers are named for the job, and nothing spans the viewport — 2026-08-08

`prose` (42rem) is the load-bearing one: running text at laptop width is unreadable regardless of
how good the type is, so body copy takes it even inside a wider `page` frame. Nesting the two is the
normal case, not an exception.

This closes the largest gap the acceptance test found — the previous system defined neither, so
every page invented its own max-widths and its own breakpoints. The preview's own ComponentsSheet
was guilty of it too, with a hardcoded `980px`.

### 12. A loaded brand is merged over defaults, never trusted as-is — 2026-08-08

Adding `layout` to `BrandConfig` hard-crashed every brand file written before it existed —
`config.layout.breakpoints` on undefined, at first render. `migrateConfig` now merges a loaded file
over a complete default block by block, and logs which blocks it filled rather than doing it
silently. Migrate on read, persist on write: the file on disk stays as it was until the next edit.

### 13. — number retired

Nothing was deleted. "Scope deliberately refused" briefly held this number and was renumbered when
entries were inserted around it; it is now #20. Left as a gap rather than reused, so a reference to
"#13" from an old commit message doesn't silently point at something else.

### 14. Assets live in `brands/assets/<slug>/`, not in a per-brand folder — 2026-08-09

Restructuring `brands/<slug>.json` into `brands/<slug>/brand.json` would have meant migrating every
existing file for no user-facing gain. A brand is made portable by the **export** bundling its
assets — which it does, as real bytes — not by the shape of the working directory.

Assets are committed rather than ignored, so a clone is self-consistent: a config referencing
`mark.svg` finds it. **This is worth a second look before adding a client's licensed font**, since
committing the binary is a licensing decision, not just a storage one. Nothing in the tool stops
you; it just shouldn't happen by accident.

### 15. An SVG logo is stored inline; a raster logo is stored as a file — 2026-08-09

Not an arbitrary split. An inline SVG can have its explicit fills rewritten to `currentColor`, so
one mark follows the foreground token and inverts in dark mode — verified rendering at L 0.26 in
light and L 0.97 in dark. A raster logo cannot be recoloured, so it ships as-is and it is the
brand's problem if it disappears against a dark ground.

The consequence: an SVG logo lives in `brand.json` and needs no file copied into the export, while
a raster one does. `referencedAssets()` encodes exactly that.

### 17. `display` is a family slot, not a role that borrows the sans — 2026-08-09

Hendri's display face is Alpha Lyrae; his body face is Space Grotesk. They are different typefaces,
not two weights of one, so a model with only `sans`/`serif`/`mono` could not express the system it
was supposed to describe. `FontFamilyName` now includes `display`, and the `display` role points at
it.

The consequence that matters: **a type role is five properties, not four.** The family is part of
applying a role. The docs had a four-property recipe and a type table with no family column, so
anything following them rendered the display face in the body font — silently, and the preview kit
was doing exactly that until this change. The table now carries a Family column.

**Superseded in part on 2026-08-09 — the face is not bundled.** Alpha Lyrae has no hosted
stylesheet, so the only way to make it render is to ship the file, and shipping it means
redistributing a licensed font with every export. I downloaded it from the live site and wired it in
before asking, which was the wrong order: bundling someone else's licensed asset is the user's call,
not a technical detail to be settled by whether it works.

`--font-display` now points at the same stack as `--font-sans`, and the brand records that as a
deviation so nobody reads the two as visually distinct. The slot stays, because the *intent* — a
display face separate from the body face — is correct and the upload path already exists. It fills
in when Hendri picks a face he is happy to redistribute.

The general rule this leaves behind: **the tool may bundle any asset a user uploads, and should
never acquire one on their behalf.**

### 18. `display` and `heading-lg` are fluid; nothing else is — 2026-08-09

A fixed 3.5rem display heading ran to four lines and 235px at 390px — a quarter of a phone screen
before the page said anything. Both roles now carry a `minSizeRem` and emit
`clamp(min, intercept·rem + slope·vw, max)` across 390–1280px.

Only the two largest roles. Body text should not move: reading size is the reader's business, and a
paragraph that changes size as you resize is a distraction, not a feature.

**The middle term keeps a `rem` component rather than being pure `vw`.** Viewport units ignore the
reader's font-size preference, so a `vw`-only heading refuses to grow when someone zooms — a
failure that is invisible on every device you own and obvious to somebody who needs it. Mixing rem
with vw preserves zoom.

### 19. The preview canvas is an iframe — 2026-08-09

Forced by #18, but it was fixing a pre-existing lie. A `div` constrained to 390px is not a 390px
viewport: `vw` units and media queries both resolve against the browser window, so pinning the
canvas showed the right column count and the wrong type size. Fluid type made it obvious — the
heading measured identically at every breakpoint — but **media queries had been wrong the whole
time in the same way**, and the tool was claiming the width selector "genuinely exercises the
layout".

An iframe *is* a viewport, so everything viewport-relative now means what it says. Verified: the
display role measures 36px at 390 and 56px at 1280, hitting both endpoints exactly.

Implementation note worth keeping: do **not** `document.write()` into the frame. That fires a second
load which replaces the body React has portalled into, and the canvas comes up empty. The
about:blank document already exists — use it.

### 20. Scope deliberately refused — 2026-08-08, revised 2026-08-09

Not in v1, and not by accident: component tokens (see #2), Figma sync, per-brand preview content,
and hosting/auth.

**Superseded in part:** font-file management was on this list, on the grounds that type families
could stay CSS stacks plus an optional `<link>`. That was wrong in practice — a brand that names a
typeface it cannot carry renders in a fallback stack everywhere, which makes the preview a liar
about the system it is previewing. Shipped 2026-08-09; see #14 and #15.

### 21. Elevation levels are named for purpose, not numbered — 2026-08-09

Carbon and Atlassian solve surface layering in opposite ways, and the choice was live because our
own model is thin: `--surface` and `--surface-raised` are **the same value in light mode**, so
"raised" is conveyed by shadow alone, and `--shadow-overlay` has no surface to pair with.

Carbon numbers contextually — `$layer-01/02/03`, `$field-01/02/03`, `$border-subtle-00..03`, each
defined as sitting on the one below. It is precise, and it requires the consumer to track what it is
sitting on. Atlassian names by purpose — `sunken / default / raised / overlay` — and mandates that
each surface be paired with its matching shadow.

Atlassian's scheme wins here for the reason already written down in #3: step numbers "carry no
meaning, so exposing them to an agent produces hardcoded values." The consumer of this system is a
language model reading a Markdown table. `overlay` is self-describing; `layer-02` needs the
numbering legend that #3 exists to avoid writing. Carbon's numbering earns its keep inside a
component library where the nesting depth is known at build time; ours is read by something
improvising a page.

Taken with it: the surface+shadow pairing rule, and Atlassian's reason for it — in dark mode shadows
barely read, so the surface itself must lighten with each level. That is already how this system
behaves (#9), so the pairing formalises an instinct rather than changing behaviour.

### 22. Only the deltas are persisted; the semantic set is derived — 2026-08-09

`brands/*.json` used to store all 57 resolved semantic tokens. That made every saved brand a snapshot
of whatever `defaultSemanticMapping` happened to produce on the day it was written, so improving the
generator reached new brands and no others — and since the app exports the *saved brand*, not the
preset, the exported docs could describe a system the engine no longer built. The documented
workaround was to delete the file and let it rebuild, which also threw away any real edits. It cost
time in at least three sessions.

`color.semantics` is therefore replaced by `color.semanticOverrides`: sparse, one entry per token a
human actually re-pointed, per mode. Everything else — names, groups, descriptions, and every
untouched ref — is regenerated on load by `semanticDefs()`. A brand carrying one hand edit now tracks
the generator for the other 56 tokens.

Three consequences worth keeping:

**Overriding is per-mode.** Pinning `--background` in light leaves dark tracking the seeds, because
the two are decided by separate measurements and there is no reason a light-mode taste call should
freeze the dark one.

**An override cannot change a description.** It moves a ref. Descriptions are generated docs, and a
brand that could edit them would be a brand that could lie about its own system.

**An override naming a token that no longer exists is a warning, not a silent drop.** It means a
token was renamed underneath a brand that had customised it; discarding the edit quietly is how
someone loses work without being told.

The migration from the old format diffs the stored set against the freshly generated one and keeps
whatever differs. It cannot distinguish a hand edit from a stale default — a token that differs
because the generator improved looks exactly like one a human moved. That was checked rather than
assumed before shipping: the only real brand file had drifted in **zero of its 57 tokens**, so the
conversion provably froze nothing, and the file shrank from 40KB to 14.7KB. The path remains for
files written elsewhere, and it reports what it converted.

### 23. A stale export is a failing test — 2026-08-09

The app could only write an export from a browser, with somebody clicking a button. So `exports/`
drifted from the code repeatedly: an acceptance run could critique documentation the engine had
stopped producing, and a handover could ship a stylesheet nobody had generated. `FUTURE.md` proposed
this check three times and never added it, reasoning that it "fails legitimately whenever someone
edits a brand without re-exporting".

That reasoning was backwards. An export that no longer matches its brand *is* the defect — the
failure is the signal. What made the check unaffordable was that fixing it meant opening a browser.

So `npm run export` regenerates `exports/<slug>/` headlessly from `brands/<slug>.json`, through the
same `migrateConfig` → `resolveTokens` → `buildExport` path the app uses, and
`src/export/freshness.test.ts` fails when disk and engine disagree. Every failure message names the
one command that fixes it.

It earned its place on the first run, catching `exports/hendri/brand.json` still carrying the old
stored-semantics array.

The logic lives in `scripts/exportFromDisk.ts` rather than `src/`, because it reads the filesystem
and nothing the browser bundles is allowed to.

### 24. A translucent token restates its colour instead of aliasing it — 2026-08-09

#6 says a semantic aliases its primitive — `--primary: var(--primary-700)` — so each colour appears
exactly once per mode and the mapping is legible in the stylesheet. `--scrim` cannot: a `var()`
holding `oklch(L C H)` has no alpha channel to bend, and there is no way to add one at the point of
use without `color-mix` or relative colour syntax, both of which put a computation in every consumer
to save one line here.

So `SemanticRef` gained an optional `alpha`, and a ref carrying one emits a literal
`oklch(L C H / a)`. It is opt-in per ref rather than a separate token type, so the exception stays
visible in the data instead of becoming a second code path — which is the failure mode the one-rule
in `CLAUDE.md` exists to prevent.

Two consequences the docs had to absorb, both found by looking at the generated output rather than
by reasoning: the token table printed `#1f262d` for `--scrim`, which is a lie an agent would build
an opaque backdrop from, and the shared-value section reported `--scrim` and `--foreground` as the
same colour. Both now account for alpha.

Scrim is deliberately absent from the contrast audit. Its effective colour depends on whatever is
behind it, so there is nothing for APCA to measure — reporting a number there would be inventing one.

### 25. The preview's dark mode was broken by the iframe, and nothing caught it — 2026-08-09

`PreviewCanvas` calls `previewCss(resolved, ":root")`, which compiles the dark block to
`:root[data-theme="dark"]`. The attribute was being set on the `#preview-root` **div**, so the
selector matched nothing: for a session and a half the canvas rendered light-mode values whenever
dark was selected, under a UI that said "Dark".

Introduced by 45756c1, the commit that made the canvas an iframe (#19). Before that the selector
defaulted to `#preview-root`, which did match. Found while checking that this session's new tokens
inverted correctly in dark — `--inverse` came back dark on a dark page, which is the one thing it is
defined not to do.

The attribute now goes on the iframe's `documentElement`, which is what `:root` means and what a
real app does. Keeping `:root` rather than scoping to the div is deliberate: the preview should
apply the tokens the same way the exported stylesheet does.

Worth naming plainly, because this is the exact failure the project's one rule is written against —
preview and export disagreeing — and the rule did not prevent it. The declarations were never the
problem; both consumed the identical array. The *selector* drifted, and there is no test covering
it, because the test suite has no DOM. The audit, the exports and every unit test stayed green
throughout. The only thing that caught it was rendering the thing and looking at it, which is why
`CLAUDE.md` says to verify in the browser rather than reason about it.

### 26. The interactive states are translucent, and their alphas are solved — 2026-08-09

The four `--state-*` tokens were opaque aliases, each calibrated against one surface. `--state-hover`
was `neutral-200`; so is `--muted`. A hovered row on a muted surface was therefore *the same colour
as a resting one* — a hover that did nothing — and a clickable card was not buildable from this
system at all. Nothing caught it, because each token measured fine against the single ground it had
been chosen for, and no pair asked what it looked like on the others.

Carbon's answer is the fix: `$background-hover` is Gray 50 at 12%, transparent. A mid grey is darker
than every light surface and lighter than every dark one, so at low alpha it always moves *away* from
whatever it lands on. One token covers four surfaces instead of needing four tokens, and there is no
"which hover do I use here" question to get wrong.

**The alphas are measured, not chosen.** Two ends, each solved against the palette:

- `active` is the **strongest** wash that keeps body text at Lc 75 on every surface it can land on.
- `hover` is the **gentlest** wash that still visibly shifts every surface.
- `disabled` is their midpoint; `selected` runs the same solve on the primary ramp.

Hand-picked alphas would have been wrong here in a way that is genuinely hard to see coming. Dark
mode is squeezed from *both* directions by the same surface: `surface-raised` is the lightest ground,
so a lightening wash eats into the near-white foreground fastest — and it is also the ground nearest
the wash on the ramp, so it shifts least. Dark therefore tolerates less wash at the top (0.18 vs
0.24) and needs *more* at the bottom (0.12 vs 0.10) than light does. The two ends move in opposite
directions between modes. My first attempt set hover to half of active, and that produced a dark
hover that shifted `surface-raised` by 4/255 — invisible, and exactly the bug being fixed.

Corroboration worth recording: solved independently, light hover lands on 0.10 against Carbon's
hand-tuned 0.12.

**A wash cannot be audited on its own.** It has no colour until it is over something, so
`CONTRAST_PAIRS` gained an optional `over`, and `composite()` blends the wash onto that ground before
measuring. Every wash is checked against all four surfaces — sixteen pairs where there used to be
two, which is the honest cost of a token that behaves differently everywhere.

`state-disabled` is deliberately not in the audit. Its label is `--foreground-tertiary`, which this
system already documents as exempt and "never will be" validated, and WCAG 1.4.3 exempts inactive
controls too. Adding the pair would have the audit contradict the docs, which is worse than the pair
being absent. That the disabled fill stays *visible* is covered by a test instead.

**Visibility needed its own measure.** APCA clamps everything below its noise floor to 0, so it
cannot distinguish "subtle" from "invisible" — and a hover wash lives entirely in that range. So
`channelShift()` exists purely for the question APCA cannot answer: did anything happen? It is a
crude mean-channel delta and is used for nothing else.
