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

import type { BrandConfig } from "./types"

/** Blocks that are replaced wholesale when present, and defaulted when absent. */
const BLOCKS = [
    "meta",
    "color",
    "typography",
    "layout",
    "spacing",
    "radius",
    "shadows",
    "motion",
    "rules",
] as const

export interface MigrationResult {
    config: BrandConfig
    /** Blocks that were missing and filled from defaults — surfaced, never silent. */
    filled: string[]
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function migrateConfig(raw: unknown, defaults: BrandConfig): MigrationResult {
    if (!isObject(raw)) return { config: defaults, filled: ["everything"] }

    const config = { ...defaults } as unknown as Record<string, unknown>
    const filled: string[] = []

    for (const block of BLOCKS) {
        const value = raw[block]
        if (isObject(value)) config[block] = value
        else filled.push(block)
    }

    // Version is informational today; when a real migration is needed this is
    // where it branches.
    config.$schemaVersion = defaults.$schemaVersion

    return { config: config as unknown as BrandConfig, filled }
}
