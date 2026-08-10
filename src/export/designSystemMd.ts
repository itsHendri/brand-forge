/**
 * DESIGN_SYSTEM.md — the declarative reference an agent reads before it writes.
 *
 * Written deviation-first. A model arrives with strong priors (shadcn's token
 * names, Tailwind's spacing, `h1`-style type roles); the highest-value content
 * is therefore where THIS system contradicts those priors, not where it agrees.
 * Everything is a copy-pasteable value, and every rule that can be shown wrong
 * as well as right is.
 */

import { apca, LC_THRESHOLD } from "../engine/contrast"
import { spaceName } from "../engine/defaults"
import { SCALE_ROLES, type ResolvedTokens, type SemanticGroup } from "../engine/types"
import { primaryFamily } from "./css"

/** shadcn's vocabulary, which is what a model reaches for unprompted. */
const SHADCN_NAMES = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
]

const GROUP_TITLES: Record<SemanticGroup, string> = {
    surface: "Surfaces",
    text: "Text",
    link: "Links",
    state: "Interactive states",
    border: "Borders and focus",
    brand: "Brand",
    status: "Status",
    inverse: "Inverse regions",
}

const GROUP_ORDER: SemanticGroup[] = ["surface", "text", "link", "state", "border", "brand", "status", "inverse"]

function table(headers: string[], rows: string[][]): string {
    const head = `| ${headers.join(" | ")} |`
    const rule = `| ${headers.map(() => "---").join(" | ")} |`
    const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n")
    return [head, rule, body].join("\n")
}

/**
 * Where this system contradicts a default assumption — and *only* the parts that
 * need the brand to be known.
 *
 * This list used to restate seven of `SKILL.md`'s hard rules verbatim, values
 * and all. That is not free: `SKILL.md` always loads and this file is read after
 * it, so the second copy taught an agent nothing it had not already been told,
 * and it was seven more places for a rule to drift out of step with the file
 * that stated it first. Drift between two statements of the same rule is the
 * defect class every acceptance run finds; see DECISIONS #30.
 *
 * What stays: the shadcn name mapping (computed from which names this brand
 * actually lacks), the on-brand trap (placed here deliberately after an earlier
 * run, and pinned by a test), the label-polarity note (only claimed in the modes
 * where it is true), and the brand's own hand-written deviations. Everything
 * else is a rule, and rules live in SKILL.md.
 */
function deviations(resolved: ResolvedTokens): string[] {
    const { config } = resolved
    const names = new Set(resolved.semantics.map((token) => token.name))
    const out: string[] = []

    const missing = SHADCN_NAMES.filter((name) => !names.has(name))
    if (missing.length > 0) {
        const replacements: Record<string, string> = {
            card: "surface",
            "card-foreground": "foreground",
            popover: "surface-raised",
            "popover-foreground": "foreground",
            accent: "state-hover",
            "accent-foreground": "foreground",
            destructive: "danger",
            "destructive-foreground": "danger-foreground",
        }
        const mapped = missing
            .map((name) => (replacements[name] ? `\`${name}\` → \`${replacements[name]}\`` : `\`${name}\``))
            .join(", ")
        out.push(
            `**This is not shadcn's token set.** These common names do not exist here: ${mapped}. Using one produces an unstyled element, silently.`,
        )
    }



    out.push(
        `**On a coloured fill, the neutral text tokens are wrong.** Inside a \`--primary\` band or a solid status banner, text and controls take that fill's own \`-foreground\` — for text *and* border. \`--foreground\` is dark ink and is unreadable there. Full-bleed call-to-action sections are where this bites.`,
    )






    const onFills = resolved.semantics.filter(
        (token) => token.name.endsWith("-foreground") && token.light.scale === "neutral",
    )
    if (onFills.length > 0) {
        // Only claim the polarity actually splits in a mode where it does.
        const split = (["light", "dark"] as const).filter((mode) => {
            const lightnesses = onFills.map((token) => token.values[mode]!.oklch.l)
            return Math.max(...lightnesses) - Math.min(...lightnesses) > 0.3
        })
        const where =
            split.length === 2
                ? "in both modes"
                : split.length === 1
                  ? `in ${split[0]} mode (they are all the same colour in ${split[0] === "dark" ? "light" : "dark"})`
                  : "should a fill ever need it"
        out.push(
            `**Labels on solid fills come from the neutral ramp**, not from the fill's own scale, and their polarity is chosen by measuring contrast against each fill. That means they do not all match — ${where}. \`--warning-foreground\` can be dark while \`--primary-foreground\` is light. Do not "correct" this to a single colour.`,
        )
    }

    return [...out, ...config.meta.deviations.map((note) => `${note}`)]
}

/**
 * A hex is a lie for a translucent token: `--scrim` resolves to a colour at 60%
 * and printing `#1f262d` invites somebody to build an opaque backdrop out of it.
 * Alpha tokens therefore print what actually ships.
 */
function cellValue(token: ResolvedTokens["semantics"][number], mode: "light" | "dark"): string {
    const { alpha } = token[mode]
    if (alpha === undefined) return `\`${token.values[mode]!.hex}\``
    return `\`${token.values[mode]!.hex}\` at ${Math.round(alpha * 100)}%`
}

function tokenTable(resolved: ResolvedTokens, group: SemanticGroup): string {
    const rows = resolved.semantics
        .filter((token) => token.group === group)
        .map((token) => [
            `\`--${token.name}\``,
            cellValue(token, "light"),
            cellValue(token, "dark"),
            token.description,
        ])
    return table(["Token", "Light", "Dark", "Use it for"], rows)
}

