/**
 * The one pipeline: BrandConfig → ResolvedTokens.
 *
 * Everything downstream — the live preview, tokens.css, tokens.json,
 * DESIGN_SYSTEM.md, SKILL.md — reads `declarations`. There is exactly one
 * serialization of the system, so the preview and the export cannot disagree.
 */

import { DARK_SHADOWS, deriveRadius, spaceName } from "./defaults"
import { generateScale, oklchToCss, oklchToHex, parseSeed } from "./scale"
import {
    SCALE_ROLES,
    STEPS,
    type BrandConfig,
    type Declaration,
    type Mode,
    type ResolvedScale,
    type ResolvedSemantic,
    type ResolvedSwatch,
    type ResolvedTokens,
    type ScaleRole,
    type Step,
    type Warning,
} from "./types"

const MODES: Mode[] = ["light", "dark"]

function resolveScales(config: BrandConfig): {
    scales: Record<ScaleRole, ResolvedScale>
    warnings: Warning[]
} {
    const scales = {} as Record<ScaleRole, ResolvedScale>
    const warnings: Warning[] = []

    for (const scaleConfig of config.color.scales) {
        const steps = { light: {}, dark: {} } as Record<Mode, Record<Step, ResolvedSwatch>>
        let anchorStep: Step = 500

        for (const mode of MODES) {
            const generated = generateScale(
                scaleConfig.seed,
                mode,
                scaleConfig.tuning?.[mode] ?? {},
            )
            if (mode === "light") {
                anchorStep = generated.anchorStep
                if (generated.seedClamped) {
                    warnings.push({
                        level: "warn",
                        kind: "scale",
                        message: `${scaleConfig.name}: seed ${scaleConfig.seed} sits between two steps, so the ramp carries a near-match rather than the exact colour. Nudge its lightness to land it verbatim.`,
                    })
                }
            }

            const overrides = scaleConfig.overrides?.[mode] ?? {}
            for (const step of STEPS) {
                const override = overrides[step]
                const parsed = override ? parseSeed(override) : null
                const oklch = parsed ?? generated.steps[step]
                steps[mode][step] = {
                    oklch,
                    css: oklchToCss(oklch),
                    hex: oklchToHex(oklch),
                    overridden: Boolean(parsed),
                }
            }
        }

        scales[scaleConfig.role] = {
            role: scaleConfig.role,
            name: scaleConfig.name,
            seed: scaleConfig.seed,
            anchorStep,
            steps,
        }
    }

    for (const role of SCALE_ROLES) {
        if (!scales[role]) {
            warnings.push({
                level: "fail",
                kind: "config",
                message: `No seed for the "${role}" scale — semantic tokens pointing at it cannot resolve.`,
            })
        }
    }

    return { scales, warnings }
}

function resolveSemantics(
    config: BrandConfig,
    scales: Record<ScaleRole, ResolvedScale>,
): { semantics: ResolvedSemantic[]; warnings: Warning[] } {
    const warnings: Warning[] = []
    const semantics: ResolvedSemantic[] = []

    for (const def of config.color.semantics) {
        const values = {} as Record<Mode, ResolvedSwatch>
        let ok = true
        for (const mode of MODES) {
            const ref = def[mode]
            const swatch = scales[ref.scale]?.steps[mode][ref.step]
            if (!swatch) {
                ok = false
                warnings.push({
                    level: "fail",
                    kind: "config",
                    message: `\`${def.name}\` points at ${ref.scale}-${ref.step} (${mode}), which does not exist.`,
                    tokens: [def.name],
                    mode,
                })
                continue
            }
            values[mode] = swatch
        }
        if (ok) semantics.push({ ...def, values })
    }

    return { semantics, warnings }
}

/** `--primary-600` etc. Primitives keep the Tailwind numbering everyone already knows. */
export const primitiveVar = (role: ScaleRole, step: Step): string => `--${role}-${step}`

function buildDeclarations(
    config: BrandConfig,
    scales: Record<ScaleRole, ResolvedScale>,
    semantics: ResolvedSemantic[],
    radius: Record<string, number>,
): Record<Mode, Declaration[]> {
    const colorFor = (mode: Mode): Declaration[] => {
        const out: Declaration[] = []
        for (const role of SCALE_ROLES) {
            const scale = scales[role]
            if (!scale) continue
            for (const step of STEPS) {
                out.push([primitiveVar(role, step), scale.steps[mode][step]!.css])
            }
        }
        // Semantics alias their primitive rather than restating the value, so the
        // exported CSS shows the mapping and a colour appears in exactly one place.
        for (const token of semantics) {
            out.push([`--${token.name}`, `var(${primitiveVar(token[mode].scale, token[mode].step)})`])
        }
        return out
    }

    const light = colorFor("light")
    const dark = colorFor("dark")

    // Light carries the mode-invariant tokens too; the dark block only overrides
    // what actually changes (colour + elevation).
    light.push(["--font-sans", config.typography.families.sans])
    light.push(["--font-mono", config.typography.families.mono])
    if (config.typography.families.serif) {
        light.push(["--font-serif", config.typography.families.serif])
    }

    for (const role of config.typography.roles) {
        light.push([`--text-${role.role}`, `${role.sizeRem}rem`])
        light.push([`--text-${role.role}--line-height`, String(role.lineHeight)])
        light.push([`--text-${role.role}--font-weight`, String(role.weight)])
        if (role.tracking) light.push([`--text-${role.role}--letter-spacing`, role.tracking])
    }

    for (const px of config.spacing.blessed) {
        light.push([`--space-${spaceName(px, config.spacing.basePx)}`, `${px / 16}rem`])
    }

    for (const [step, px] of Object.entries(radius)) {
        light.push([`--radius-${step}`, step === "full" ? "9999px" : `${px}px`])
    }

    for (const level of config.shadows.levels) {
        light.push([`--shadow-${level.name}`, level.layers.join(", ")])
        const darkShadow = DARK_SHADOWS[level.name]
        if (darkShadow) dark.push([`--shadow-${level.name}`, darkShadow])
    }

    for (const [name, ms] of Object.entries(config.motion.durations)) {
        light.push([`--duration-${name}`, `${ms}ms`])
    }
    for (const [name, curve] of Object.entries(config.motion.easings)) {
        light.push([`--ease-${name}`, curve])
    }

    return { light, dark }
}

export function resolveTokens(config: BrandConfig): ResolvedTokens {
    const { scales, warnings: scaleWarnings } = resolveScales(config)
    const { semantics, warnings: semanticWarnings } = resolveSemantics(config, scales)
    const radius = deriveRadius(config.radius.basePx, config.radius.steps)
    const declarations = buildDeclarations(config, scales, semantics, radius)

    return {
        config,
        scales,
        semantics,
        radius,
        declarations,
        warnings: [...scaleWarnings, ...semanticWarnings],
    }
}

/**
 * Where each seed lands on its ramp. `defaultSemanticMapping` needs this so the
 * colour you typed becomes the colour of your buttons — not a near neighbour.
 */
export function anchorsFrom(scaleConfigs: BrandConfig["color"]["scales"]): Record<ScaleRole, Step> {
    const anchors = {} as Record<ScaleRole, Step>
    for (const scale of scaleConfigs) {
        anchors[scale.role] = generateScale(scale.seed, "light", scale.tuning?.light ?? {}).anchorStep
    }
    return anchors
}

/** Look up a resolved semantic by name — used by the contrast pass and the docs. */
export function semanticByName(
    resolved: ResolvedTokens,
    name: string,
): ResolvedSemantic | undefined {
    return resolved.semantics.find((token) => token.name === name)
}
