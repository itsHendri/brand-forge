# Future

Start here. Read `STATUS.md` first for where things actually stand, and `DECISIONS.md` before
changing anything that looks arbitrary — most of it isn't.

Session 3 (2026-08-09) rebuilt the token layer against IBM Carbon and Atlassian, Hendri's two
favourite systems, and ran the acceptance test three more times. Everything those runs found is
fixed except what is listed below.

---

## Pick one of these

### A. The syntax-highlighting palette — the biggest hole

Run 7 built a documentation site and its code blocks came out **monochrome**. There is nothing for
keywords, strings, comments or numbers, and the obvious workaround is closed off: the solid
`--<status>` tokens are forbidden as text on a page background, so you cannot borrow `--success` for
a string literal.

A design system whose own docs are a code-heavy site cannot colour a code sample. That is the
clearest remaining gap in the product.

Carbon ships ~90 `$syntax-*` tokens, which is far more than this needs — but the answer is not zero.
Think: keyword, string, comment, number, function, punctuation, and a diff pair. Seven or eight,
measured against `--muted` (where code blocks live) in both modes.

**Watch for:** they must be readable on `--muted` composited over every ladder surface, which is the
same compositing problem the state washes have. `composite()` and the `over` field in
`CONTRAST_PAIRS` already exist for this.

### B. `--muted` is doing five jobs

Table headers, inactive tabs, code blocks, neutral badges and image placeholders all resolve to the
same 18% wash, so run 7's content page "reads as one undifferentiated grey texture". In dark mode it
is also byte-identical to `--state-active`, so pressing a table row paints it the header's colour.

This is a real design problem, not a doc problem. Options: split code surfaces from quiet fills, or
accept it and say so. Do not add a token without deciding which of the five jobs it takes.

### C. `--primary-subtle` is invisible where the recipe blesses it

Measured Lc 2.2 on `--background` in light — *worse* than the `--secondary-subtle` (Lc 3.0) the docs
explicitly warn about, and `primary` is the role the Badge recipe names first. The warning describes
one case and misses the identical one in the sanctioned default.

Either the subtle steps need re-picking against the page rather than against `--surface`, or the
Badge recipe needs to stop blessing a fill nobody can see. Measure before choosing.

### D. The logo accent shifts between modes

The sanctioned pattern is `fill="var(--secondary-500, #f1760f)"`, but primitive ramps re-declare
under `[data-theme="dark"]`, so the accent renders `#f1760f` in light and `#d97736` in dark. The one
place the docs sanction reaching into a primitive is the one place the primitive layer's
mode-switching bites. Either the mark needs a non-theming token, or the docs should say the accent
moves.

### E. Smaller, all named by run 7

- **Media geometry** — aspect ratios, figure radius, whether a full-bleed figure's caption aligns to
  the figure or the text column.
- **A footer layout** — `--inverse` is documented as "a footer band" and four `inverse-*` tokens
  exist, but there is no column count, gap or link treatment.
- **`scroll-padding-top` for anchors under sticky chrome.** A docs site is nothing but in-page
  anchors and `--shell-header` exists; nothing connects them.
- **An `hr` / section break.** Nothing.
- **Whether a *marketing* header may use `--shell-header`**, which is documented as app chrome.

---

## Then: acceptance run 8

Seven runs, seven distinct classes of defect, and every one found something real. Keep varying the
shape — the brief table is in the `doc-acceptance-test` skill.

Three things that have never been briefed: an email/newsletter layout (no media queries, tables for
layout), a data-dense chart or report page (the system has no chart colours at all), and a form-heavy
multi-step flow.

**The lesson from runs 5–7: run it after a change, not before a release.** Four of run 5's eight
findings were introduced hours earlier the same day. Run 7's worst finding was a token added that
morning. None of these would survive a build attempt; all of them survived careful reading.

---

## Still open, older

