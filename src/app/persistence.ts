/**
 * Talks to the Vite dev-server middleware (see vite-plugin-brandforge-fs.ts).
 * Brands are real files in `brands/`, so multi-brand is just multiple files and
 * every change has a git history.
 */

import { migrateConfig } from "../engine/schema"
import type { BrandConfig } from "../engine/types"

export async function listBrands(): Promise<string[]> {
    const response = await fetch("/api/brands")
    if (!response.ok) return []
    const all = (await response.json()) as string[]
    // `.backup` lives inside brands/; it is not a brand.
    return all.filter((slug) => !slug.startsWith("."))
}

export async function deleteBrand(slug: string): Promise<boolean> {
    const response = await fetch(`/api/brands/${slug}`, { method: "DELETE" })
    return response.ok
}

export async function loadBrand(slug: string, defaults: BrandConfig): Promise<BrandConfig | null> {
    const response = await fetch(`/api/brands/${slug}`)
    if (!response.ok) return null
    try {
        const { config, filled } = migrateConfig(await response.json(), defaults)
        if (filled.length > 0) {
            // Worth saying out loud: the file on disk is older than the schema,
            // and the next autosave will rewrite it with these blocks included.
            console.info(`[brand-forge] ${slug}: filled missing blocks from defaults — ${filled.join(", ")}`)
        }
        return config
    } catch {
        return null
    }
}

export async function saveBrand(config: BrandConfig): Promise<boolean> {
    const response = await fetch(`/api/brands/${config.meta.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config, null, 4),
    })
    return response.ok
}

export async function writeExport(
    slug: string,
    files: Record<string, string>,
): Promise<{ ok: boolean; dir?: string }> {
    const response = await fetch(`/api/export/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(files),
    })
    if (!response.ok) return { ok: false }
    return response.json()
}
