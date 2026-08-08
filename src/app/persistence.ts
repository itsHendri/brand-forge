/**
 * Talks to the Vite dev-server middleware (see vite-plugin-brandforge-fs.ts).
 * Brands are real files in `brands/`, so multi-brand is just multiple files and
 * every change has a git history.
 */

import type { BrandConfig } from "../engine/types"

export async function listBrands(): Promise<string[]> {
    const response = await fetch("/api/brands")
    if (!response.ok) return []
    return response.json()
}

export async function loadBrand(slug: string): Promise<BrandConfig | null> {
    const response = await fetch(`/api/brands/${slug}`)
    if (!response.ok) return null
    try {
        return (await response.json()) as BrandConfig
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
