/**
 * Craft defaults that hold for any brand — the universal layer beneath the
 * brand-specific values. Brand config overrides these; they are never silent.
 */

import type { BrandConfig, Breakpoint, Container, RadiusStep, TypeRole } from "./types"

/**
 * Mobile-first min-widths. The values are the industry-standard set — the ones
 * Tailwind ships and every developer and model already has in their head — so
 * they cost nothing to learn and interoperate for free.
 *
 * There is no `xs`: the narrowest case is the base styles, not a breakpoint.
 */
export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
    { name: "sm", minPx: 640, note: "Large phones in portrait. Rarely a layout change on its own." },
    { name: "md", minPx: 768, note: "Tablet. Side-by-side content becomes possible; nav can unfold." },
    { name: "lg", minPx: 1024, note: "Laptop. Multi-column layouts and persistent sidebars." },
    { name: "xl", minPx: 1280, note: "Desktop. Wider gutters, more columns — rarely bigger type." },
]

/**
 * Max-widths, named for the job. `prose` is the one people skip and shouldn't:
 * a paragraph running the full width of a laptop is unreadable no matter how
 * good the type is.
 */
export const DEFAULT_CONTAINERS: Container[] = [
    { name: "prose", maxRem: 42, note: "Running text. ~70 characters at body size — the readable measure." },
    { name: "narrow", maxRem: 30, note: "Forms, dialogs, sign-in — anything with one column of controls." },
    { name: "page", maxRem: 72, note: "The default page frame. Most layouts live here." },
    { name: "wide", maxRem: 90, note: "Dashboards and tables that genuinely need the room." },
]

/**
 * Radius derives from ONE knob. Set base to 0 and the whole system goes sharp;
 * set it to 16 and everything softens together. Proportional (not shadcn's
 * base±4px) so base 0 stays genuinely square instead of going negative.
 */
export function deriveRadius(
    basePx: number,
    overrides: Partial<Record<RadiusStep, number>> = {},
): Record<RadiusStep, number> {
    const derived: Record<RadiusStep, number> = {
        sm: Math.round(basePx * 0.5),
        md: basePx,
        lg: Math.round(basePx * 1.5),
        xl: Math.round(basePx * 2),
        full: 9999,
    }
    return { ...derived, ...overrides }
}

/**
 * Concentric radius: a rounded box inside another rounded box must use
 * `outer − padding`, or the two curves fight. Square off at ≤ 0.
 * Only meaningful for padding ≤ 24px; beyond that treat the surfaces separately.
 */
export function concentricInner(outerPx: number, paddingPx: number): number {
    return Math.max(0, outerPx - paddingPx)
}

/** 4px grid. The blessed subset — not every multiple, just the ones we actually use. */
export const DEFAULT_SPACING = { basePx: 4, blessed: [4, 8, 12, 16, 24, 32, 48, 64, 96] }

/** Names follow Tailwind's px/4 numbering so `--space-6` is 24px, as expected. */
export const spaceName = (px: number, basePx = 4): string => String(px / basePx)

