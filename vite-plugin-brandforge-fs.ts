/**
 * The dev server IS the sidecar.
 *
 * Brand Forge only ever runs locally under `vite dev`, so rather than shipping a
 * separate Node process (or fighting the Chromium-only File System Access API),
 * the dev server exposes a few endpoints that read and write real files:
 *
 *   GET  /api/brands            → list saved brands
 *   GET  /api/brands/:slug      → read one config
 *   PUT  /api/brands/:slug      → write one config (debounced autosave)
 *   POST /api/export/:slug      → write a whole export tree to exports/<slug>/
 *
 * That last one is what makes the generated skill folder land somewhere you can
 * symlink straight into ~/.claude/skills/.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import type { IncomingMessage, ServerResponse } from "node:http"
import { dirname, extname, join, resolve } from "node:path"
import type { Plugin } from "vite"

const ROOT = resolve(import.meta.dirname)
const BRANDS_DIR = join(ROOT, "brands")
const BACKUP_DIR = join(BRANDS_DIR, ".backup")
const ASSETS_DIR = join(BRANDS_DIR, "assets")
const EXPORTS_DIR = join(ROOT, "exports")

/**
 * Assets live in `brands/assets/<slug>/` rather than inside a per-brand folder.
 * Restructuring the config into `brands/<slug>/brand.json` would have meant
 * migrating every existing file for no user-facing gain — a brand is made
 * portable by the export bundling its assets, which it does, not by the shape of
 * the working directory.
 */
const ASSET_TYPES: Record<string, string> = {
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
}

/** No paths, no traversal — a file name and nothing else. */
const SAFE_FILE = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/

const SLUG = /^[a-z0-9][a-z0-9-]*$/

function json(res: ServerResponse, status: number, body: unknown) {
    res.statusCode = status
    res.setHeader("Content-Type", "application/json")
    res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolveBody, reject) => {
        let data = ""
        req.on("data", (chunk: Buffer | string) => {
            data += String(chunk)
        })
        req.on("end", () => resolveBody(data))
        req.on("error", () => reject(new Error("request stream failed")))
    })
}