**Is Ember the button colour, or the darkened stand-in?** `--secondary` resolves to `#cc6000` so it
can carry a label, while the ramp keeps `#f1760f` at its anchor. The Components preview now has a
*When a fill can't carry a label* section showing the seed with a dark label, the seed with a white
label, and the shipped `--secondary`, side by side. Pick whichever you can read. Both references
solve this with an inverse token rather than by darkening, so switching is a real option now those
tokens exist. **Do not settle it by argument — look at it.**

**Gaps the docs declare honestly and still do not solve:** icon box size (the craft rules specify
stroke weight to a fraction of a pixel and never the box); card emphasis for "this is the recommended
plan"; a wordmark treatment in type; standalone font weights and blur; a reduced-motion duration
below 100ms; a type step between 1.5rem and 2.25rem; theme persistence.

**Known rough edges:** undo history is memory-only (a refresh clears it; `brands/.backup/` holds only
the immediately-previous version); `client-zip` is planned and not installed, so the download path
writes one file at a time; `migrateConfig` fills and merges but does not *validate* — a file with
`radius: "nonsense"` still gets through, and `zod` was planned for that; preview contexts are inline
`style={{}}` objects, which Phase 6 will need as real stylesheets; and `DARK_LIFT` decides where
`pickFill`'s dark search starts, which a very light or very dark seed may not want.

---

## Phase 6 — the static guideline page

The one output the tool still doesn't produce: a second Vite entry SSG-rendering the preview contexts
plus the token tables into `exports/<slug>/guidelines/index.html`, so a brand is handed over as a page
rather than a folder of Markdown.

It was the immediate next step until 2026-08-09 and moved behind the token work because it is a
presentation layer over the system, and the system had about ten holes in it. Most are now closed.

**Hendri confirmed 2026-08-09 that the export's audience is an agent building UI, not a human
reader** — so this is not the priority it once looked like. Revisit if that changes.

One obstacle, unchanged: preview contexts are inline style objects, not CSS. SSG output needs real
stylesheets, so either the kit grows a class-based mode or the generator serialises the style objects.
Decide that first; it shapes the phase.

---

## Open, and deliberately not being built: a CLI and/or an MCP

Raised by Hendri 2026-08-09 as a direction to plan for, not to build.

The observation that reframes it: **a consumer-side MCP would largely dissolve the doc-size question**
— an agent that can ask loads what it needs rather than 17k in case — and a tool answering from
`resolveTokens()` cannot go stale, which is the argument that made `exports/` generated rather than
maintained.

Three shapes, frequently conflated:

1. **A CLI.** `export` (exists), `init` to wire `tokens.css` into a consuming project, `check` to
   fail a build on colour literals, primitives and unknown token names. Deterministic, CI-friendly,
   no server, works for any consumer. Does nothing for an agent mid-build.
2. **A consumer MCP.** `find_token("hovered row on a card")`, `check_contrast`, `recipe("button")`.
   Needs a server running — a liability exactly where the product is strongest, handing a folder to
   someone — and only serves MCP clients where the export serves Cursor, Copilot, CI and a human.
3. **An authoring MCP** — an agent drives Brand Forge itself. Different product surface. Check it
   against `DECISIONS.md` #20 (hosting/auth refused) rather than sliding past that entry.

Hendri also floated simply hosting the export or linking it from GitHub, which is cheaper than any of
these and may be the whole answer.

**The constraint on all of them:** every tool must be a thin wrapper over `resolveTokens()` /
`validateContrast()` / `buildExport()`. The moment one computes its own answer it is a second path
from config to output, which `CLAUDE.md`'s one rule forbids — and it would drift exactly as the prose
did.

**The question that decides it:** who is the consumer? Hendri on his own machine (MCP is ideal), a
client receiving a brand (the folder is the deliverable), or an agent in someone else's repo (the
folder, committed).

---

## Deliberately refused

Component tokens, Figma sync, per-brand preview content, hosting/auth. See `DECISIONS.md` #2 (amended
— Carbon *does* ship component tokens, and the refusal now rests on a narrower argument) and #20.

Font-file management was on this list and shipped — see #14 and #15.
