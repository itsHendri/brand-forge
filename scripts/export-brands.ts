/**
 * Regenerate `exports/<slug>/` from `brands/<slug>.json`, headlessly.
 *
 * The app has always been able to write an export, but only from a browser with
 * somebody clicking a button — which is why exports drifted from the code
 * repeatedly, and why an acceptance run could end up critiquing documentation
 * the engine no longer produced. A stale export is now a failing test
 * (`src/export/freshness.test.ts`), and this is the one command that fixes it.
 *
 *   npm run export            # every brand
 *   npm run export -- hendri  # just one
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { brandSlugs, EXPORTS_DIR, expectedFiles } from "./exportFromDisk"
import type { ExportFile } from "../src/export/bundle"

function write(slug: string, files: ExportFile[]): void {
    const root = join(EXPORTS_DIR, slug)
    // Cleared first, so an artifact that stops being generated stops existing.
    // An export folder that accumulates orphans is how a deleted file keeps
    // getting handed to people.
    rmSync(root, { recursive: true, force: true })
    for (const file of files) {
        const target = join(root, file.path)
        mkdirSync(dirname(target), { recursive: true })
        if (file.encoding === "base64") writeFileSync(target, Buffer.from(file.content, "base64"))
        else writeFileSync(target, file.content, "utf8")
    }
}

const requested = process.argv.slice(2)
for (const slug of requested.length > 0 ? requested : brandSlugs()) {
    const files = expectedFiles(slug)
    write(slug, files)
    console.log(`${EXPORTS_DIR}/${slug}/ — ${files.length} files`)
}
