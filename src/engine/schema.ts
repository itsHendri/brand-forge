/**
 * Loading a saved brand.
 *
 * `brands/*.json` are real files with a life of their own — written by autosave,
 * edited by hand, committed, and read back weeks later. Adding a field to
 * `BrandConfig` therefore breaks every file written before it existed, and the
 * failure is a hard crash on first render rather than anything diagnosable.
 *
 * So a loaded config is never trusted as-is: it is merged over a complete
 * default, block by block. A file missing `layout` gains the default layout; a
 * file that has one keeps every word of it.
 */

import { defaultSemanticMapping } from "./semantics"
import type { BrandConfig, ScaleConfig, SemanticOverride, SemanticRef, SemanticTokenDef } from "./types"

/** Blocks that are replaced wholesale when present, and defaulted when absent. */
const BLOCKS = [
    "meta",
    "color",
    "typography",
    "layout",
    "spacing",
    "opacity",
    "radius",
    "shadows",
    "motion",
    "rules",
] as const

export interface MigrationResult {
    config: BrandConfig
    /** Blocks that were missing and filled from defaults — surfaced, never silent. */
    filled: string[]
    /**
     * Tokens converted from the old stored-semantics format into overrides.
     * Empty for any file written after the format changed.
     */
    inferredOverrides: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

const sameRef = (a: SemanticRef | undefined, b: SemanticRef | undefined): boolean =>
    a?.scale === b?.scale && a?.step === b?.step

/**
 * Convert a pre-override file, which stored the whole resolved semantic set.
 *
 * A stored token that still matches what the generator produces was never
 * touched, so it becomes nothing. A stored token that differs becomes an
 * override, which preserves genuine hand edits across the format change.
 *
 * The honest caveat: this cannot tell a hand edit from a *stale default* — a
 * token that differs because the generator improved since the file was written
 * looks identical to one a human moved, and gets frozen as an override. That is
 * survivable only because it was checked before shipping: at the time of the
 * change the one real brand file had drifted in exactly zero of its 57 tokens,
 * so this path provably converted nothing. It is here for files written
 * elsewhere, and it is why the conversion is reported rather than performed
 * quietly. See DECISIONS #22.
 */
function inferOverrides(stored: unknown, scales: ScaleConfig[]): SemanticOverride[] {
    if (!Array.isArray(stored)) return []
    const generated = new Map(defaultSemanticMapping(scales).map((def) => [def.name, def]))
    const overrides: SemanticOverride[] = []

    for (const token of stored as SemanticTokenDef[]) {
        const def = generated.get(token?.name)
        if (!def) continue
        const override: SemanticOverride = { name: token.name }
        if (!sameRef(token.light, def.light)) override.light = token.light
        if (!sameRef(token.dark, def.dark)) override.dark = token.dark
        if (override.light || override.dark) overrides.push(override)
    }
    return overrides
}

export function migrateConfig(raw: unknown, defaults: BrandConfig): MigrationResult {
    if (!isObject(raw)) return { config: defaults, filled: ["everything"], inferredOverrides: [] }

    const config = { ...defaults } as unknown as Record<string, unknown>
    const filled: string[] = []

    for (const block of BLOCKS) {
        const value = raw[block]
        if (isObject(value)) config[block] = value
        else filled.push(block)
    }

    // The colour block needs more than a wholesale swap: it changed shape when
    // the semantic set stopped being persisted.
    const color = config.color as { scales?: ScaleConfig[]; semanticOverrides?: unknown; semantics?: unknown }
    const scales = Array.isArray(color?.scales) ? color.scales : defaults.color.scales
    let inferredOverrides: string[] = []

    if (Array.isArray(color?.semanticOverrides)) {
        config.color = { scales, semanticOverrides: color.semanticOverrides as SemanticOverride[] }
    } else {
        const overrides = inferOverrides(color?.semantics, scales)
        inferredOverrides = overrides.map((override) => override.name)
        config.color = { scales, semanticOverrides: overrides }
    }

    // Version is informational today; when a real migration is needed this is
    // where it branches.
    config.$schemaVersion = defaults.$schemaVersion

    return { config: config as unknown as BrandConfig, filled, inferredOverrides }
}
