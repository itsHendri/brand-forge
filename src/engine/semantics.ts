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
 * alone, and it picks every text colour by measuring real contrast against the
 * real fill rather than guessing from a step number. Seeds in, a system that
 * passes its own audit out.
 */

import { apca, LC_THRESHOLD } from "./contrast"
import { generateScale, oklchToHex } from "./scale"
import {
    STEPS,
    type Mode,
    type ScaleConfig,
    type ScaleRole,
    type SemanticTokenDef,
    type Step,
} from "./types"

/** Index into STEPS: 0 = 50 (lightest) … 10 = 950 (darkest). */
const idx = (step: Step): number => STEPS.indexOf(step)
const at = (i: number): Step => STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]!

/** Move n positions darker (positive) or lighter (negative). */
const shift = (step: Step, n: number): Step => at(idx(step) + n)

/** In dark mode a brand fill moves two steps lighter; the dark ramp already cut its chroma. */
const DARK_LIFT = 2

type Ramps = Record<ScaleRole, Record<Mode, Record<Step, string>>>

/** Generate every ramp as hex, so the mapping can measure contrast while it decides. */
function buildRamps(scales: ScaleConfig[]): Ramps {
    const ramps = {} as Ramps
    for (const scale of scales) {
        const modes = {} as Record<Mode, Record<Step, string>>
        for (const mode of ["light", "dark"] as Mode[]) {
            const generated = generateScale(scale.seed, mode, scale.tuning?.[mode] ?? {})
            const steps = {} as Record<Step, string>
            for (const step of STEPS) steps[step] = oklchToHex(generated.steps[step]!)
            modes[mode] = steps
        }
        ramps[scale.role] = modes
    }
    return ramps
}

export function anchorsFor(scales: ScaleConfig[]): Record<ScaleRole, Step> {
    const anchors = {} as Record<ScaleRole, Step>
    for (const scale of scales) {
        anchors[scale.role] = generateScale(scale.seed, "light", scale.tuning?.light ?? {}).anchorStep
    }
    return anchors
}

/**
 * Choose the step that clears `required` against `backgroundHex` with the
 * smallest jump — the quietest colour that is still readable. Falls back to the
 * highest-contrast candidate when nothing clears the bar, so the system degrades
 * to "as legible as this ramp allows" rather than to an arbitrary step.
 */
function pickAgainst(
    ramp: Record<Step, string>,
    backgroundHex: string,
    candidates: readonly Step[],
    required: number,
    prefer: "quietest" | "strongest" = "quietest",
): Step {
    let best: { step: Step; lc: number } | undefined
    let strongest: { step: Step; lc: number } | undefined

    for (const step of candidates) {
        const lc = Math.abs(apca(ramp[step]!, backgroundHex))
        if (!strongest || lc > strongest.lc) strongest = { step, lc }
        if (lc >= required && (!best || lc < best.lc)) best = { step, lc }
    }
    return prefer === "strongest" ? strongest!.step : (best ?? strongest!).step
}

const INK_CANDIDATES = [950, 900, 800, 700, 600] as const
const PAPER_CANDIDATES = [50, 100, 200, 300] as const

/**
 * Text on a solid fill is drawn from the NEUTRAL ramp, not the fill's own.
 * A brand ramp's lightest step is a tint, not white — on a mid-lightness fill
 * neither end of it clears the bar, while real systems just put white or
 * near-black on the button. Which of the two wins is decided by measurement,
 * so an amber fill gets dark text and an indigo one gets light text without
 * anybody hand-picking either.
 */
function onFill(neutralRamp: Record<Step, string>, fillHex: string): { scale: ScaleRole; step: Step } {
    return {
        scale: "neutral",
        // Strongest, not quietest: a button label wants to be crisp. The
        // "smallest passing jump" rule is right for text on a page, where a
        // quieter colour reads as hierarchy, and wrong on a solid fill, where
        // it just looks washed out.
        step: pickAgainst(
            neutralRamp,
            fillHex,
            [...PAPER_CANDIDATES, ...INK_CANDIDATES],
            LC_THRESHOLD.ui,
            "strongest",
        ),
    }
}

/**
 * Pick a solid fill that can actually carry a label.
 *
 * Starting at `startStep` and walking darker, take the first step where some
 * neutral clears the UI-text bar. A colour in the middle of its ramp carries
 * neither light nor dark text well — mid-lightness amber is the classic case —
 * so "the seed, verbatim" is not always a usable button.
 *
 * Brand fills don't go through this in light mode: the promise that your typed
 * colour IS your primary button outranks a marginal contrast miss, and the
 * contrast pass reports it instead. Status colours have no such promise — the
 * seed is a hint about meaning, so legibility wins.
 */
