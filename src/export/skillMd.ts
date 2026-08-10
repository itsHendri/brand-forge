/**
 * SKILL.md — the procedural half of the export.
 *
 * DESIGN_SYSTEM.md tells an agent what exists; this tells it what to do, in the
 * imperative, with exact values and no room to interpret. It is deliberately
 * short: precision beats volume, and the reference file is one hop away when
 * detail is actually needed.
 */

import { POLISH_RULES } from "../engine/defaults"
import type { ResolvedTokens } from "../engine/types"

export function toSkillMd(resolved: ResolvedTokens): string {
    const { config } = resolved
    const { meta } = config
    const enabled = POLISH_RULES.filter((rule) => config.rules.polish[rule.id])

    const statusNames = ["success", "warning", "danger", "info"]

    return `---
name: ${meta.slug}-brand
description: Build UI in the ${meta.name} design system. Use whenever writing or reviewing components, pages, styles or markup for ${meta.domain ?? meta.name} — including colour, type, spacing, radius, elevation and motion decisions.
---

# ${meta.name} — build in this system

You are writing UI for ${meta.name}${meta.domain ? ` (${meta.domain})` : ""}. Its tokens are already
defined. Your job is to compose them, never to invent values.

Full token tables, component recipes and wrong/right pairs live in
\`references/DESIGN_SYSTEM.md\`. Read it before writing anything non-trivial.

## Before you write a line

1. Check that \`tokens.css\` is imported${
        (config.typography.fontFiles ?? []).length > 0
            ? ` and that \`assets/\` sits beside it — the \`@font-face\` \`src\` URLs are relative, and moving one without the other silently drops the page to a fallback stack`
            : ""
    }. Dark mode is \`data-theme="dark"\` on \`<html>\`; light is either \`data-theme="light"\` or no
   attribute at all — both are defined, so a toggle can write either value or remove it.${
       config.meta.logoSvg
           ? `\n   The brand mark is inline SVG in \`brand.json\`. Its wordmark path takes \`currentColor\` so it follows the surrounding ink and inverts in dark mode — but check whether the mark has an accent path before you rewrite every fill, because flattening a two-tone mark to one colour is a visible defect. See Logo in the reference.`
           : config.meta.logoFile
             ? `\n   The brand mark is \`assets/${config.meta.logoFile}\`. It cannot be recoloured — check it against whatever surface you put it on.`
             : ""
   }
2. Work out which semantic tokens the thing you're building needs. If you cannot name them, you do
   not understand the component yet.
3. If no semantic token fits, **say so and stop**. Do not reach for a primitive or invent a hex.

## Hard rules