/**
 * The six solid role fills and their labels, measured, worst first — so the docs
 * cite the real floor instead of whichever pair somebody happened to measure.
 *
 * Restricted to the role fills on purpose: `--muted`, `--inverse` and the
 * `-subtle` washes all have a `-foreground` too, and sweeping them in produced a
 * fourteen-item list in which the genuine label floor was buried.
 */
function labelPairsFor(resolved: ResolvedTokens): Array<{ role: string; lc: number }> {
    const by = new Map(resolved.semantics.map((token) => [token.name, token]))
    return SCALE_ROLES.filter((role) => role !== "neutral")
        .flatMap((role) => {
            const fill = by.get(role)
            const label = by.get(`${role}-foreground`)
            if (!fill || !label) return []
            return [{ role, lc: Math.abs(apca(label.values.light!.hex, fill.values.light!.hex)) }]
        })
        .sort((a, b) => a.lc - b.lc)
}

function componentRecipes(resolved: ResolvedTokens): string {
    const labelPairs = labelPairsFor(resolved)
    const r = resolved.radius
    const cardInner = Math.max(0, r.lg - 24)
    return `Component tokens deliberately do not exist. Compose these instead — the values below are
exact, not indicative.

**Applying a type role.** \`--text-body\` is a bare length, so the \`font\` shorthand will not take
it — \`font: var(--text-body)\` is invalid CSS and is dropped silently, leaving an unstyled element
and no console error. A role is **five** properties — the family is part of it, not a
separate decision — so set them individually:

\`\`\`css
.button {
    font-family: var(--font-sans); /* the role's family, from the table below */
    font-size: var(--text-label);
    line-height: var(--text-label--line-height);
    font-weight: var(--text-label--font-weight);
    letter-spacing: var(--text-label--letter-spacing);
}
\`\`\`

**Button (primary)** — \`background: var(--primary)\`, \`color: var(--primary-foreground)\`,
\`border-radius: var(--radius-md)\` (${r.md}px), height 40px, padding \`0 var(--space-4)\`, type role
\`label\`. Hover swaps the background to \`--primary-hover\`, active to \`--primary-active\`.
**Focus is \`outline: 2px solid var(--ring-inverse); outline-offset: 2px\`, not \`--ring\`.** In light
mode \`--ring\` and \`--primary\` resolve to the *same colour*, so the default ring on a primary
button is the button's own fill — it survives only because the offset lands it on whatever is behind,
and it disappears the moment the button sits on a brand band. \`--ring-inverse\` is the token for a
control on a coloured ground. Everything with a neutral fill — secondary, outline, ghost, inputs —
keeps plain \`--ring\`. The 40px height is the dense-desktop minimum; on touch, raise it to 44px or
extend the hit area with a pseudo-element.

**Button (secondary)** — identical, with \`--secondary\` / \`--secondary-foreground\`.

**Button (outline)** — \`background: transparent\`, \`color: var(--foreground)\`,
\`border: 1px solid var(--input)\`. Transparent, not \`--surface\`: an outline button sits inside
cards as often as on the page, and a fixed fill makes it vanish against whichever one it didn't
expect. Hover fills with \`--state-hover\`. **This recipe assumes a neutral ground** — see below for
what to do on a brand field.

**Anything on a brand field.** A full-bleed \`--primary\` band, a solid status banner, a filled card:
inside one, the neutral text tokens are wrong. \`--foreground\` is dark ink, and dark ink on a dark
brand colour is unreadable. The rule is that **a control or a piece of text sitting on a fill takes
that fill's own \`-foreground\` — for its text and its border both**:

\`\`\`css
.brand-band { background: var(--primary); color: var(--primary-foreground); }

/* ✅ a button on that band */
.brand-band .button {
    background: transparent;
    color: var(--primary-foreground);
    border: 1px solid var(--primary-foreground);
}

/* ❌ the outline recipe, unchanged — dark ink on dark indigo */
.brand-band .button { color: var(--foreground); border-color: var(--input); }
\`\`\`

The same holds for \`--danger\`, \`--success\` and the rest. And do not fade the result with
\`opacity\` to soften it: that pair was contrast-checked at full strength, and dimming it is how a
validated colour quietly stops being valid.

**The focus ring is part of this, and it has its own token.** \`--ring\` is the brand colour, so on a
\`--primary\` field it is invisible — the outline and the background are literally the same value.
Use \`--ring-inverse\`, which is the neutral extreme for the mode and is measured against exactly
this case:

\`\`\`css
/* ✅ on a brand field */
.brand-band .button:focus-visible {
    outline: 2px solid var(--ring-inverse);
    outline-offset: 2px;
}

/* ✅ when the control can land on either kind of ground, draw both rings —
   whichever half matches the ground, the other stays visible */
.button:focus-visible {
    box-shadow: 0 0 0 2px var(--ring-inset), 0 0 0 4px var(--ring);
}

/* ❌ the default ring, on the one background it cannot be seen against */
.brand-band .button:focus-visible { outline: 2px solid var(--ring); }
\`\`\`

**Set copy on a brand field at \`body-lg\` or larger.** Every \`-foreground\` is validated as a
label colour (Lc ${LC_THRESHOLD.ui}), not as body text (Lc ${LC_THRESHOLD.body}), and how much
headroom each has varies per fill. Measured on this brand in light mode, tightest first: ${labelPairs
        .map((p) => `\`--${p.role}\` Lc ${p.lc.toFixed(0)}`)
        .join(", ")}. The floor is \`--${labelPairs[0]?.role}\` at Lc ${labelPairs[0]?.lc.toFixed(0)}${
        (labelPairs[0]?.lc ?? 0) < LC_THRESHOLD.ui ? " — **which is under the label bar; that pair is reported in the contrast section**" : ""
    }. Set small print on the tighter ones and it will not be readable.
Small print on a brand band has no compliant colour in this system, so don't put any there.

**Card** — \`background: var(--surface)\`, \`border: 1px solid var(--border)\`,
\`border-radius: var(--radius-lg)\` (${r.lg}px), \`padding: var(--space-6)\`. **No shadow**: the
border is already doing the structural job, and \`--shadow-sm\` carries its own hairline layer, so
using both doubles the edge — visibly so in dark mode, where the shadow *is* a ring. Save
\`--shadow-overlay\` for things that genuinely float (popovers, dialogs) and give those no border.
Anything rounded inside a card takes ${cardInner}px — that's the concentric rule applied to this
card's ${r.lg}px radius and 24px padding, not a token.

**Input** — height 40px, \`padding: 0 var(--space-3)\`, \`background: transparent\`,
\`border: 1px solid var(--input)\`, \`border-radius: var(--radius-md)\` on the page (0 inside a padded
card — see the concentric rule), \`color: var(--foreground)\`. Transparent for the same reason the
outline button is: a field sits inside cards as often as on the page, and \`--surface\` is the card's
own colour, so a fixed fill leaves it with no edge but its border. Placeholder uses
\`--foreground-tertiary\`. Focus: \`outline: 2px solid var(--ring); outline-offset: 2px\`.

**Badge** — subtle by default: \`background: var(--{role}-subtle)\`,
\`color: var(--{role}-subtle-foreground)\`, \`border-radius: var(--radius-sm)\` (${r.sm}px),
\`padding: var(--space-1) var(--space-2)\`, type role \`label\`. \`{role}\` is \`primary\` or any
status. A badge is a label, and a page full of solid fills reads as a page full of buttons — so the
solid \`--{role}\` belongs on things that are *doing* something (buttons, chart series, status dots),
not on things that are *naming* something. Use a solid badge only when a single one must dominate.

For a **neutral badge** — "Off", "None", "Default", the state that isn't a status — use
\`background: var(--muted)\` with \`color: var(--muted-foreground)\`. Do not reach for
\`--secondary-subtle\`: it is a near-invisible wash against \`--surface\` and reads as a rendering
artefact rather than a chip.

**Interactive state fills** — \`--state-hover\`, \`--state-active\`, \`--state-selected\` and
\`--state-disabled\` are washes laid over an existing surface, so they carry no \`-foreground\` of
their own: text keeps whatever colour it already had, normally \`--foreground\`. The exception is
\`--state-disabled\`, which pairs with \`--foreground-tertiary\`.

**Alert** — \`background: var(--{status}-subtle)\`, \`color: var(--{status}-subtle-foreground)\`,
\`border: 1px solid var(--{status}-border)\`, \`border-radius: var(--radius-md)\`,
\`padding: var(--space-4)\`, where \`{status}\` is \`success\` | \`warning\` | \`danger\` | \`info\`.

**Table** — header row \`background: var(--muted)\` with \`color: var(--muted-foreground)\`;
row separators \`1px solid var(--border-subtle)\`; hovered row \`--state-hover\`; selected row
\`--state-selected\`. Columns of numbers that are compared or that change get
\`font-variant-numeric: tabular-nums\` — but not columns of identifiers that merely contain digits,
like version strings or reference numbers.

A table is the most common thing to break a narrow screen. Wrap it in an element with
\`overflow-x: auto\` and give that element \`tabindex="0"\` so it can be scrolled by keyboard; let the
table scroll inside the page rather than making the page scroll. The table itself takes
\`min-width: var(--shell-table-min)\`, which is the width it refuses to squeeze below. That wrapper
is focusable, so it needs a visible focus ring like anything else:
\`outline: 2px solid var(--ring); outline-offset: 2px\`.

**A page-sticky header row and that scroll wrapper are mutually exclusive — pick one.** An element
with \`overflow-x: auto\` is a scroll container, so a \`position: sticky\` \`<thead>\` inside it sticks
to *the wrapper*, not to the page, and can never slide under the app header. Worse, the obvious
\`top: var(--shell-header)\` then pushes the header row down *over* the first data row and hides it.
If the table must scroll horizontally, let the header scroll away with it. If a sticky header
matters more, drop the wrapper and let the page scroll — and accept that narrow screens will need a
different layout for that table entirely. \`--z-sticky\` is for the second case.

**Layering a translucent token.** \`--muted\` and the four \`--state-*\` tokens are washes, not
fills: they have no colour until something is behind them. Nesting one inside a surface usually
needs nothing — put \`background: var(--state-hover)\` on the row and it composites over the card it
sits in. But one element cannot take two \`background-color\`s, so when a wash needs to sit on a
*specific* surface rather than whatever it inherits — an opaque sticky table header being the case
that forces it, since rows would otherwise scroll visibly through it — stack them:

\`\`\`css
/* ✅ an opaque muted header: a surface underneath, the wash painted on top */
.table thead {
    background-color: var(--surface);
    background-image: linear-gradient(var(--muted), var(--muted));
}

/* ❌ the wash alone — transparent, so rows scroll through it */
.table thead { background: var(--muted); }
\`\`\`

**Asymmetric hover timing.** "Exits are faster than entrances" needs two declarations in CSS — the
base rule times the exit, the \`:hover\` rule times the entrance. One \`transition\` cannot do it:

\`\`\`css
.button {
    transition: background-color var(--duration-fast) var(--ease-out);
}
.button:hover {
    transition: background-color var(--duration-base) var(--ease-out);
}
\`\`\``
}

