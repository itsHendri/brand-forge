/**
 * The semantic layer — the ONLY layer components and AI agents consume.
 *
 * Primitives (neutral-200, primary-600…) are where a human edits colour.
 * Semantics (background, foreground, border, primary-hover…) are how everything
 * else refers to colour. The vocabulary is deliberately Hendri's — surfaces,
 * foregrounds, states, borders — with shadcn-compatible names kept wherever they
 * fit, because that vocabulary is the one already in every model's training data.
 *
 * defaultSemanticMapping() produces a COMPLETE working system from the seeds
 * alone: no manual wiring required before the first preview renders.
 */

import { STEPS, type ScaleRole, type SemanticTokenDef, type Step } from "./types"

/** Index into STEPS: 0 = 50 (lightest) … 10 = 950 (darkest). */
const idx = (step: Step): number => STEPS.indexOf(step)
const at = (i: number): Step => STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]!

/** Move n positions darker (positive) or lighter (negative). */
const shift = (step: Step, n: number): Step => at(idx(step) + n)

/** Anchor step per scale — where the typed seed landed. */
export type Anchors = Record<ScaleRole, Step>

/** In dark mode a brand fill moves two steps lighter; the dark ramp already cut its chroma. */
const DARK_LIFT = 2

/**
 * Text that sits on a solid fill. Light fills take ink, dark fills take paper.
 * P2 replaces this heuristic with a real APCA check + auto-flip.
 */
const onFill = (anchor: Step): Step => (idx(anchor) >= 5 ? 50 : 950)

function actionTokens(
    role: Extract<ScaleRole, "primary" | "secondary">,
    anchor: Step,
): SemanticTokenDef[] {
    const dark = shift(anchor, -DARK_LIFT)
    return [
        {
            name: role,
            group: "brand",
            light: { scale: role, step: anchor },
            dark: { scale: role, step: dark },
            description: `Solid ${role} fill — ${role === "primary" ? "primary buttons, active nav, key accents" : "secondary buttons and supporting accents"}.`,
        },
        {
            name: `${role}-foreground`,
            group: "brand",
            light: { scale: role, step: onFill(anchor) },
            dark: { scale: role, step: onFill(dark) },
            description: `Text and icons on a solid \`${role}\` fill. Never use it on a page background.`,
        },
        {
            name: `${role}-hover`,
            group: "state",
            light: { scale: role, step: shift(anchor, 1) },
            dark: { scale: role, step: shift(dark, -1) },
            description: `Hover state of a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-active`,
            group: "state",
            light: { scale: role, step: shift(anchor, 2) },
            dark: { scale: role, step: shift(dark, -2) },
            description: `Pressed/active state of a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-subtle`,
            group: "brand",
            light: { scale: role, step: 100 },
            dark: { scale: role, step: 900 },
            description: `Tinted ${role} wash — quiet badges, selected rows, callouts. Not a text colour.`,
        },
        {
            name: `${role}-subtle-foreground`,
            group: "brand",
            light: { scale: role, step: 800 },
            dark: { scale: role, step: 200 },
            description: `Text on \`${role}-subtle\`.`,
        },
    ]
}

function statusTokens(
    role: Extract<ScaleRole, "success" | "warning" | "danger" | "info">,
    anchor: Step,
): SemanticTokenDef[] {
    const dark = shift(anchor, -DARK_LIFT)
    const label = role === "danger" ? "destructive" : role
    return [
        {
            name: role,
            group: "status",
            light: { scale: role, step: anchor },
            dark: { scale: role, step: dark },
            description: `Solid ${label} fill — ${label} buttons, filled badges, chart series.`,
        },
        {
            name: `${role}-foreground`,
            group: "status",
            light: { scale: role, step: onFill(anchor) },
            dark: { scale: role, step: onFill(dark) },
            description: `Text and icons on a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-subtle`,
            group: "status",
            light: { scale: role, step: 100 },
            dark: { scale: role, step: 900 },
            description: `Background of a ${label} banner, alert or inline message.`,
        },
        {
            name: `${role}-subtle-foreground`,
            group: "status",
            light: { scale: role, step: 800 },
            dark: { scale: role, step: 200 },
            description: `Text on \`${role}-subtle\`. This is the ${label} text colour — not \`${role}\`.`,
        },
        {
            name: `${role}-border`,
            group: "status",
            light: { scale: role, step: 200 },
            dark: { scale: role, step: 800 },
            description: `Border of a ${label} banner or field.`,
        },
    ]
}

