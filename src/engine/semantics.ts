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
    type SemanticOverride,
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
        // `primary` keeps the verbatim promise — your seed IS your button — and
        // the audit reports it when that costs contrast, because the identity
        // colour is worth defending. `secondary` does not get that: it is an
        // accent, its token is defined as a solid fill, and a fill that cannot
        // carry its own label is not a fill. The exact seed still sits at its
        // anchor step in the ramp either way.
        light: role === "primary" ? anchor : pickFill(ramp.light, neutral.light, anchor),
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

    // Status fills get hover/active for the same reason brand fills do: the
    // system tells you to build a destructive button, and without these its
    // hover state is inexpressible — `--state-hover` is a neutral wash, and
    // computing one with filter/opacity is banned by name.
    const foreground = {
        light: onFill(neutral.light, ramp.light[lightFill]!),
        dark: onFill(neutral.dark, ramp.dark[darkFill]!),
    }
    const direction = {
        light: interactionDirection(neutral.light, foreground.light.step, ramp.light[lightFill]!),
        dark: interactionDirection(neutral.dark, foreground.dark.step, ramp.dark[darkFill]!),
    }

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
            light: foreground.light,
            dark: foreground.dark,
            description: `Text and icons on a solid \`${role}\` fill.`,
        },
        {
            name: `${role}-hover`,
            group: "state",
            light: { scale: role, step: shift(lightFill, direction.light) },
            dark: { scale: role, step: shift(darkFill, direction.dark) },
            description: `Hover state of a solid \`${role}\` fill — a ${label} button.`,
        },
        {
            name: `${role}-active`,
            group: "state",
            light: { scale: role, step: shift(lightFill, direction.light * 2) },
            dark: { scale: role, step: shift(darkFill, direction.dark * 2) },
            description: `Pressed state of a solid \`${role}\` fill.`,
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
            // Measured against the fill it outlines. Adjacent steps (100 next to
            // 200) produce a border at Lc 0 — a boundary nobody can see, which is
            // the same as no boundary while costing a token.
            light: {
                scale: role,
                step: pickAgainst(ramp.light, ramp.light[100]!, [200, 300, 400, 500], LC_THRESHOLD["non-text"]),
            },
            dark: {
                scale: role,
                step: pickAgainst(ramp.dark, ramp.dark[900]!, [800, 700, 600, 500], LC_THRESHOLD["non-text"]),
            },
            description: `Border of a ${label} banner or field.`,
        },
    ]
}

/** A semantic token plus which of its refs a human moved. */
export interface SemanticDef extends SemanticTokenDef {
    overridden: Record<Mode, boolean>
}

/**
 * The full semantic set for a brand: generated from the seeds, then overridden.
 *
 * This is the function to call — `defaultSemanticMapping` on its own is the
 * generator, and using it directly is how a brand's hand edits get dropped.
 *
 * An override naming a token that no longer exists is reported rather than
 * ignored: it means a token was renamed or removed under a brand that had
 * customised it, and silently discarding the edit is how someone loses work
 * without ever being told.
 */
