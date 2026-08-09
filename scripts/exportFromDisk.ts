/**
 * What `exports/<slug>/` should contain, computed from `brands/<slug>.json`.
 *
 * Lives in `scripts/` rather than `src/` on purpose: it reads the filesystem,
 * and nothing the browser bundles is allowed to. Two consumers — the `npm run
 * export` CLI next door, and `src/export/freshness.test.ts`, which uses it to
 * fail the build when what's on disk no longer matches what the engine makes.
 *
 * It goes through the real path — `migrateConfig` → `resolveTokens` →
 * `buildExport` — so it cannot generate anything the app wouldn't.
 */

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { resolveTokens } from "../src/engine/resolve"
import { migrateConfig } from "../src/engine/schema"
import { buildExport, referencedAssets, type ExportFile } from "../src/export/bundle"
import { hendriPreset } from "../src/presets/hendri"

export const BRANDS_DIR = "brands"
export const EXPORTS_DIR = "exports"

export function brandSlugs(): string[] {
    return readdirSync(BRANDS_DIR)
        .filter((name) => name.endsWith(".json"))
        .map((name) => name.replace(/\.json$/, ""))
        .sort()
}

/** Everything that should be on disk for one brand, assets included. */
export function expectedFiles(slug: string): ExportFile[] {
    const raw = JSON.parse(readFileSync(join(BRANDS_DIR, `${slug}.json`), "utf8")) as unknown
    const { config } = migrateConfig(raw, hendriPreset)
    const resolved = resolveTokens(config)
    const files = buildExport(resolved)

    for (const fileName of referencedAssets(resolved)) {
        files.push({
            path: `assets/${fileName}`,
            content: readFileSync(join(BRANDS_DIR, "assets", slug, fileName)).toString("base64"),
            note: "Referenced by the brand.",
            encoding: "base64",
        })
    }
    return files
}
