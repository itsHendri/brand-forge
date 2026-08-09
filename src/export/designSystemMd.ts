/**
 * DESIGN_SYSTEM.md — the declarative reference an agent reads before it writes.
 *
 * Written deviation-first. A model arrives with strong priors (shadcn's token
 * names, Tailwind's spacing, `h1`-style type roles); the highest-value content
 * is therefore where THIS system contradicts those priors, not where it agrees.
 * Everything is a copy-pasteable value, and every rule that can be shown wrong
 * as well as right is.
 */

import { spaceName } from "../engine/defaults"
import type { ResolvedTokens, SemanticGroup } from "../engine/types"

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
    state: "Interactive states",
    border: "Borders and focus",
    brand: "Brand",
    status: "Status",
}

const GROUP_ORDER: SemanticGroup[] = ["surface", "text", "state", "border", "brand", "status"]

function table(headers: string[], rows: string[][]): string {
    const head = `| ${headers.join(" | ")} |`
    const rule = `| ${headers.map(() => "---").join(" | ")} |`
    const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n")
    return [head, rule, body].join("\n")
}

/**
 * Where this system contradicts a default assumption. Computed, not authored,
 * so it can't go stale when the brand changes.
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
        `**Dark mode is an attribute, not a media query.** Every token re-points under \`[data-theme="dark"]\`. Set that attribute on \`<html>\`; do not write \`dark:\` variants of colour utilities — the token already changed.`,
    )

    out.push(
        `**Never use a primitive (\`--${resolved.scales.primary?.role ?? "primary"}-600\`) in a component.** Primitives exist so a human can tune the ramp. Components and generated code use semantics only. If no semantic fits, say so rather than reaching past the layer.`,
    )

    if (config.radius.basePx !== 8) {
        out.push(
            `**Radius is derived from one base of ${config.radius.basePx}px**, not from Tailwind's defaults: \`--radius-sm\` ${resolved.radius.sm}px, \`--radius-md\` ${resolved.radius.md}px, \`--radius-lg\` ${resolved.radius.lg}px, \`--radius-xl\` ${resolved.radius.xl}px.`,
        )
    }

    const breakpointList = config.layout.breakpoints
        .map((breakpoint) => `${breakpoint.minPx}px (\`${breakpoint.name}\`)`)
        .join(", ")
    out.push(
        `**Breakpoints are a closed set and mobile-first only:** ${breakpointList}. Any other number is not a breakpoint, and there are no \`max-width\` breakpoints. \`var(--breakpoint-*)\` does not work inside a media query — write the pixel value.`,
    )

    out.push(
        `**No content spans the viewport.** Every region's *content* sits in a \`--container-*\`, centred with \`margin-inline: auto\`, and running text takes \`--container-prose\` even inside a wider frame. Backgrounds and borders may still go full-bleed — a sticky top bar or a footer rule spans the window while the things inside it stay contained. A full-bleed paragraph is a bug; a full-bleed background is not.`,
    )

    const blessed = config.spacing.blessed
    out.push(
        `**Spacing is a blessed subset, not every multiple of ${config.spacing.basePx}.** Only ${blessed.map((px) => `\`--space-${spaceName(px, config.spacing.basePx)}\` (${px}px)`).join(", ")} exist. A value between two of them is a bug, not a refinement.`,
    )

    out.push(
        `**Type roles are named for their job**, never \`h1\`/\`h2\`/\`text-2xl\`: ${config.typography.roles.map((role) => `\`--text-${role.role}\``).join(", ")}. Heading level is semantics for the document outline; size comes from the role token.`,
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

function tokenTable(resolved: ResolvedTokens, group: SemanticGroup): string {
    const rows = resolved.semantics
        .filter((token) => token.group === group)
        .map((token) => [
            `\`--${token.name}\``,
            `\`${token.values.light!.hex}\``,
            `\`${token.values.dark!.hex}\``,
            token.description,
        ])
    return table(["Token", "Light", "Dark", "Use it for"], rows)
}

function componentRecipes(resolved: ResolvedTokens): string {
    const r = resolved.radius
    const cardInner = Math.max(0, r.lg - 24)
    return `Component tokens deliberately do not exist. Compose these instead — the values below are
exact, not indicative.

**Applying a type role.** \`--text-body\` is a bare length, so the \`font\` shorthand will not take
it — \`font: var(--text-body)\` is invalid CSS and is dropped silently, leaving an unstyled element
and no console error. Every role ships four properties; set them individually:

\`\`\`css
.button {
    font-family: var(--font-sans);
    font-size: var(--text-label);
    line-height: var(--text-label--line-height);
    font-weight: var(--text-label--font-weight);
    letter-spacing: var(--text-label--letter-spacing);
}
\`\`\`

**Button (primary)** — \`background: var(--primary)\`, \`color: var(--primary-foreground)\`,
\`border-radius: var(--radius-md)\` (${r.md}px), height 40px, padding \`0 var(--space-4)\`, type role
\`label\`. Hover swaps the background to \`--primary-hover\`, active to \`--primary-active\`. Focus
adds \`outline: 2px solid var(--ring); outline-offset: 2px\`. The 40px height is the dense-desktop
minimum; on touch, raise it to 44px or extend the hit area with a pseudo-element.

**Button (secondary)** — identical, with \`--secondary\` / \`--secondary-foreground\`.

**Button (outline)** — \`background: transparent\`, \`color: var(--foreground)\`,
\`border: 1px solid var(--input)\`. Transparent, not \`--surface\`: an outline button sits inside
cards as often as on the page, and a fixed fill makes it vanish against whichever one it didn't
expect. Hover fills with \`--state-hover\`.

**Card** — \`background: var(--surface)\`, \`border: 1px solid var(--border)\`,
\`border-radius: var(--radius-lg)\` (${r.lg}px), \`padding: var(--space-6)\`. **No shadow**: the
border is already doing the structural job, and \`--shadow-sm\` carries its own hairline layer, so
using both doubles the edge — visibly so in dark mode, where the shadow *is* a ring. Save
\`--shadow-lg\` for things that genuinely float (popovers, dialogs) and give those no border.
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
table scroll inside the page rather than making the page scroll.

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
            const hex = token.values[mode]!.hex
            byHex.set(hex, [...(byHex.get(hex) ?? []), token.name])
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
- **Link colour in body copy.** There is no \`--link\`. **Do not reach for \`--primary\`** — it is a
  fill, and as text on a dark background it is unreadable. \`--primary-subtle-foreground\` is the
  brand ink that survives both modes; it is off-label but it measures.
- **App-shell dimensions.** No sidebar or column widths, no header height, no z-index scale, no
  minimum table width. \`--container-*\` bound the page frame, not its interior.
- **Font weights as standalone tokens.** Weight arrives with a type role and nothing else.
- **Opacity and blur.** Not modelled at all.
- **Theme persistence.** The attribute is defined; storing the choice, seeding it from the OS
  preference, and avoiding a flash on first paint are all yours.
- **Touch-target switching.** The craft rules ask for 44px on touch, but the breakpoint set is
  width-based and CSS cannot detect touch from it. Pick a rule and state it.`

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
        `${role.sizeRem}rem`,
        `\`--text-${role.role}--line-height\` · ${role.lineHeight}`,
        `\`--text-${role.role}--font-weight\` · ${role.weight}`,
        role.tracking ? `\`--text-${role.role}--letter-spacing\` · ${role.tracking}` : "—",
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

${table(["Token", "Size", "Line height", "Weight", "Tracking"], typeRows)}

Families: \`--font-sans\` is \`${config.typography.families.sans}\`, \`--font-mono\` is
\`${config.typography.families.mono}\`.

${
        config.typography.fontLinks && config.typography.fontLinks.length > 0
            ? `**The faces have to be loaded or the stack silently falls back to system fonts.** Put this in \`<head>\`:\n\n\`\`\`html\n${config.typography.fontLinks.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")}\n\`\`\``
            : `**No webfont source is declared**, so the named families only render where they are already installed. Everything else falls back to the system stack. Load them yourself, or say so.`
    }

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

**It governs boxes flush against the parent's inner edge — nothing else.** An element that floats
inside the padding with space on every side — a badge, an inline \`<code>\`, a chip, a button — is
not concentric with anything and keeps its own radius.

Everything full-width inside a padded card *is* flush, and that is most of a form: inputs, banners,
nested panels, tables. Inside this card (\`--radius-lg\` ${resolved.radius.lg}px, \`--space-6\` 24px
padding) the formula gives 0, so **those elements are square**, and the recipes below that specify
\`--radius-md\` for an Input or an Alert describe them standing on the page, not nested in a card.
When the two disagree, concentric wins — it is the more specific statement.

If square-edged fields inside rounded cards is not the look you want, that is a real tension and the
fix is a smaller card radius or a padding change, not an exception. Note the formula can also
produce values off the radius scale (a 15px panel with 8px padding gives 7px); that is expected —
use the computed number, don't snap it.

Elevation is \`--shadow-sm\` | \`--shadow-md\` | \`--shadow-lg\` | \`--shadow-overlay\`. In dark mode
these become a hairline ring rather than a drop shadow — depth there comes from surface lightness,
which \`--surface\` and \`--surface-raised\` already provide. Use shadow for things that float and
\`--border\` for things that divide; never both for the same job.

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

## Contrast

Text pairs are validated with APCA (Lc), which unlike WCAG 2 models dark-mode perception correctly.
**Each pair is held to the threshold for its own job, not to a single number:** Lc 75 for body text,
Lc 60 for UI labels and large text, Lc 25 for non-text boundaries.

${(() => {
        const contrast = resolved.warnings.filter((w) => w.kind === "contrast")
        if (contrast.length > 0) {
            return `**${contrast.length} pairs currently miss their threshold** — see the brand's warnings. Do not treat the values in this file as validated until they are cleared.`
        }
        return `Every pair clears **its own** threshold — text and non-text alike, in both modes. That is not the same as every pair clearing 75: labels on solid fills and \`--foreground-secondary\` are held to the Lc 60 bar and sit well below the body target, which is correct for their job and wrong for small body copy. Set supporting text below \`body-lg\` in \`--muted-foreground\`.`
    })()}

\`--foreground-tertiary\` is deliberately below the reading threshold. It is for placeholders and
watermarks. If you find yourself wanting it for text a person must read, use \`--muted-foreground\`.
`
}

/** Rough LLM token count — a budget meter for the export dialog. */
export const estimateTokens = (text: string): number => Math.round(text.length / 3.6)
