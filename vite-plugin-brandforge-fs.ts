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
import { dirname, join, resolve } from "node:path"
import type { Plugin } from "vite"

const ROOT = resolve(import.meta.dirname)
const BRANDS_DIR = join(ROOT, "brands")
const BACKUP_DIR = join(BRANDS_DIR, ".backup")
const EXPORTS_DIR = join(ROOT, "exports")

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

                    const exportMatch = url.match(/^\/api\/export\/([^/?]+)$/)
                    if (exportMatch && req.method === "POST") {
                        const slug = exportMatch[1]!
                        if (!SLUG.test(slug)) return json(res, 400, { error: "bad slug" })
                        const files = JSON.parse(await readBody(req)) as Record<string, string>
                        const base = join(EXPORTS_DIR, slug)
                        const written: string[] = []
                        for (const [relative, content] of Object.entries(files)) {
                            const target = join(base, relative)
                            if (!target.startsWith(base)) continue // no escaping the export dir
                            await mkdir(dirname(target), { recursive: true })
                            await writeFile(target, content, "utf8")
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
