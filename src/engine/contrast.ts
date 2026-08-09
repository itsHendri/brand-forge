/**
 * Contrast validation.
 *
 * APCA is the judge, WCAG 2 is reported alongside. APCA is polarity-aware and
 * actually models perception on self-illuminated displays; WCAG 2's ratio
 * overstates contrast among dark colours, which is precisely where a dark theme
 * lives — so validating dark mode with WCAG 2 alone gives false passes. WCAG 2
 * numbers still ship because that's what compliance asks for.
 */

// @ts-expect-error — apca-w3 ships no types
import { APCAcontrast, sRGBtoY } from "apca-w3"
import { oklchToHex } from "./scale"
import type { Mode, ResolvedSemantic, ResolvedTokens, SemanticRef, Warning } from "./types"
import { STEPS, type Step } from "./types"

export type Usage = "body" | "large" | "ui" | "non-text"

/**
 * Minimum |Lc| per usage. From the APCA readability guidance:
 * 75 is the comfortable body-text target, 60 works for large/UI text,
 * 45 is the floor for incidental text, and 15–30 covers non-text boundaries.
 */
export const LC_THRESHOLD: Record<Usage, number> = {
    body: 75,
    large: 60,
    ui: 60,
    "non-text": 25,
}

function hexToRgb(hex: string): [number, number, number] {
    const value = hex.replace("#", "")
    return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
    ]
}

/**
 * What a translucent colour actually looks like once it is over something.
 *
 * A wash has no colour of its own to measure — `--state-hover` at 12% is a
 * different colour on every surface it lands on, which is the entire reason it
 * is translucent. So the audit composites it over each ground it is allowed on
 * and measures *that*, rather than measuring the opaque primitive underneath
 * and reporting a number no user will ever see.
 *
 * Source-over in sRGB, which is what the browser does when the backdrop is
 * opaque — and every ground in this system is.
 */
