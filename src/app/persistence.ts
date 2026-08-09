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
        const { config, filled, inferredOverrides } = migrateConfig(await response.json(), defaults)
        if (filled.length > 0) {
            // Worth saying out loud: the file on disk is older than the schema,
            // and the next autosave will rewrite it with these blocks included.
            console.info(`[brand-forge] ${slug}: filled missing blocks from defaults — ${filled.join(", ")}`)
        }
        if (inferredOverrides.length > 0) {
            // This file predates overrides-only storage. These tokens differed
            // from what the seeds generate and have been kept as hand edits —
            // check them, because a stale default looks exactly like an edit.
            console.warn(
                `[brand-forge] ${slug}: converted ${inferredOverrides.length} stored token(s) into overrides — ${inferredOverrides.join(", ")}. If any of these were not deliberate, reset them in the Semantics panel.`,
            )
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

/** Where the preview and the app fetch an asset from. */
export const assetUrl = (slug: string, fileName: string): string =>
    `/api/assets/${slug}/${encodeURIComponent(fileName)}`

export async function listAssets(slug: string): Promise<string[]> {
    const response = await fetch(`/api/assets/${slug}`)
    if (!response.ok) return []
    return response.json()
}

export async function uploadAsset(slug: string, file: File): Promise<string | null> {
    const base64 = await new Promise<string>((resolveBase64, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolveBase64(String(reader.result).split(",")[1] ?? "")
        reader.onerror = () => reject(new Error("could not read file"))
        reader.readAsDataURL(file)
    })
    const response = await fetch(`/api/assets/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, base64 }),
    })
    if (!response.ok) return null
    return file.name
}

export async function removeAsset(slug: string, fileName: string): Promise<boolean> {
    const response = await fetch(assetUrl(slug, fileName), { method: "DELETE" })
    return response.ok
}

/** Assets have to travel with the export, so read them back as base64. */
export async function readAssetBase64(slug: string, fileName: string): Promise<string | null> {
    const response = await fetch(assetUrl(slug, fileName))
    if (!response.ok) return null
    const buffer = await response.arrayBuffer()
    let binary = ""
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    return btoa(binary)
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