export function brandForgeFs(): Plugin {
    return {
        name: "brand-forge-fs",
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                const url = req.url ?? ""
                if (!url.startsWith("/api/")) return next()

                try {
                    // GET /api/brands
                    if (url === "/api/brands" && req.method === "GET") {
                        await mkdir(BRANDS_DIR, { recursive: true })
                        const files = await readdir(BRANDS_DIR)
                        return json(
                            res,
                            200,
                            files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")),
                        )
                    }

                    const brandMatch = url.match(/^\/api\/brands\/([^/?]+)$/)
                    if (brandMatch) {
                        const slug = brandMatch[1]!
                        if (!SLUG.test(slug)) return json(res, 400, { error: "bad slug" })
                        const file = join(BRANDS_DIR, `${slug}.json`)

                        if (req.method === "GET") {
                            const content = await readFile(file, "utf8").catch(() => null)
                            if (content === null) return json(res, 404, { error: "not found" })
                            res.statusCode = 200
                            res.setHeader("Content-Type", "application/json")
                            return res.end(content)
                        }

                        if (req.method === "PUT") {
                            const body = await readBody(req)
                            JSON.parse(body) // reject malformed writes before they hit disk
                            await mkdir(BRANDS_DIR, { recursive: true })
                            // Keep the version we are about to replace. Autosave is
                            // instant, so without this the only copy of a good state
                            // is gone the moment something writes a bad one.
                            const existing = await readFile(file, "utf8").catch(() => null)
                            if (existing !== null && existing !== body) {
                                await mkdir(BACKUP_DIR, { recursive: true })
                                await writeFile(join(BACKUP_DIR, `${slug}.json`), existing, "utf8")
                            }
                            await writeFile(file, body, "utf8")
                            return json(res, 200, { ok: true, slug })
                        }

                        if (req.method === "DELETE") {
                            // Moved aside, not destroyed — deleting a client's brand
                            // by mis-click should be survivable.
                            const existing = await readFile(file, "utf8").catch(() => null)
                            if (existing !== null) {
                                await mkdir(BACKUP_DIR, { recursive: true })
                                await writeFile(join(BACKUP_DIR, `${slug}.deleted.json`), existing, "utf8")
                            }
                            await rm(file, { force: true })
                            return json(res, 200, { ok: true, slug })
                        }
                    }

                    // GET /api/assets/:slug            → list
                    // POST /api/assets/:slug           → { fileName, base64 }
                    // GET /api/assets/:slug/:file      → the bytes
                    // DELETE /api/assets/:slug/:file   → remove
                    const assetList = url.match(/^\/api\/assets\/([^/?]+)$/)
                    if (assetList) {
                        const slug = assetList[1]!
                        if (!SLUG.test(slug)) return json(res, 400, { error: "bad slug" })
                        const dir = join(ASSETS_DIR, slug)

                        if (req.method === "GET") {
                            const files = await readdir(dir).catch(() => [] as string[])
                            return json(res, 200, files)
                        }

                        if (req.method === "POST") {
                            const { fileName, base64 } = JSON.parse(await readBody(req)) as {
                                fileName: string
                                base64: string
                            }
                            if (!SAFE_FILE.test(fileName)) return json(res, 400, { error: "bad file name" })
                            const extension = extname(fileName).toLowerCase()
                            if (!ASSET_TYPES[extension]) return json(res, 400, { error: `unsupported type ${extension}` })
                            await mkdir(dir, { recursive: true })
                            await writeFile(join(dir, fileName), Buffer.from(base64, "base64"))
                            return json(res, 200, { ok: true, fileName })
                        }
                    }

                    const assetFile = url.match(/^\/api\/assets\/([^/?]+)\/([^/?]+)$/)
                    if (assetFile) {
                        const slug = assetFile[1]!
                        const fileName = decodeURIComponent(assetFile[2]!)
                        if (!SLUG.test(slug) || !SAFE_FILE.test(fileName)) {
                            return json(res, 400, { error: "bad path" })
                        }
                        const target = join(ASSETS_DIR, slug, fileName)

                        if (req.method === "GET") {
                            const bytes = await readFile(target).catch(() => null)
                            if (!bytes) return json(res, 404, { error: "not found" })
                            res.statusCode = 200
                            res.setHeader("Content-Type", ASSET_TYPES[extname(fileName).toLowerCase()] ?? "application/octet-stream")
                            res.setHeader("Cache-Control", "no-cache")
                            return res.end(bytes)
                        }

                        if (req.method === "DELETE") {
                            await rm(target, { force: true })
                            return json(res, 200, { ok: true })
                        }
                    }

                    const exportMatch = url.match(/^\/api\/export\/([^/?]+)$/)
                    if (exportMatch && req.method === "POST") {
                        const slug = exportMatch[1]!
                        if (!SLUG.test(slug)) return json(res, 400, { error: "bad slug" })
                        const files = JSON.parse(await readBody(req)) as Record<string, string>
                        const base = join(EXPORTS_DIR, slug)
                        const written: string[] = []
                        for (const [key, content] of Object.entries(files)) {
                            // `base64:` prefix marks an asset — bytes, not text.
                            const binary = key.startsWith("base64:")
                            const relative = binary ? key.slice("base64:".length) : key
                            const target = join(base, relative)
                            if (!target.startsWith(base)) continue // no escaping the export dir
                            await mkdir(dirname(target), { recursive: true })
                            if (binary) await writeFile(target, Buffer.from(content, "base64"))
                            else await writeFile(target, content, "utf8")
                            written.push(relative)
                        }
                        return json(res, 200, { ok: true, dir: base, written })
                    }

                    return json(res, 404, { error: "unknown endpoint" })
                } catch (error) {
                    return json(res, 500, { error: String(error) })
                }
            })
        },
    }
}
