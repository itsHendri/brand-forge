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

### 10. Scope deliberately refused — 2026-08-08

Not in v1, and not by accident: component tokens (see #2), Figma sync, font-file management (type
families are CSS stacks plus an optional `<link>`), per-brand preview content, and hosting/auth.