function pickFill(
    ramp: Record<Step, string>,
    neutralRamp: Record<Step, string>,
    startStep: Step,
): Step {
    let strongest: { step: Step; lc: number } | undefined
    for (let i = idx(startStep); i < STEPS.length; i++) {
        const step = at(i)
        const fill = ramp[step]!
        const best = Math.max(
            ...[...PAPER_CANDIDATES, ...INK_CANDIDATES].map((candidate) =>
                Math.abs(apca(neutralRamp[candidate]!, fill)),
            ),
        )
        if (best >= LC_THRESHOLD.ui) return step
        if (!strongest || best > strongest.lc) strongest = { step, lc: best }
    }
    return strongest!.step
}

/**
 * Which way interaction moves a fill.
 *
 * Always AWAY from its label: a fill wearing light text darkens on hover, a fill
 * wearing dark text lightens. Contrast therefore improves as you interact with a
 * control instead of collapsing — which is what happens if hover has a fixed
 * direction and the label polarity flips underneath it.
 */
function interactionDirection(neutralRamp: Record<Step, string>, foregroundStep: Step, fillHex: string): 1 | -1 {
    const labelIsLight = apca(neutralRamp[foregroundStep]!, fillHex) < 0
    return labelIsLight ? 1 : -1
}

function actionTokens(
    role: Extract<ScaleRole, "primary" | "secondary">,
    anchor: Step,
    ramps: Ramps,
): SemanticTokenDef[] {
    const ramp = ramps[role]
    const neutral = ramps.neutral
    const fill: Record<Mode, Step> = {
        light: anchor, // the brand promise: your seed IS your button
        dark: pickFill(ramp.dark, neutral.dark, shift(anchor, -DARK_LIFT)),
    }
    const foreground: Record<Mode, { scale: ScaleRole; step: Step }> = {
        light: onFill(neutral.light, ramp.light[fill.light]!),
        dark: onFill(neutral.dark, ramp.dark[fill.dark]!),
    }
    const direction: Record<Mode, 1 | -1> = {
        light: interactionDirection(neutral.light, foreground.light.step, ramp.light[fill.light]!),
        dark: interactionDirection(neutral.dark, foreground.dark.step, ramp.dark[fill.dark]!),
    }
    const subtle: Record<Mode, Step> = { light: 100, dark: 900 }

    return [
        {
            name: role,
            group: "brand",
            light: { scale: role, step: fill.light },
            dark: { scale: role, step: fill.dark },
            description: `Solid ${role} fill — ${role === "primary" ? "primary buttons, active nav, key accents" : "secondary buttons and supporting accents"}.`,
        },
        {
            name: `${role}-foreground`,
            group: "brand",
            light: foreground.light,
            dark: foreground.dark,
            description: `Text and icons on a solid \`${role}\` fill. Never use it on a page background.`,
        },
        {
            name: `${role}-hover`,
            group: "state",
            light: { scale: role, step: shift(fill.light, direction.light) },
            dark: { scale: role, step: shift(fill.dark, direction.dark) },
            description: `Hover state of a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-active`,
            group: "state",
            light: { scale: role, step: shift(fill.light, direction.light * 2) },
            dark: { scale: role, step: shift(fill.dark, direction.dark * 2) },
            description: `Pressed/active state of a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-subtle`,
            group: "brand",
            light: { scale: role, step: subtle.light },
            dark: { scale: role, step: subtle.dark },
            description: `Tinted ${role} wash — quiet badges, selected rows, callouts. Not a text colour.`,
        },
        {
            name: `${role}-subtle-foreground`,
            group: "brand",
            light: { scale: role, step: pickAgainst(ramp.light, ramp.light[subtle.light]!, INK_CANDIDATES, LC_THRESHOLD.body) },
            dark: { scale: role, step: pickAgainst(ramp.dark, ramp.dark[subtle.dark]!, PAPER_CANDIDATES, LC_THRESHOLD.body) },
            description: `Text on \`${role}-subtle\`.`,
        },
    ]
}

