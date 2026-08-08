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
export const CONTRAST_PAIRS: Array<{ fg: string; bg: string; usage: Usage }> = [
    { fg: "foreground", bg: "background", usage: "body" },
    { fg: "foreground", bg: "surface", usage: "body" },
    // `foreground-secondary` is defined as a large-text colour (body-lg and up);
    // small supporting text uses the darker `muted-foreground`.
    { fg: "foreground-secondary", bg: "background", usage: "large" },
    { fg: "foreground-secondary", bg: "surface", usage: "large" },
    { fg: "muted-foreground", bg: "background", usage: "body" },
    { fg: "muted-foreground", bg: "surface", usage: "body" },
    { fg: "muted-foreground", bg: "muted", usage: "body" },
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
    { fg: "foreground", bg: "state-hover", usage: "body" },
    { fg: "foreground", bg: "state-selected", usage: "body" },
    { fg: "border", bg: "background", usage: "non-text" },
    { fg: "border", bg: "surface", usage: "non-text" },
    { fg: "input", bg: "surface", usage: "non-text" },
    { fg: "ring", bg: "background", usage: "non-text" },
    ...(["success", "warning", "danger", "info"] as const).flatMap((status) => [
        { fg: `${status}-foreground`, bg: status, usage: "ui" as Usage },
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

        for (const mode of MODES) {
            const fgHex = oklchToHex(foreground.values[mode]!.oklch)
            const bgHex = oklchToHex(background.values[mode]!.oklch)
            const lc = Math.abs(apca(fgHex, bgHex))
            const required = LC_THRESHOLD[pair.usage]
            if (lc >= required) continue

            const fix = suggestStep(resolved, foreground, bgHex, mode, required)
            warnings.push({
                // Non-text boundaries failing is a nudge; unreadable text is a defect.
                level: pair.usage === "non-text" ? "warn" : "fail",
                kind: "contrast",
                mode,
                message: `\`${pair.fg}\` on \`${pair.bg}\` (${mode}) reads at Lc ${lc}, under the Lc ${required} needed for ${pair.usage === "non-text" ? "a visible boundary" : `${pair.usage} text`}.`,
                tokens: [pair.fg, pair.bg],
                apcaLc: lc,
                wcagRatio: wcag(fgHex, bgHex),
                requiredLc: required,
                ...(fix ? { fix: { token: pair.fg, mode, ref: fix } } : {}),
            })
        }
    }

    return warnings
}