function wrongRight(resolved: ResolvedTokens): string {
    const primary = resolved.semantics.find((t) => t.name === "primary")
    const hex = primary?.values.light!.hex ?? "#000000"
    return `\`\`\`css
/* ❌ a raw value — invisible to theming, wrong in dark mode */
.button { background: ${hex}; color: white; }

/* ❌ a primitive — skips the layer that carries the meaning */
.button { background: var(--primary-700); }

/* ✅ */
.button { background: var(--primary); color: var(--primary-foreground); }
\`\`\`

\`\`\`css
/* ❌ dark-mode variants on top of tokens that already changed */
.card { background: var(--surface); }
.dark .card { background: #1f262d; }

/* ✅ nothing to do — --surface re-points itself under [data-theme="dark"] */
.card { background: var(--surface); }
\`\`\`

\`\`\`css
/* ❌ the same radius inside and out — the curves fight */
.card { border-radius: ${resolved.radius.lg}px; padding: 16px; }
.card > img { border-radius: ${resolved.radius.lg}px; }

/* ✅ concentric: inner = outer − padding */
.card > img { border-radius: ${Math.max(0, resolved.radius.lg - 16)}px; }
\`\`\`

\`\`\`css
/* ❌ faint text used for reading */
.caption { color: var(--foreground-tertiary); }

/* ✅ tertiary is for placeholders and watermarks; captions are muted */
.caption { color: var(--muted-foreground); }
\`\`\``
}