function statusTokens(
    role: Extract<ScaleRole, "success" | "warning" | "danger" | "info">,
    anchor: Step,
    ramps: Ramps,
): SemanticTokenDef[] {
    const ramp = ramps[role]
    const neutral = ramps.neutral
    const lightFill = pickFill(ramp.light, neutral.light, anchor)
    const darkFill = pickFill(ramp.dark, neutral.dark, shift(anchor, -DARK_LIFT))
    const label = role === "danger" ? "destructive" : role

    return [
        {
            name: role,
            group: "status",
            light: { scale: role, step: lightFill },
            dark: { scale: role, step: darkFill },
            description: `Solid ${label} fill — ${label} buttons, filled badges, chart series.`,
        },
        {
            name: `${role}-foreground`,
            group: "status",
            light: onFill(neutral.light, ramp.light[lightFill]!),
            dark: onFill(neutral.dark, ramp.dark[darkFill]!),
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
            light: { scale: role, step: pickAgainst(ramp.light, ramp.light[100]!, INK_CANDIDATES, LC_THRESHOLD.body) },
            dark: { scale: role, step: pickAgainst(ramp.dark, ramp.dark[900]!, PAPER_CANDIDATES, LC_THRESHOLD.body) },
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

export function defaultSemanticMapping(scales: ScaleConfig[]): SemanticTokenDef[] {
    const ramps = buildRamps(scales)
    const anchors = anchorsFor(scales)
    const neutral = ramps.neutral

    const n = (light: Step, dark: Step) => ({
        light: { scale: "neutral" as const, step: light },
        dark: { scale: "neutral" as const, step: dark },
    })

    // Surfaces come first because every text colour is chosen against them.
    const surfaces = { background: n(100, 950), surface: n(50, 900), muted: n(200, 800) }

    /** Readable on BOTH the page and a card — the harder of the two wins. */
    const textOnSurfaces = (required: number) => ({
        light: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.light,
                neutral.light[surfaces.background.light.step]!,
                INK_CANDIDATES,
                required,
            ),
        },
        dark: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.dark,
                neutral.dark[surfaces.background.dark.step]!,
                PAPER_CANDIDATES,
                required,
            ),
        },
    })

    return [
        // ── Surfaces ────────────────────────────────────────────────────────
        {
            name: "background",
            group: "surface",
            ...surfaces.background,
            description: "The page. Every screen starts here.",
        },
        {
            name: "surface",
            group: "surface",
            ...surfaces.surface,
            description: "Cards, panels and anything sitting one level above the page.",
        },
        {
            name: "surface-raised",
            group: "surface",
            // Dark mode climbs the ramp to show elevation. Light mode has nowhere
            // lighter to go than `surface`, so the two match there on purpose and
            // the separation comes from `--shadow-lg`.
            ...n(50, 700),
            description:
                "Popovers, dropdowns, dialogs — one level above `surface`. In light mode this equals `surface`: elevation there is `--shadow-lg`, not a lighter fill.",
        },
        {
            name: "muted",
            group: "surface",
            ...surfaces.muted,
            description: "Quiet neutral fill — table headers, inactive tabs, code blocks.",
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
            // Held to the large-text bar, not the body bar, which is what makes
            // it a genuinely distinct step rather than a duplicate of
            // `--foreground` or `--muted-foreground`. It reads lighter than
            // `--muted-foreground` on purpose: this is for larger supporting
            // copy, and smaller text needs MORE contrast, not less.
            ...textOnSurfaces(LC_THRESHOLD.large),
            description:
                "Supporting copy set at `body-lg` or larger — subtitles, section intros, lead paragraphs. For anything at `body-sm` or below use `muted-foreground`, which is darker because small text needs more contrast.",
        },
        {
            name: "muted-foreground",
            group: "text",
            // Measured against `muted`, the busiest ground it sits on.
            light: {
                scale: "neutral",
                step: pickAgainst(neutral.light, neutral.light[surfaces.muted.light.step]!, INK_CANDIDATES, LC_THRESHOLD.body),
            },
            dark: {
                scale: "neutral",
                step: pickAgainst(neutral.dark, neutral.dark[surfaces.muted.dark.step]!, PAPER_CANDIDATES, LC_THRESHOLD.body),
            },
            description: "Secondary text on `muted` or `background` — captions, helper text, metadata.",
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
            ...n(300, 700),
            description: "Default hairline between regions — card edges, dividers, table rules.",
        },
        {
            name: "border-subtle",
            group: "border",
            ...n(200, 800),
            description: "Barely-there separator inside an already-bounded area.",
        },
        {
            name: "border-strong",
            group: "border",
            ...n(400, 600),
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
        ...actionTokens("primary", anchors.primary, ramps),
        ...actionTokens("secondary", anchors.secondary, ramps),
        ...statusTokens("success", anchors.success, ramps),
        ...statusTokens("warning", anchors.warning, ramps),
        ...statusTokens("danger", anchors.danger, ramps),
        ...statusTokens("info", anchors.info, ramps),
    ]
}