export const DEFAULT_MOTION: BrandConfig["motion"] = {
    durations: { instant: 100, fast: 150, base: 200, slow: 320 },
    easings: {
        out: "cubic-bezier(0.2, 0, 0, 1)",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
}

/**
 * Elevation. Light mode uses layered shadows; dark mode gets a hairline ring
 * instead, because shadows are invisible on a dark ground — depth there comes
 * from surface lightness, which the neutral ramp already provides.
 */
export const DEFAULT_SHADOWS: BrandConfig["shadows"] = {
    levels: [
        {
            name: "sm",
            layers: ["0 1px 2px -1px oklch(0 0 0 / 0.08)", "0 0 0 1px oklch(0 0 0 / 0.04)"],
        },
        {
            name: "md",
            layers: [
                "0 0 0 1px oklch(0 0 0 / 0.05)",
                "0 1px 2px -1px oklch(0 0 0 / 0.06)",
                "0 2px 4px 0 oklch(0 0 0 / 0.04)",
            ],
        },
        {
            name: "lg",
            layers: [
                "0 0 0 1px oklch(0 0 0 / 0.05)",
                "0 4px 8px -2px oklch(0 0 0 / 0.08)",
                "0 12px 24px -4px oklch(0 0 0 / 0.06)",
            ],
        },
        {
            name: "overlay",
            layers: [
                "0 0 0 1px oklch(0 0 0 / 0.06)",
                "0 12px 32px -8px oklch(0 0 0 / 0.16)",
                "0 24px 64px -12px oklch(0 0 0 / 0.12)",
            ],
        },
    ],
}

/** Dark-mode elevation: a ring, not a shadow. */
export const DARK_SHADOWS: Record<string, string> = {
    sm: "0 0 0 1px oklch(1 0 0 / 0.06)",
    md: "0 0 0 1px oklch(1 0 0 / 0.08)",
    lg: "0 0 0 1px oklch(1 0 0 / 0.10), 0 8px 24px -8px oklch(0 0 0 / 0.6)",
    overlay: "0 0 0 1px oklch(1 0 0 / 0.12), 0 24px 64px -12px oklch(0 0 0 / 0.7)",
}

/** A 1.2 minor third off a 1rem body, rounded onto the 4px grid by eye. */
export const DEFAULT_TYPE_ROLES: TypeRole[] = [
    { role: "display", family: "sans", sizeRem: 3.5, lineHeight: 1.05, weight: 600, tracking: "-0.03em" },
    { role: "heading-lg", family: "sans", sizeRem: 2.25, lineHeight: 1.15, weight: 600, tracking: "-0.02em" },
    { role: "heading", family: "sans", sizeRem: 1.5, lineHeight: 1.25, weight: 600, tracking: "-0.01em" },
    { role: "heading-sm", family: "sans", sizeRem: 1.125, lineHeight: 1.4, weight: 600 },
    { role: "body-lg", family: "sans", sizeRem: 1.125, lineHeight: 1.6, weight: 400 },
    { role: "body", family: "sans", sizeRem: 1, lineHeight: 1.6, weight: 400 },
    { role: "body-sm", family: "sans", sizeRem: 0.875, lineHeight: 1.55, weight: 400 },
    { role: "label", family: "sans", sizeRem: 0.8125, lineHeight: 1.3, weight: 500, tracking: "0.01em" },
    { role: "code", family: "mono", sizeRem: 0.875, lineHeight: 1.5, weight: 400 },
]

/**
 * Universal polish rules (after Jakub Krehel's "make interfaces feel better").
 * Toggles here become hard rules in the exported SKILL.md, with this brand's
 * actual values substituted in.
 */
export const POLISH_RULES: Array<{ id: string; title: string; rule: string; default: boolean }> = [
    {
        id: "concentric-radius",
        title: "Concentric radius",
        rule: "A rounded element inside another uses `inner = outer − padding`. Square it off at 0. Only applies when padding ≤ 24px.",
        default: true,
    },
    {
        id: "optical-alignment",
        title: "Optical alignment",
        rule: "On a button with a leading icon, the icon-side padding is 2px tighter than the text side (e.g. `pl-14 pr-16`). Fix lopsided glyphs in the SVG viewBox, not with margins.",
        default: true,
    },
    {
        id: "shadow-vs-border",
        title: "Shadows elevate, borders structure",
        rule: "Use `--shadow-*` for things that float above the page and `--border` for things that divide it. Never both for the same job. In dark mode elevation is a hairline ring plus a lighter surface, not a drop shadow.",
        default: true,
    },
    {
        id: "interruptible-motion",
        title: "Interruptible animation",
        rule: "State changes use CSS transitions so they can be interrupted mid-flight. Keyframes are only for one-shot sequences.",
        default: true,
    },
    {
        id: "enter-exit-asymmetry",
        title: "Exits are faster than entrances",
        rule: "Enter: `--duration-base`, opacity 0→1 with a 12px rise. Exit: `--duration-fast`, opacity→0 with a 12px fall. Leaving should never take as long as arriving.",
        default: true,
    },
    {
        id: "press-feedback",
        title: "Press feedback",
        rule: "Active state scales to 0.96 over `--duration-fast`. Never below 0.95.",
        default: true,
    },
    {
        id: "no-transition-all",
        title: "Never `transition: all`",
        rule: "Name the properties you are animating. `transition: all` animates layout properties by accident and stutters.",
        default: true,
    },
    {
        id: "tabular-numbers",
        title: "Tabular numbers",
        rule: "Any number that changes in place (counters, timers, prices in a table) gets `font-variant-numeric: tabular-nums`. Not phone numbers or version strings.",
        default: true,
    },
    {
        id: "text-wrap",
        title: "Text wrapping",
        rule: "`text-wrap: balance` on headings up to ~6 lines; `text-wrap: pretty` on body copy.",
        default: true,
    },
    {
        id: "hit-areas",
        title: "Hit areas",
        rule: "44×44px minimum on touch, 40×40px in dense desktop UI. Extend with a pseudo-element rather than padding that breaks the layout. Hit areas must not overlap.",
        default: true,
    },
    {
        id: "icon-stroke",
        title: "Icon stroke matches text weight",
        rule: "1.5px stroke next to 400-weight text, 2px next to 600. One stroke weight per icon set. Recolour with `currentColor`.",
        default: true,
    },
    {
        id: "focus-visible",
        title: "Focus is always visible",
        rule: "Keyboard focus draws a 2px `--ring` outline with a 2px offset. Never `outline: none` without a replacement.",
        default: true,
    },
    {
        id: "reduced-motion",
        title: "Honour reduced motion",
        rule: "Under `prefers-reduced-motion: reduce`, drop transforms and cut durations to near zero. Motion is never the only signal that something changed — pair it with colour, icon or label.",
        default: true,
    },
]

export const DEFAULT_POLISH: Record<string, boolean> = Object.fromEntries(
    POLISH_RULES.map((r) => [r.id, r.default]),
)