1. **Never write a colour literal.** No hex, \`rgb()\`, \`hsl()\` or \`oklch()\` in component code.
   Every colour is \`var(--<semantic>)\`.
2. **Never reference a primitive** (\`--primary-600\`, \`--neutral-200\`). Primitives are for tuning
   the ramp, not for building. Semantics only.
3. **Never write a dark-mode colour override.** Tokens re-point themselves under
   \`[data-theme="dark"]\`. A \`dark:\` colour variant means you used the wrong token.
4. **Surfaces are a ladder, and each level owns its shadow.** From the bottom:
   \`--surface-sunken\` (a well — a kanban column, an inset panel), \`--background\` (the page),
   \`--surface\` (a card), \`--surface-raised\` (a card that lifts — pair with \`--shadow-raised\`),
   \`--surface-overlay\` (modals, dropdowns, popovers — pair with \`--shadow-overlay\`). Never mix a
   surface with another level's shadow. There is no \`--card\` or \`--popover\`.
   Two levels coincide, in one mode each, and both are deliberate: in **light** mode raised and
   overlay are the same fill as \`--surface\`, because nothing is whiter than white and the shadow
   carries the elevation; in **dark** mode \`--surface-sunken\` is the same fill as \`--background\`,
   because nothing on the ramp is darker. Use the named token anyway — it is correct in the other
   mode, and hard-coding the one it collapses to breaks when the theme flips.
   \`--muted\` is a translucent quiet fill (table headers, inactive tabs, code blocks), not a level:
   layer it over whichever surface it sits on.
5. **Text:** \`--foreground\` for body and headings, \`--foreground-secondary\` for supporting copy,
   \`--muted-foreground\` for captions and metadata. \`--foreground-tertiary\` is below the reading
   threshold — placeholders and watermarks only.
6. **On a solid fill, use its paired \`-foreground\`.** \`--primary\` takes
   \`--primary-foreground\`; \`--danger\` takes \`--danger-foreground\`. The polarity differs between
   fills on purpose — some are light, some dark. Do not unify them.
   **This extends to everything inside that fill**, not just the label: a button on a \`--primary\`
   band takes \`--primary-foreground\` for its text *and* its border, because \`--foreground\` is
   dark ink and unreadable there. Never soften the result with \`opacity\` — the pair was
   contrast-checked at full strength.
7. **Status is ${statusNames.join(", ")}** — not \`destructive\`. A banner is
   \`--<status>-subtle\` + \`--<status>-subtle-foreground\` + \`--<status>-border\`, and so is a
   badge. The solid \`--<status>\` is for things that act or plot — buttons, status dots, chart
   series — never for text on a page background.
8. **Interaction:** every solid fill has its own hover and pressed token —
   \`--primary-hover\`/\`--primary-active\`, \`--secondary-*\`, and one per status
   (\`--danger-hover\` for a destructive button). Neutral surfaces use \`--state-hover\` /
   \`--state-active\`, and the current item is \`--state-selected\`. Never compute a hover colour
   with \`filter: brightness()\` or an opacity overlay.
   **The four \`--state-*\` tokens are translucent washes, not fills.** Layer one over the surface
   the element already has — \`background: var(--surface)\` then \`background: var(--state-hover)\`
   on \`:hover\` works because the wash composites over whatever is behind it. That is why one token
   covers every level of the surface ladder instead of needing one per level:
   it is a mid grey, so it darkens every light surface and lightens every dark one. Do not put one
   on a coloured fill — they are calibrated against the neutral surfaces only, and a brand fill has
   its own \`-hover\` and \`-active\`. They have no \`-foreground\` of their own either: text keeps
   the colour it had.
9. **Focus is never removed, and there are three rings.** \`outline: 2px solid var(--ring);
   outline-offset: 2px\` on \`:focus-visible\` for anything on a neutral ground. On a coloured or
   inverted fill \`--ring\` is the brand colour itself and disappears into its own background —
   use \`--ring-inverse\` there. When a focusable element can land on either kind of ground, draw
   both: \`box-shadow: 0 0 0 2px var(--ring-inset), 0 0 0 4px var(--ring)\`, so whichever half
   matches the ground, the other one is still visible.
10. **Links in body copy are \`--link\`, underlined.** Not \`--primary\` — that is a fill colour and
    is a fill and does not survive as text on a page. Hover is \`--link-hover\`, which gains contrast
    rather than losing it. **The underline is required, not stylistic** — colour alone must never be
    the only marker of a link (WCAG 1.4.1), and on some palettes \`--link\` is separated from
    \`--foreground\` by hue alone, which disappears in greyscale. The reference gives the measured
    figures for this brand. Inside an inverse region use \`--link-inverse\`.
11. **An inverse region is opposite to the mode, not fixed dark.** \`--inverse\` is a tooltip, a
    dark chip, a footer band — dark on a light page and *light* on a dark one. Everything inside it
    takes \`--inverse-foreground\`, \`--inverse-border\`, \`--link-inverse\`, \`--ring-inverse\`.
    The page-measured tokens are unreadable in there.
12. **Overlays and loading.** A modal backdrop is \`--scrim\`. Do not substitute a hex for it: like
    the state washes and \`--muted\` it is translucent, and the hex in the token table is the colour
    *before* its alpha is applied. A loading placeholder is \`--skeleton\` blocks on a
    \`--skeleton-surface\` container; animate it with a background-position sweep, never with
    \`opacity\`. The only blessed opacities are \`--opacity-disabled\` and \`--opacity-loading\`,
    and neither is for live text — fading text defeats the contrast audit, because the result
    depends on a ground the system cannot see.
13. **Stacking order is a closed set:**
    ${config.layout.zLayers.map((l) => `\`--z-${l.name}\` ${l.value}`).join(", ")}. Never write a raw
    \`z-index\`, and never invent a number between two of them without saying why. The pairing that
    matters: \`--z-modal\` is ten above \`--z-scrim\`, not a hundred, because a dialog belongs
    immediately on top of its own backdrop. \`--z-toast\` outranks \`--z-modal\` on purpose — a
    confirmation rendered behind the dialog that triggered it is invisible when it matters most.
14. **The app frame has fixed dimensions too:**
    ${config.layout.shell.map((d) => `\`--shell-${d.name}\` ${d.rem}rem`).join(", ")}. \`--container-*\`
    bounds the page; these bound its furniture. A sidebar, a header height or a table's minimum width
    invented per-screen is how two pages in the same app stop lining up.
15. **Spacing comes from the blessed subset only:**
    ${config.spacing.blessed.map((px) => `${px}px`).join(", ")}. Nothing between them.
16. **Breakpoints are mobile-first and closed:**
    ${config.layout.breakpoints.map((b) => `${b.minPx}px (\`${b.name}\`)`).join(", ")}. Write base
    styles for the narrowest case and add \`min-width\` queries on top. Never a \`max-width\`
    breakpoint, never a number outside this set, and never \`var(--breakpoint-*)\` inside a media
    query — custom properties do not resolve there and the rule is dropped in silence.
17. **No content spans the viewport.** Every region's content sits in a container, centred with
    \`margin-inline: auto\`: ${config.layout.containers.map((c) => `\`--container-${c.name}\` (${c.maxRem}rem)`).join(", ")}.
    Running text takes \`--container-prose\` even inside a wider frame — a full-bleed paragraph is a
    bug, not a stylistic choice. Backgrounds and borders may span the window; a sticky bar is a
    full-bleed background with contained content inside it.
18. **Radius:** \`--radius-sm\` ${resolved.radius.sm}px, \`--radius-md\` ${resolved.radius.md}px,
    \`--radius-lg\` ${resolved.radius.lg}px, \`--radius-xl\` ${resolved.radius.xl}px. A rounded box
    inside another uses \`inner = outer − padding\`, floored at 0.
19. **Type is role-named.** Use \`--text-body\`, \`--text-heading\`, \`--text-label\` and friends.
    Heading *level* is about document outline; heading *size* is about the role token. Never size
    text with an arbitrary rem value.${
        config.typography.roles.some((role) => role.minSizeRem !== undefined)
            ? `\n    ${config.typography.roles
                  .filter((role) => role.minSizeRem !== undefined)
                  .map((role) => `\`--text-${role.role}\``)
                  .join(" and ")} are **fluid** — they already scale with the viewport. Never pin
    them to a fixed size or wrap them in a media query; both throw the scaling away.`
            : ""
    }${
        config.typography.families.display
            ? `\n    \`--font-display\` is a separate typeface for the \`display\` role only — not a
    heavier weight of the body font, and not for headings or UI.`
            : ""
    }
20. **Motion:** \`--duration-fast\` ${config.motion.durations.fast}ms,
    \`--duration-base\` ${config.motion.durations.base}ms, easing \`--ease-out\` for entrances.
    Exits are faster than entrances. Never \`transition: all\` — name the properties.

## Craft rules

${enabled.map((rule, i) => `${i + 1}. **${rule.title}.** ${rule.rule}`).join("\n")}

## Reviewing existing code

Report findings in this shape, most severe first, and nothing else:

| Severity | Location | Now | Should be | Why |
|---|---|---|---|---|

Severity is **blocking** for a hardcoded value, a missing focus style or unreadable text;
**should-fix** for the wrong token with adequate contrast; **polish** for a craft rule.

Verify before you claim: a colour literal anywhere in component code is blocking, and
\`grep -nE '#[0-9a-fA-F]{3,8}|rgb\\(|hsl\\(|oklch\\(' <files>\` finds them. If you changed anything,
say which rule each change served.
`
}