/**
 * Tokens that currently resolve to the same colour. Silence here is worse than
 * the collision: a distinction the docs promise but the values don't make is
 * unfalsifiable, and picking the wrong token looks correct until the ramp moves.
 */
function collisions(resolved: ResolvedTokens): string {
    const rows: string[] = []
    for (const mode of ["light", "dark"] as const) {
        const byHex = new Map<string, string[]>()
        for (const token of resolved.semantics) {
            // Keyed with the alpha, so a translucent token never gets reported
            // as "the same colour as" the opaque one it is derived from —
            // `--scrim` and `--foreground` share a hex and look nothing alike.
            const { alpha } = token[mode]
            const key = alpha === undefined ? token.values[mode]!.hex : `${token.values[mode]!.hex}@${alpha}`
            byHex.set(key, [...(byHex.get(key) ?? []), token.name])
        }
        for (const [hex, names] of byHex) {
            if (names.length < 2) continue
            rows.push(
                `| ${mode} | \`${hex}\` | ${names.map((name) => `\`--${name}\``).join(", ")} |`,
            )
        }
    }
    if (rows.length === 0) return "Every semantic token currently resolves to a distinct colour."
    return `These tokens share a value right now. They are still separate tokens with separate jobs —
use the one that describes your intent, because the values diverge the moment the ramp is re-tuned.

| Mode | Value | Tokens |
| --- | --- | --- |
${rows.join("\n")}`
}

/** What this system does NOT define. Say it, or every implementer invents it silently. */
const NOT_DEFINED = `The system stops here on purpose. These have **no tokens**, so if you need one,
pick a value, keep it consistent within the file you're writing, and flag it — do not present it as
part of the system:

- **Icon box size.** The icon *stroke* is specified (see the craft rules); the box is not. The
  stroke rule also covers weight 400 and 600 only, and every button uses \`label\` at weight 500.
- **The inside of the app frame.** \`--shell-*\` gives the sidebar, header, aside and table
  minimum; \`--z-*\` gives the stacking order. What they do *not* give is the furniture's own
  padding: nav item height, sidebar inset, table cell padding, dialog width. Those are still yours.
- **Emphasis on a card.** No token or recipe for marking one of several cards as recommended or
  selected. \`--primary\` as a border is the obvious move and it measures poorly against
  \`--surface\` — if you need it, verify it rather than assuming.
- **A wordmark treatment.** Even with a mark defined, nothing says which type role, weight or
  colour the brand name takes when it is set in type.
- **Font weights as standalone tokens.** Weight arrives with a type role and nothing else.
- **Loading animation.** \`--skeleton\` and \`--skeleton-surface\` give the colours; the sweep does
  not exist. There is no highlight colour to build a shimmer gradient from, and no duration long
  enough — the slowest token is \`--duration-slow\`, which is a UI transition, not a loop. Pick a
  loop duration and say so; do not reach for \`--duration-*\`.
- **Overlay geometry.** Dialog width and radius, tooltip placement and offset, dropdown width — all
  yours. The tokens say what colour and which layer, never how big or where.
- **The furniture's own padding.** \`--shell-*\` gives the sidebar and header their size and nothing
  about their insides: nav item height, sidebar padding, table cell padding. Two screens in the same
  app will not match unless you pick these once.
- **Which narrow-screen pattern the sidebar uses.** The widths are defined and the breakpoints are
  defined; whether the sidebar collapses to the icon rail or slides in as a drawer is not, and the
  two need different z-layers and different dismiss behaviour.
- **\`--opacity-loading\` has no documented consumer.** It exists and nothing in these docs tells you
  where it goes — skeletons are explicitly forbidden from using opacity. Treat it as available
  rather than as guidance.
- **Concentric radius when the parent has no radius.** The formula gives 0 for every child of an
  unrounded padded container — a sidebar, a page shell — which squares every nav item inside one.
  That follows from the rule; whether you want it is a judgement the rule does not make for you.
- **Blur.** Not modelled. (Opacity is — \`--opacity-disabled\` and \`--opacity-loading\` — but only
  those two, and neither is for live text.)
- **Theme persistence.** The attribute is defined; storing the choice, seeding it from the OS
  preference, and avoiding a flash on first paint are all yours.
- **Touch-target switching.** The craft rules ask for 44px on touch, but the breakpoint set is
  width-based and CSS cannot detect touch from it. Pick a rule and state it.`

/**
 * The mark and the typeface files. Neither was documented at all, which meant an
 * agent handed the export could not tell that a logo existed.
 */
function assetsSection(resolved: ResolvedTokens): string {
    const { meta, typography } = resolved.config
    const fonts = typography.fontFiles ?? []
    const parts: string[] = []

    if (meta.logoSvg) {
        parts.push(`### Logo

The mark ships as **inline SVG inside \`brand.json\`** rather than as a file, and that is a
functional choice, not a packaging one: inline means a path can be set to \`currentColor\`, so the
mark follows whatever text colour surrounds it and inverts in dark mode without a second asset.

**This mark is two-tone, so "set every fill to \`currentColor\`" is wrong for it.** Count the paths
before you place it. The wordmark path takes \`currentColor\` and follows the surrounding ink. The
accent path carries the brand's secondary at its anchor and is *meant* to stay that colour —
flattening it to \`currentColor\` turns the flourish into an ink blob sitting on the letters, which is
a visible defect rather than a subtle one.

\`\`\`html
<!-- OK: the wordmark follows the ink, the accent stays the brand colour -->
<span style="color: var(--foreground)">
    <svg viewBox="…">
        <path fill="currentColor" d="…"/>
        <path fill="var(--secondary-500, #f1760f)" d="…"/>
    </svg>
</span>
\`\`\`

**The accent fill is the one sanctioned exception to "never reference a primitive".** A mark is a
brand asset, not component code: the flourish is a specific drawn colour, not a semantic role, and
\`--secondary\` is the wrong answer because it resolves to a darkened step chosen to carry a label.
The literal after the comma is a fallback for contexts where \`tokens.css\` is not loaded — an email
client, a favicon pipeline. Do not copy this pattern into a component.

On a \`--primary\` or otherwise coloured field, set the wrapper's \`color\` to that fill's
\`-foreground\` so the wordmark stays legible, and check the accent against the fill by eye — it is
not in the validated set.`)
    } else if (meta.logoFile) {
        parts.push(`### Logo

The mark is a raster file, \`assets/${meta.logoFile}\`, and ships in the export beside the
stylesheet. It **cannot be recoloured**, so check it against \`--background\` in both modes before
placing it on a dark surface, and never place it on a \`--primary\` field without checking.`)
    } else {
        parts.push(`### Logo

**No mark is defined.** Set the brand name in type rather than inventing a logo, and say that you
did.`)
    }

    if (fonts.length > 0) {
        const families = [...new Set(fonts.map((font) => font.family))]
        parts.push(`### Typefaces

The font files ship in \`assets/\` and \`tokens.css\` already declares them — importing the
stylesheet is all that is required, there is no separate \`<link>\` to add.

${table(
            ["File", "Family", "Weight", "Style"],
            fonts.map((font) => [
                `\`assets/${font.fileName}\``,
                `\`--font-${font.family}\``,
                String(font.weight),
                font.style,
            ]),
        )}

The \`@font-face\` rules are named after the **first family in each stack** — ${families
            .map((family) => `\`${primaryFamily(typography.families[family] ?? "")}\``)
            .join(", ")} — not after the stack itself. If you regenerate those rules by hand, keep