export function semanticDefs(
    scales: ScaleConfig[],
    overrides: SemanticOverride[] = [],
): { defs: SemanticDef[]; orphaned: string[] } {
    const byName = new Map(overrides.map((override) => [override.name, override]))
    const defs = defaultSemanticMapping(scales).map((def): SemanticDef => {
        const override = byName.get(def.name)
        byName.delete(def.name)
        if (!override) return { ...def, overridden: { light: false, dark: false } }
        return {
            ...def,
            light: override.light ?? def.light,
            dark: override.dark ?? def.dark,
            overridden: { light: Boolean(override.light), dark: Boolean(override.dark) },
        }
    })
    return { defs, orphaned: [...byName.keys()] }
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
    const surfaces = {
        background: n(100, 950),
        surface: n(50, 900),
        raised: n(50, 700),
        muted: n(200, 800),
    }

    const borderOnPage = {
        light: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.light,
                neutral.light[surfaces.background.light.step]!,
                [200, 300, 400, 500],
                LC_THRESHOLD["non-text"],
            ),
        },
        dark: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.dark,
                neutral.dark[surfaces.background.dark.step]!,
                [800, 700, 600, 500],
                LC_THRESHOLD["non-text"],
            ),
        },
    }

    /**
     * The surface a text colour has the least room against — not the page.
     * Ink struggles on the darkest surface; paper struggles on the lightest.
     * Measuring against `background` alone passes, then fails on a dialog:
     * in dark mode `surface-raised` is four steps lighter than the page.
     */
    const hardestGround: Record<Mode, string> = {
        light: neutral.light[surfaces.muted.light.step]!,
        dark: neutral.dark[surfaces.raised.dark.step]!,
    }

    /**
     * The flat surfaces — page, card, quiet fill. `surface-raised` is excluded
     * on purpose: in dark mode it is four steps lighter than the page, and
     * holding a caption colour to it drags `muted-foreground` all the way to
     * near-white, where it becomes indistinguishable from `foreground`. A
     * caption inside a popover is rare; a caption on a card is everywhere.
     */
    const flatGround: Record<Mode, string> = {
        light: neutral.light[surfaces.muted.light.step]!,
        dark: neutral.dark[surfaces.muted.dark.step]!,
    }

    /**
     * An inverted neutral region — a tooltip, a dark chip, a footer band.
     * Carbon's `$background-inverse` family; Atlassian's `inverse` colour role.
     *
     * "Inverse" means opposite to the current mode, not a fixed dark: on a dark
     * page an inverted chip is *light*. Anything sitting on it therefore has to
     * be measured against it rather than against the page, which is the whole
     * reason these are tokens and not a note telling people to use `--surface`.
     */
    const inverseSurface: Record<Mode, Step> = { light: 900, dark: 100 }
    const inverseHex: Record<Mode, string> = {
        light: neutral.light[inverseSurface.light]!,
        dark: neutral.dark[inverseSurface.dark]!,
    }
    // Light mode inverts to a dark ground, so its text comes off the paper end.
    const onInverse = (
        ramp: Record<Mode, Record<Step, string>>,
        required: number,
        prefer: "quietest" | "strongest" = "quietest",
    ) => ({
        light: {
            scale: "neutral" as const,
            step: pickAgainst(ramp.light, inverseHex.light, PAPER_CANDIDATES, required, prefer),
        },
        dark: {
            scale: "neutral" as const,
            step: pickAgainst(ramp.dark, inverseHex.dark, INK_CANDIDATES, required, prefer),
        },
    })

    /**
     * The focus ring is `--primary`, which is invisible the moment the thing
     * being focused is itself `--primary` — a brand button, a brand field. That
     * shipped, and acceptance run 4 found it. Carbon's answer is two more
     * tokens, and both are neutral extremes chosen by measurement.
     */
    const ringFill: Record<Mode, string> = {
        light: ramps.primary.light[anchors.primary]!,
        dark: ramps.primary.dark[shift(anchors.primary, -DARK_LIFT)]!,
    }
    const strongestNeutralAgainst = (hex: Record<Mode, string>) => ({
        light: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.light,
                hex.light,
                [...PAPER_CANDIDATES, ...INK_CANDIDATES],
                LC_THRESHOLD["non-text"],
                "strongest",
            ),
        },
        dark: {
            scale: "neutral" as const,
            step: pickAgainst(
                neutral.dark,
                hex.dark,
                [...PAPER_CANDIDATES, ...INK_CANDIDATES],
                LC_THRESHOLD["non-text"],
                "strongest",
            ),
        },
    })

    const textAgainst = (ground: Record<Mode, string>, required: number) => ({
        light: {
            scale: "neutral" as const,
            step: pickAgainst(neutral.light, ground.light, INK_CANDIDATES, required),
        },
        dark: {
            scale: "neutral" as const,
            step: pickAgainst(neutral.dark, ground.dark, PAPER_CANDIDATES, required),
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
            ...surfaces.raised,
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
            // Measured against every surface including `surface-raised`, so it
            // is the supporting-text colour that works inside a dialog too.
            ...textAgainst(hardestGround, LC_THRESHOLD.large),
            description:
                "Supporting copy set at `body-lg` or larger — subtitles, section intros, lead paragraphs. It is the only supporting text colour verified against `surface-raised`, so use it inside dialogs and popovers. For anything at `body-sm` or below on a flat surface use `muted-foreground`, which carries more contrast because small text needs it.",
        },
        {
            name: "muted-foreground",
            group: "text",
            ...textAgainst(flatGround, LC_THRESHOLD.body),
            description:
                "Small supporting text — captions, helper text, metadata — on `background`, `surface` or `muted`. Verified against those three only; on `surface-raised` use `foreground-secondary`.",
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
            description:
                "Hover wash on a neutral interactive surface — menu items, table rows, ghost buttons. It lightens in dark mode against `background` and `surface`, but `surface-raised` is lighter still, so on a popover the same wash reads as a darkening. That is the wash working, not a bug — it moves away from the surface either way.",
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
            // Measured against `background`, which is the harder of the two
            // grounds it sits on — it is nearer the border than `surface` is.
            // A hairline someone has to see is held to the non-text bar; if that
            // lands darker than fashion likes, override the step by hand.
            ...borderOnPage,
            description: "Default hairline between regions — card edges, dividers, table rules.",
        },
        {
            name: "border-subtle",
            group: "border",
            // Deliberately below the visibility bar: this one is allowed to be
            // barely there, because it separates things already inside a boundary.
            ...n(200, 800),
            description:
                "Barely-there separator inside an already-bounded area. Deliberately below the visible-boundary threshold — never use it as the only thing dividing two regions.",
        },
        {
            name: "border-strong",
            group: "border",
            light: { scale: "neutral", step: shift(borderOnPage.light.step, 1) },
            dark: { scale: "neutral", step: shift(borderOnPage.dark.step, -1) },
            description: "Emphasised border — hovered fields, pulled-out quotes.",
        },
        {
            name: "input",
            group: "border",
            ...borderOnPage,
            description: "Border of a form control at rest.",
        },
        {
            name: "ring",
            group: "border",
            light: { scale: "primary", step: anchors.primary },
            dark: { scale: "primary", step: shift(anchors.primary, -DARK_LIFT) },
            description:
                "Focus ring on a neutral ground — a page, a card, an input. On a `primary` or otherwise coloured fill it disappears into its own background: use `ring-inverse` there.",
        },
        {
            name: "ring-inverse",
            group: "border",
            // Measured against `inverse`, not against the brand fill. Those are
            // the same polarity in each mode — a bold fill and an inverted
            // region are both "the opposite of the page" — so one token serves
            // both, and measuring against the fill instead put this at Lc 0 on
            // `inverse` in dark mode, which the audit caught.
            ...onInverse(neutral, LC_THRESHOLD["non-text"], "strongest"),
            description:
                "Focus ring for a control sitting on a coloured or inverted ground — a button already filled with `primary`, anything on `inverse`. The neutral extreme for the mode, so it reads against a brand colour rather than blending into it.",
        },
        {
            name: "ring-inset",
            group: "border",
            // The companion, not an alternative: it has to contrast with `ring`
            // itself, because the two are drawn as concentric hairlines.
            ...strongestNeutralAgainst(ringFill),
            description:
                "Drawn immediately inside `ring` as a second hairline, so a focus indicator survives on a ground the system cannot predict — one of the two always contrasts. Not a substitute for `ring`.",
        },

        // ── Links ───────────────────────────────────────────────────────────
        /**
         * A link is body text, so it is held to the body bar against the
         * hardest flat surface — not to `--primary`, which is a *fill* colour
         * and measured only as a background. Pointing a link at `--primary` is
         * the single most tempting substitution in this system and it fails:
         * on Hendri's palette it lands at Lc −28.7 in dark mode, which is
         * unreadable. That trap was documented for two sessions; this is the
         * token that removes it.
         */
        {
            name: "link",
            group: "link",
            light: {
                scale: "primary",
                step: pickAgainst(ramps.primary.light, flatGround.light, INK_CANDIDATES, LC_THRESHOLD.body),
            },
            dark: {
                scale: "primary",
                step: pickAgainst(ramps.primary.dark, flatGround.dark, PAPER_CANDIDATES, LC_THRESHOLD.body),
            },
            description:
                "Links in running text, on `background`, `surface` or `muted`. **Underline them** — this colour sits at the same lightness as `foreground` and differs only in hue, so colour alone does not mark a link (see the polish rules). Never use `primary` for a link: it is a fill colour and is unreadable as text in dark mode.",
        },
        {
            name: "link-hover",
            group: "link",
            // Toward the ink/paper end: a hovered link gains contrast rather
            // than losing it, the same rule the fills follow.
            light: {
                scale: "primary",
                step: shift(
                    pickAgainst(ramps.primary.light, flatGround.light, INK_CANDIDATES, LC_THRESHOLD.body),
                    1,
                ),
            },
            dark: {
                scale: "primary",
                step: shift(
                    pickAgainst(ramps.primary.dark, flatGround.dark, PAPER_CANDIDATES, LC_THRESHOLD.body),
                    -1,
                ),
            },
            description: "Hover state of a link in running text.",
        },
        {
            name: "link-inverse",
            group: "link",
            light: {
                scale: "primary",
                step: pickAgainst(ramps.primary.light, inverseHex.light, PAPER_CANDIDATES, LC_THRESHOLD.body),
            },
            dark: {
                scale: "primary",
                step: pickAgainst(ramps.primary.dark, inverseHex.dark, INK_CANDIDATES, LC_THRESHOLD.body),
            },
            description:
                "A link inside an `inverse` region. `link` is measured against the page and goes unreadable there, which is why this exists as its own token.",
        },

        // ── Inverse region ──────────────────────────────────────────────────
        {
            name: "inverse",
            group: "inverse",
            light: { scale: "neutral", step: inverseSurface.light },
            dark: { scale: "neutral", step: inverseSurface.dark },
            description:
                "A region deliberately inverted against the current mode — tooltips, dark chips, a footer band. On a light page this is dark; on a dark page it is light. Everything placed on it takes an `inverse-*` or `-inverse` token.",
        },
        {
            name: "inverse-foreground",
            group: "inverse",
            ...onInverse(neutral, LC_THRESHOLD.body),
            description: "Text and icons on `inverse`.",
        },
        {
            name: "inverse-border",
            group: "inverse",
            ...onInverse(neutral, LC_THRESHOLD["non-text"]),
            description: "Hairline or divider inside an `inverse` region.",
        },

        // ── Scrim and skeleton ──────────────────────────────────────────────
        {
            name: "scrim",
            group: "surface",
            // The one translucent token in the system. It cannot alias a
            // primitive — `var(--neutral-950)` carries no opacity — so it emits
            // a literal. See DECISIONS #24.
            light: { scale: "neutral", step: 950, alpha: 0.6 },
            dark: { scale: "neutral", step: 950, alpha: 0.7 },
            description:
                "The backdrop behind a modal or drawer. Translucent on purpose, so the page stays legible underneath — it is the one token in this system that is not a solid colour. Dark mode carries more of it, because a dim scrim over an already-dark page does not read as a layer.",
        },
        {
            name: "skeleton-surface",
            group: "surface",
            ...n(200, 800),
            description: "The container of a loading placeholder — the card shape that holds the blocks.",
        },
        {
            name: "skeleton",
            group: "surface",
            // Measured against `skeleton-surface`, not the page: a skeleton
            // block sits inside its own container, and picking against the page
            // is how the blocks end up invisible in the only place they appear.
            light: {
                scale: "neutral",
                step: pickAgainst(neutral.light, neutral.light[200]!, [300, 400, 500], LC_THRESHOLD["non-text"]),
            },
            dark: {
                scale: "neutral",
                step: pickAgainst(neutral.dark, neutral.dark[800]!, [700, 600, 500], LC_THRESHOLD["non-text"]),
            },
            description:
                "The blocks standing in for text and UI while content loads. Put them on `skeleton-surface`. Never animate them with `opacity` — use a background-position sweep, so the contrast the audit measured is the contrast that ships.",
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