export function composite(overHex: string, alpha: number, groundHex: string): string {
    const [r1, g1, b1] = hexToRgb(overHex)
    const [r2, g2, b2] = hexToRgb(groundHex)
    const mix = (top: number, bottom: number): string =>
        Math.round(top * alpha + bottom * (1 - alpha))
            .toString(16)
            .padStart(2, "0")
    return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`
}

/**
 * How far apart two near-neutral colours are, 0–255, as a mean channel delta.
 *
 * Deliberately not APCA: APCA clamps everything below its noise floor to 0, so
 * it cannot tell "invisible" from "subtle" — and a hover wash lives entirely in
 * that range. This is a crude proxy for lightness difference and is only used
 * for the one question APCA cannot answer: can you see that anything happened?
 */
export function channelShift(aHex: string, bHex: string): number {
    const a = hexToRgb(aHex)
    const b = hexToRgb(bHex)
    return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3
}

/** Signed Lc. Positive = dark text on light ground; negative = the reverse. */
export function apca(textHex: string, backgroundHex: string): number {
    const lc = APCAcontrast(sRGBtoY(hexToRgb(textHex)), sRGBtoY(hexToRgb(backgroundHex)))
    return Math.round(Number(lc) * 10) / 10
}

/** WCAG 2.1 relative-luminance ratio, reported for compliance paperwork. */
export function wcag(aHex: string, bHex: string): number {
    const luminance = (hex: string): number => {
        const channels = hexToRgb(hex).map((channel) => {
            const c = channel / 255
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }) as [number, number, number]
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const a = luminance(aHex)
    const b = luminance(bHex)
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    return Math.round(ratio * 100) / 100
}

/**
 * The pairs that must hold for the system to be usable. Everything a person
 * actually reads, plus the boundaries they need to see.
 */
/** The opaque elevation ladder, darkest-first. Every wash is checked over each. */
const LADDER = ["surface-sunken", "background", "surface", "surface-raised", "surface-overlay"] as const

export const CONTRAST_PAIRS: Array<{
    fg: string
    bg: string
    usage: Usage
    /**
     * The opaque ground a translucent `bg` is sitting on for this check. A wash
     * needs one pair per surface it is allowed on, because it is a different
     * colour on each — that is the point of it being a wash.
     */
    over?: string
}> = [
    { fg: "foreground", bg: "background", usage: "body" },
    { fg: "foreground", bg: "surface", usage: "body" },
    // `foreground-secondary` is defined as a large-text colour (body-lg and up);
    // small supporting text uses the darker `muted-foreground`.
    { fg: "foreground-secondary", bg: "background", usage: "large" },
    { fg: "foreground-secondary", bg: "surface", usage: "large" },
    // `surface-raised` is where dialogs and popovers live, so a subtitle on one
    // is an obvious pairing — and it was going unchecked.
    { fg: "foreground", bg: "surface-raised", usage: "body" },
    { fg: "foreground-secondary", bg: "surface-raised", usage: "large" },
    // `muted-foreground` is deliberately NOT checked against `surface-raised`:
    // holding a caption colour to a popover's lightness drags it to near-white
    // in dark mode, where it stops being distinguishable from `foreground`.
    // Supporting text on a raised surface is `foreground-secondary`.
    { fg: "muted-foreground", bg: "background", usage: "body" },
    { fg: "muted-foreground", bg: "surface", usage: "body" },
    // foreground-tertiary is deliberately faint (placeholders, watermarks) and is
    // held to the incidental floor, not the body target.
    { fg: "foreground-tertiary", bg: "background", usage: "non-text" },
    { fg: "primary-foreground", bg: "primary", usage: "ui" },
    { fg: "primary-foreground", bg: "primary-hover", usage: "ui" },
    { fg: "primary-foreground", bg: "primary-active", usage: "ui" },
    { fg: "primary-subtle-foreground", bg: "primary-subtle", usage: "body" },
    { fg: "secondary-foreground", bg: "secondary", usage: "ui" },
    { fg: "secondary-foreground", bg: "secondary-hover", usage: "ui" },
    { fg: "secondary-foreground", bg: "secondary-active", usage: "ui" },
    { fg: "secondary-subtle-foreground", bg: "secondary-subtle", usage: "body" },
    // The washes are translucent, so each is checked over every surface it is
    // allowed on — one pair per ground, because it is a different colour on
    // each. Checking a wash against nothing is how the old opaque `state-hover`
    // passed while being invisible on `muted`.
    ...LADDER.flatMap((ground) => [
        { fg: "foreground", bg: "state-hover", over: ground, usage: "body" as Usage },
        { fg: "foreground", bg: "state-active", over: ground, usage: "body" as Usage },
        { fg: "foreground", bg: "state-selected", over: ground, usage: "body" as Usage },
        // `muted` is a wash too now, so it is measured the same way — over every
        // surface it can land on rather than as the primitive underneath it.
        { fg: "foreground", bg: "muted", over: ground, usage: "body" as Usage },
    ]),
    // Supporting text and links on a muted region are checked over the FLAT
    // surfaces only, for the same reason `muted-foreground` skips
    // `surface-raised` above: holding a caption colour to a table header inside
    // a popover drags it to near-white in dark mode, where it stops being
    // distinguishable from `foreground`. Body text on muted is checked
    // everywhere, because that is the combination people actually build.
    // `surface-sunken` is not in this list on purpose: requiring a caption to
    // survive a muted region inside a well drove `muted-foreground` to the exact
    // same value as `--foreground`, collapsing the text hierarchy to keep a
    // combination nobody builds. See the note in `semantics.ts`.
    ...(["background", "surface"] as const).flatMap((ground) => [
        { fg: "muted-foreground", bg: "muted", over: ground, usage: "body" as Usage },
        { fg: "link", bg: "muted", over: ground, usage: "body" as Usage },
    ]),
    // `state-disabled` is deliberately absent. Its label is
    // `--foreground-tertiary`, which this system documents as exempt and "never
    // will be" validated — and WCAG 1.4.3 exempts inactive controls too. Adding
    // the pair would have the audit contradict the docs, which is worse than
    // the pair being missing. That it stays *visible* against its surface is
    // covered by a test instead, along with the other three washes.
    { fg: "border", bg: "background", usage: "non-text" },
    { fg: "border", bg: "surface", usage: "non-text" },
    { fg: "input", bg: "surface", usage: "non-text" },
    { fg: "ring", bg: "background", usage: "non-text" },
    // A link is body text on every flat surface it can land on. This is the
    // check that would have caught `--primary`-as-a-link at Lc −28.7.
    { fg: "link", bg: "background", usage: "body" },
    { fg: "link", bg: "surface", usage: "body" },
    { fg: "link-hover", bg: "background", usage: "body" },
    { fg: "link-inverse", bg: "inverse", usage: "body" },
    // The two rings exist because `ring` alone is invisible on a brand fill.
    // Measuring them against `primary` is measuring the case they were added for.
    { fg: "ring-inverse", bg: "primary", usage: "non-text" },
    { fg: "ring-inverse", bg: "inverse", usage: "non-text" },
    { fg: "ring-inset", bg: "ring", usage: "non-text" },
    { fg: "inverse-foreground", bg: "inverse", usage: "body" },
    { fg: "inverse-border", bg: "inverse", usage: "non-text" },
    // A loading placeholder nobody can see is a blank card. Held to the
    // boundary bar against the container it actually sits in.
    { fg: "skeleton", bg: "skeleton-surface", usage: "non-text" },
    // `scrim` is deliberately absent: it is translucent, so its effective
    // colour depends on whatever is behind it and APCA has nothing to measure.
    ...(["success", "warning", "danger", "info"] as const).flatMap((status) => [
        { fg: `${status}-foreground`, bg: status, usage: "ui" as Usage },
        { fg: `${status}-foreground`, bg: `${status}-hover`, usage: "ui" as Usage },
        { fg: `${status}-foreground`, bg: `${status}-active`, usage: "ui" as Usage },
        { fg: `${status}-subtle-foreground`, bg: `${status}-subtle`, usage: "body" as Usage },
        { fg: `${status}-border`, bg: `${status}-subtle`, usage: "non-text" as Usage },
    ]),
]

const MODES: Mode[] = ["light", "dark"]

/**
 * Find the step on the foreground's own scale that best clears the threshold
 * against this background — the one-click fix offered next to the warning.
 */
function suggestStep(
    resolved: ResolvedTokens,
    token: ResolvedSemantic,
    backgroundHex: string,
    mode: Mode,
    required: number,
): SemanticRef | undefined {
    const scaleRole = token[mode].scale
    const scale = resolved.scales[scaleRole]
    if (!scale) return undefined

    let best: { step: Step; lc: number } | undefined
    for (const step of STEPS) {
        const lc = Math.abs(apca(scale.steps[mode][step]!.hex, backgroundHex))
        if (lc >= required && (!best || lc < best.lc)) best = { step, lc } // smallest passing jump
    }
    return best ? { scale: scaleRole, step: best.step } : undefined
}

export function validateContrast(resolved: ResolvedTokens): Warning[] {
    const byName = new Map(resolved.semantics.map((token) => [token.name, token]))
    const warnings: Warning[] = []

    for (const pair of CONTRAST_PAIRS) {
        const foreground = byName.get(pair.fg)
        const background = byName.get(pair.bg)
        if (!foreground || !background) continue

        const ground = pair.over ? byName.get(pair.over) : undefined
        if (pair.over && !ground) continue

        for (const mode of MODES) {
            const fgHex = oklchToHex(foreground.values[mode]!.oklch)
            const { alpha } = background[mode]
            // A translucent background is measured as what it becomes over its
            // ground, not as the primitive hiding underneath it.
            const bgHex =
                alpha !== undefined && ground
                    ? composite(
                          oklchToHex(background.values[mode]!.oklch),
                          alpha,
                          oklchToHex(ground.values[mode]!.oklch),
                      )
                    : oklchToHex(background.values[mode]!.oklch)
            const lc = Math.abs(apca(fgHex, bgHex))
            const required = LC_THRESHOLD[pair.usage]
            if (lc >= required) continue

            const fix = suggestStep(resolved, foreground, bgHex, mode, required)
            warnings.push({
                // Non-text boundaries failing is a nudge; unreadable text is a defect.
                level: pair.usage === "non-text" ? "warn" : "fail",
                kind: "contrast",
                mode,
                // Naming the ground matters for a wash: "on state-hover" alone
                // is unactionable when the answer differs per surface.
                message: `\`${pair.fg}\` on \`${pair.bg}\`${pair.over ? ` over \`${pair.over}\`` : ""} (${mode}) reads at Lc ${lc}, under the Lc ${required} needed for ${pair.usage === "non-text" ? "a visible boundary" : `${pair.usage} text`}.`,
                tokens: pair.over ? [pair.fg, pair.bg, pair.over] : [pair.fg, pair.bg],
                apcaLc: lc,
                wcagRatio: wcag(fgHex, bgHex),
                requiredLc: required,
                ...(fix ? { fix: { token: pair.fg, mode, ref: fix } } : {}),
            })
        }
    }

    return warnings
}