that: a face declared as \`"${primaryFamily(typography.families.sans)}", ui-sans-serif, …\` matches
nothing and loads nothing, silently.

Keep \`assets/\` next to \`tokens.css\`. The \`src\` URLs are relative, so moving one without the
other leaves the page rendering in a fallback stack — which looks like a design decision rather
than a missing file.`)
    } else if ((typography.fontLinks ?? []).length > 0) {
        parts.push(`### Typefaces

No font files ship with this system. The faces are hosted, and \`<head>\` needs:

\`\`\`html
${(typography.fontLinks ?? []).map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}
\`\`\`

Without them the named families only render where they happen to be installed already, and
everything else falls back to the system stack.`)
    } else {
        parts.push(`### Typefaces

**No font files and no hosted links.** The families named above only render where they are already
installed; everywhere else falls back to the system stack. Either load them yourself or treat the
fallback as the design.`)
    }

    return parts.join("\n\n")
}

function layoutSection(resolved: ResolvedTokens): string {
    const { breakpoints, containers } = resolved.config.layout
    const smallest = breakpoints[0]
    const widest = [...containers].sort((a, b) => b.maxRem - a.maxRem)[0]

    return `The system is **mobile-first**. Base styles are the narrowest case, and every breakpoint is
an upgrade written as \`min-width\`. There are no \`max-width\` breakpoints: a system with both
directions has two sources of truth for the same layout, and they drift.

${table(
        ["Token", "Min width", "What changes here"],
        breakpoints.map((breakpoint) => [
            `\`--breakpoint-${breakpoint.name}\``,
            `${breakpoint.minPx}px`,
            breakpoint.note,
        ]),
    )}

CSS cannot read a custom property inside a media query, so **write the pixel value literally** and
treat the table above as the source of truth for which values are legitimate:

\`\`\`css
/* ✅ a breakpoint from the set */
@media (min-width: ${smallest?.minPx ?? 640}px) { … }

/* ❌ a number nobody agreed to */
@media (min-width: 900px) { … }

/* ❌ var() does not resolve here — the rule is silently ignored */
@media (min-width: var(--breakpoint-${smallest?.name ?? "sm"})) { … }
\`\`\`

If you use Tailwind, these are already its variants (\`md:\`, \`lg:\`) — the \`@theme\` block in
\`tokens.css\` defines them, so no config file is needed.

**Not everything in \`tokens.css\` is in that \`@theme\` block.** Colours, radius, spacing,
containers, shadows, easings, fonts, type roles and breakpoints are forwarded and become utilities.
\`--z-*\`, \`--shell-*\`, \`--duration-*\` and \`--opacity-*\` are **not** — Tailwind has no theme
namespace that turns them into utilities, so they stay plain custom properties. Use them as
\`z-index: var(--z-modal)\`, \`width: var(--shell-sidebar)\` and so on, in a stylesheet or an
arbitrary value like \`w-[var(--shell-sidebar)]\`. Reaching for \`duration-fast\` or \`z-modal\` as a
utility class gets you nothing, silently.

### Containers

Nothing spans the viewport. Every region sits in one of these, centred with \`margin-inline: auto\`.

${table(
        ["Token", "Max width", "Use it for"],
        containers.map((container) => [
            `\`--container-${container.name}\``,
            `${container.maxRem}rem (${container.maxRem * 16}px)`,
            container.note,
        ]),
    )}

**\`--container-prose\` is the one that gets skipped.** Running text set to the full width of a
laptop is unreadable regardless of how good the type is, so body copy takes \`prose\` even when it
sits inside a wider \`page\` frame. Nesting the two is normal:

\`\`\`css
.page { max-width: var(--container-page); margin-inline: auto; padding-inline: var(--space-6); }
.page > p { max-width: var(--container-prose); }
\`\`\`

Note that \`--container-${widest?.name ?? "wide"}\` (${widest?.maxRem ?? 90}rem) is wider than the
\`xl\` breakpoint, so it only has an effect on genuinely large displays.`
}

export function toDesignSystemMd(resolved: ResolvedTokens): string {
    const { config } = resolved
    const { meta } = config

    // Name the companion properties, not just their values: an agent that can't
    // see the token name will invent a number for line-height.
    const typeRows = config.typography.roles.map((role) => [
        `\`--text-${role.role}\``,
        // The family is part of applying a role, not a separate lookup. Omitting
        // this column is how a display face ends up rendered in the body font.
        `\`--font-${role.family}\``,
        role.minSizeRem === undefined
            ? `${role.sizeRem}rem`
            : `**fluid** ${role.minSizeRem}–${role.sizeRem}rem`,
        `\`--text-${role.role}--line-height\` · ${role.lineHeight}`,
        `\`--text-${role.role}--font-weight\` · ${role.weight}`,
        `\`--text-${role.role}--letter-spacing\` · ${role.tracking ?? "normal"}`,
    ])

    const motionRows = [
        ...Object.entries(config.motion.durations).map(([name, ms]) => [
            `\`--duration-${name}\``,
            `${ms}ms`,
        ]),
        ...Object.entries(config.motion.easings).map(([name, curve]) => [
            `\`--ease-${name}\``,
            `\`${curve}\``,
        ]),
    ]

    return `# ${meta.name} — design system

${meta.domain ? `For ${meta.domain}. ` : ""}Generated by Brand Forge from \`brands/${meta.slug}.json\`.
Do not edit this file by hand — edit the brand and re-export.
${meta.voice.length > 0 ? `\nThe voice is ${meta.voice.join(", ")}. Let that show in copy and restraint, not in decoration.\n` : ""}
## 🚨 Read this first — where this system contradicts the defaults

${deviations(resolved)
    .map((note) => `- ${note}`)
    .join("\n")}

## How the layers work

Two layers, and only one of them is yours to use.

**Primitives** — \`--primary-50\` … \`--primary-950\` across ${Object.keys(resolved.scales).length} ramps
(${Object.values(resolved.scales)
        .map((scale) => `\`${scale.role}\``)
        .join(", ")}), 11 steps each, generated in OKLCH. They exist so a human can tune colour.
**Do not reference them in code.**

**Semantics** — the ${resolved.semantics.length} tokens below. Every one aliases a primitive, and
re-points itself in dark mode. This is the whole API.

${GROUP_ORDER.map((group) => `### ${GROUP_TITLES[group]}\n\n${tokenTable(resolved, group)}`).join("\n\n")}

## Type

${table(["Token", "Family", "Size", "Line height", "Weight", "Tracking"], typeRows)}

Families: \`--font-sans\` is \`${config.typography.families.sans}\`, \`--font-mono\` is
\`${config.typography.families.mono}\`${
        config.typography.families.display
            ? `, and \`--font-display\` is \`${config.typography.families.display}\``
            : ""
    }.

${
        config.typography.families.display
            ? `**\`--font-display\` is a different typeface, not a bigger weight of the body font.** It is
drawn for size and belongs on the \`display\` role only. Do not set it on headings, buttons or body
copy${
                  (config.typography.fontFiles ?? []).some((file) => file.family === "display")
                      ? `, and note it ships in only ${[
                            ...new Set(
                                (config.typography.fontFiles ?? [])
                                    .filter((file) => file.family === "display")
                                    .map((file) => file.weight),
                            ),
                        ].join(", ")} — asking for a weight it doesn't have gets you a browser-synthesised fake bold, which looks wrong in a way people notice without being able to name`
                      : ""
              }.\n`
            : ""
    }${
        config.typography.roles.some((role) => role.minSizeRem !== undefined)
            ? `### Fluid roles