export function defaultSemanticMapping(anchors: Anchors): SemanticTokenDef[] {
    const n = (light: Step, dark: Step) => ({
        light: { scale: "neutral" as const, step: light },
        dark: { scale: "neutral" as const, step: dark },
    })

    return [
        // ── Surfaces ────────────────────────────────────────────────────────
        {
            name: "background",
            group: "surface",
            ...n(100, 950),
            description: "The page. Every screen starts here.",
        },
        {
            name: "surface",
            group: "surface",
            ...n(50, 900),
            description: "Cards, panels and anything sitting one level above the page.",
        },
        {
            name: "surface-raised",
            group: "surface",
            ...n(50, 800),
            description: "Popovers, dropdowns, dialogs — one level above `surface`.",
        },
        {
            name: "muted",
            group: "surface",
            ...n(200, 800),
            description: "Quiet neutral fill — table headers, inactive tabs, code blocks.",
        },
        {
            name: "muted-foreground",
            group: "text",
            ...n(600, 400),
            description: "Secondary text on `muted` or `background`. Captions, helper text, metadata.",
        },

        // ── Text ────────────────────────────────────────────────────────────
        {
            name: "foreground",
            group: "text",
            ...n(950, 50),
            description: "Primary text and icons. The default ink for body copy and headings.",
        },
        {
            name: "foreground-secondary",
            group: "text",
            ...n(700, 300),
            description: "Supporting text one notch below `foreground` — subtitles, descriptions.",
        },
        {
            name: "foreground-tertiary",
            group: "text",
            ...n(500, 500),
            description:
                "Deliberately faint text: placeholders, disabled labels, watermarks. NEVER body copy — it does not meet contrast for reading.",
        },

        // ── Neutral interactive states ──────────────────────────────────────
        {
            name: "state-hover",
            group: "state",
            ...n(200, 800),
            description: "Hover wash on a neutral interactive surface — menu items, table rows, ghost buttons.",
        },
        {
            name: "state-active",
            group: "state",
            ...n(300, 700),
            description: "Pressed state of a neutral interactive surface.",
        },
        {
            name: "state-selected",
            group: "state",
            light: { scale: "primary", step: 100 },
            dark: { scale: "primary", step: 900 },
            description: "Selected/current state — brand-tinted so selection reads as intent, not hover.",
        },
        {
            name: "state-disabled",
            group: "state",
            ...n(200, 800),
            description: "Fill of a disabled control. Pair with `foreground-tertiary`.",
        },

        // ── Borders ─────────────────────────────────────────────────────────
        {
            name: "border",
            group: "border",
            ...n(200, 800),
            description: "Default hairline between regions — card edges, dividers, table rules.",
        },
        {
            name: "border-subtle",
            group: "border",
            ...n(100, 900),
            description: "Barely-there separator inside an already-bounded area.",
        },
        {
            name: "border-strong",
            group: "border",
            ...n(300, 700),
            description: "Emphasised border — hovered fields, pulled-out quotes.",
        },
        {
            name: "input",
            group: "border",
            ...n(300, 700),
            description: "Border of a form control at rest.",
        },
        {
            name: "ring",
            group: "border",
            light: { scale: "primary", step: anchors.primary },
            dark: { scale: "primary", step: shift(anchors.primary, -DARK_LIFT) },
            description: "Focus ring. Always visible on keyboard focus — never remove it.",
        },

        // ── Brand + status ──────────────────────────────────────────────────
        ...actionTokens("primary", anchors.primary),
        ...actionTokens("secondary", anchors.secondary),
        ...statusTokens("success", anchors.success),
        ...statusTokens("warning", anchors.warning),
        ...statusTokens("danger", anchors.danger),
        ...statusTokens("info", anchors.info),
    ]
}