${config.typography.roles
                  .filter((role) => role.minSizeRem !== undefined)
                  .map(
                      (role) =>
                          `\`--text-${role.role}\` scales from **${role.minSizeRem}rem** to **${role.sizeRem}rem**`,
                  )
                  .join(", and ")} across the viewport range
${config.typography.fluidRange?.minPx ?? 390}px – ${config.typography.fluidRange?.maxPx ?? 1280}px.
Below and above that span they hold at the ends.

They emit a \`clamp()\`, so **there is nothing to do** — no media queries, no overrides. What you
must not do is replace one with a fixed size:

\`\`\`css
/* ✅ */
h1 { font-size: var(--text-display); }

/* ❌ pins the fluid role to its desktop size — a 56px heading on a phone */
h1 { font-size: 3.5rem; }
@media (min-width: 768px) { h1 { font-size: var(--text-display); } }
\`\`\`

The middle term of each \`clamp()\` deliberately mixes \`rem\` with \`vw\` rather than being pure
\`vw\`. Viewport units ignore the reader's font-size preference, so a \`vw\`-only heading refuses to
grow when someone zooms — a failure that is invisible on every device you own and obvious to
somebody who needs it.\n`
            : ""
    }

${
        config.typography.fontLinks && config.typography.fontLinks.length > 0
            ? `**The faces have to be loaded or the stack silently falls back to system fonts.** Put this in \`<head>\`:\n\n\`\`\`html\n${config.typography.fontLinks.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}\n\`\`\``
            : `**No webfont source is declared**, so the named families only render where they are already installed. Everything else falls back to the system stack. Load them yourself, or say so.`
    }

## Brand assets

${assetsSection(resolved)}

## Layout — breakpoints and containers

${layoutSection(resolved)}

## Space, radius, elevation

Spacing runs on a ${config.spacing.basePx}px grid, blessed subset only:
${config.spacing.blessed.map((px) => `\`--space-${spaceName(px, config.spacing.basePx)}\` (${px}px)`).join(", ")}.

Radius derives from a single ${config.radius.basePx}px base:
${Object.entries(resolved.radius)
        .map(([step, px]) => `\`--radius-${step}\` ${step === "full" ? "9999px" : `${px}px`}`)
        .join(", ")}.

**Concentric radius.** \`inner = outer − padding\`, floored at 0.
A card at \`--radius-lg\` (${resolved.radius.lg}px) with \`--space-4\` (16px) padding holds children at ${Math.max(0, resolved.radius.lg - 16)}px.

**It governs boxes flush against the parent's inner edge — nothing else.** Flush means touching the
padding on both sides. An element that floats inside the padding with space around it — a badge, an
inline \`<code>\`, a chip, an auto-width button — is not concentric with anything and keeps its own
radius. **A full-width control is flush and does follow the formula**, even though it is a control:
a stretched button at the bottom of a card squares off, the same button sized to its label does not.

Everything full-width inside a padded card *is* flush, and that is most of a form: inputs, banners,
nested panels, tables. Inside this card (\`--radius-lg\` ${resolved.radius.lg}px, \`--space-6\` 24px
padding) the formula gives 0, so **those elements are square**, and the recipes below that specify
\`--radius-md\` for an Input or an Alert describe them standing on the page, not nested in a card.
When the two disagree, concentric wins — it is the more specific statement.

If square-edged fields inside rounded cards is not the look you want, that is a real tension and the
fix is a smaller card radius or a padding change, not an exception. Note the formula can also
produce values off the radius scale (a 15px panel with 8px padding gives 7px); that is expected —
use the computed number, don't snap it.

Elevation is \`--shadow-sm\` | \`--shadow-raised\` | \`--shadow-overlay\`, and the last two are named for the surface they pair with — \`--surface-raised\` and \`--surface-overlay\`. Never mix a surface with another level's shadow. In dark mode
\`--shadow-sm\` becomes a hairline ring and nothing else — but \`--shadow-raised\` and
\`--shadow-overlay\` keep a real drop shadow *and* gain a ring, because at those levels the surface
lift alone is not enough separation. Do not assume "dark mode has no shadows"; check the token.
Use shadow for things that float and \`--border\` for things that divide; never both for the same
job.

## Motion

${table(["Token", "Value"], motionRows)}

Enter with \`--duration-base\` and \`--ease-out\`; leave with \`--duration-fast\`. Exits are always
quicker than entrances. Name the properties you transition — never \`transition: all\`.

## Component recipes

${componentRecipes(resolved)}

## Wrong and right

${wrongRight(resolved)}

## Tokens that currently share a value

${collisions(resolved)}

## What this system does not define

${NOT_DEFINED}

## Editorial — running text, figures and code

The component recipes above are app-shaped: buttons, cards, tables, dialogs. A page that is mostly
*prose* needs different answers, and until run 6 this section did not exist, so roughly seventy per
cent of a content page had nothing behind it.

None of this is new tokens. It is the existing spacing scale and type roles composed for reading.

**Measure.** Running text takes \`--container-prose\`. Large type — a hero headline, a section
intro, a pull quote — takes \`--container-intro\` (52rem), which exists because a display headline
wraps to five lines at the reading measure and is unreadable at page width. Both nest inside a
wider frame; neither ever spans the viewport.

**Vertical rhythm.** Space below a heading is always smaller than the space above it, so a heading
belongs to the text it introduces rather than floating between two blocks:

\`\`\`css
p                { margin-block: var(--space-6); }        /* 24px */
h2               { margin-block: var(--space-16) var(--space-4); }  /* 64px above, 16px below */
h3               { margin-block: var(--space-12) var(--space-3); }
figure, pre      { margin-block: var(--space-8); }
blockquote       { margin-block: var(--space-12); }
li               { margin-block: var(--space-2); }
\`\`\`

**Lists.** \`padding-left: var(--space-6)\`. Set the marker in \`--muted-foreground\`, not
\`--foreground-tertiary\` — tertiary is below the reading threshold and a marker is part of the
sentence.

**Blockquote.** A \`3px\` rule in \`--border-strong\` on the leading edge, \`padding-left:
var(--space-6)\`, set at \`body-lg\`. Attribution goes in \`body-sm\` / \`--muted-foreground\`. Do
not italicise the whole quote; long italic runs are slower to read.

**Figures and media.** Caption in \`body-sm\` / \`--muted-foreground\`, \`margin-top:
var(--space-3)\`. A full-width figure sits in \`--container-wide\`; a figure in the text column stays
in \`--container-prose\`.

**A placeholder standing in for an image must be \`--muted\`, not \`--surface-sunken\`.** Sunken is
opaque and collapses into \`--background\` in dark mode, so the placeholder disappears and only its
border survives. \`--muted\` is translucent and reads on any surface in both modes.

**Code.** Inline \`code\` takes \`--muted\`, \`--radius-sm\` and \`--font-mono\`; size it relatively
(\`0.9em\`) rather than with \`--text-code\`, because a fixed 0.875rem next to 1rem body text sits
visibly small mid-sentence. A fenced block takes \`--muted\`, \`--radius-md\`, \`padding:
var(--space-4)\`, and \`overflow-x: auto\` with \`tabindex="0"\` so it can be scrolled by keyboard —
which then needs a focus ring like any other focusable thing.

**Button sizes.** The Button recipe above is the default: 40px, \`label\`. A marketing call to action
at 13px is not a call to action. A large button is 52px tall, \`padding-inline: var(--space-8)\`, set
at \`body-lg\` with the \`label\` weight — same colours, same radius, same states. There is no
third size.

**The mark has a floor.** Below about 24px of height the accent path stops reading as a flourish and
becomes a smudge against the wordmark. Above that it is fine. If you need the brand smaller than
that, use the wordmark path alone.

**Container gutter.** \`padding-inline: var(--space-6)\`, widening to \`var(--space-8)\` from the
\`md\` breakpoint. A container caps width; it does not give itself breathing room at the edge of a
phone.

## Stacking order

Every layer that can overlap another has a number here. Writing a raw \`z-index\` is how two
components end up fighting and the loser is whoever shipped last.

${table(
        ["Token", "Value", "What lives here"],
        resolved.config.layout.zLayers.map((layer) => [`\`--z-${layer.name}\``, String(layer.value), layer.note]),
    )}

Two of these are load-bearing and easy to get wrong. \`--z-modal\` sits **ten** above \`--z-scrim\`,
not a hundred: a dialog belongs immediately on top of its own backdrop and nothing should ever land
between them. And \`--z-toast\` deliberately outranks \`--z-modal\` — a confirmation that renders
behind the dialog that triggered it is invisible exactly when someone needs it.

## App frame

\`--container-*\` bounds the page. These bound its furniture — the numbers every implementation
otherwise invents, differently, on each screen.

${table(
        ["Token", "Value", "What it is"],
        resolved.config.layout.shell.map((dimension) => [
            `\`--shell-${dimension.name}\``,
            `${dimension.rem}rem (${dimension.rem * 16}px)`,
            dimension.note,
        ]),
    )}

## Contrast

Text pairs are validated with APCA (Lc), which unlike WCAG 2 models dark-mode perception correctly.
**Each pair is held to the threshold for its own job, not to a single number:** Lc 75 for body text,
Lc 60 for UI labels and large text, Lc 25 for non-text boundaries.

${(() => {
        const contrast = resolved.warnings.filter((w) => w.kind === "contrast")
        if (contrast.length > 0) {
            return `**${contrast.length} pair${contrast.length === 1 ? "" : "s"} in this brand currently miss${contrast.length === 1 ? "es" : ""} its threshold**, listed here because nothing else in this bundle carries them:

${contrast.map((warning) => `- ${warning.message}`).join("\n")}

Do not treat the affected values as validated until they are cleared.`
        }
        return `Every **validated** pair clears its own threshold, in both modes. Three things that
sentence does not mean:

- It is not "every pair clears 75". Labels on solid fills and \`--foreground-secondary\` are held to
  the Lc 60 bar and sit well below the body target — correct for their job, wrong for small body
  copy. Set supporting text below \`body-lg\` in \`--muted-foreground\`.
- \`--border-subtle\` and \`--foreground-tertiary\` are **deliberately exempt**. Both are defined as
  below the visible threshold, so they are not validated and never will be. Neither may be the only
  thing carrying meaning — \`--border-subtle\` separates rows inside an already-bounded table, it
  does not divide two regions.
- Pairs nobody declared are not checked. If you compose a combination the token descriptions don't
  sanction — \`--primary\` as body text, \`--muted-foreground\` on \`--surface-raised\` — you are
  outside the validated set and should measure it yourself.

**"Large text" means \`body-lg\` (1.125rem) and up at weight 400, or \`body\` and up at weight 600.**
Below that, the Lc 75 body bar applies.`
    })()}

\`--foreground-tertiary\` is deliberately below the reading threshold. It is for placeholders and
watermarks. If you find yourself wanting it for text a person must read, use \`--muted-foreground\`.
`
}

/** Rough LLM token count — a budget meter for the export dialog. */
export const estimateTokens = (text: string): number => Math.round(text.length / 3.6)
