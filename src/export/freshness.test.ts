/**
 * `exports/<slug>/` must match what the engine generates from `brands/<slug>.json`.
 *
 * This is the check `FUTURE.md` kept asking for and three sessions kept not
 * adding, on the grounds that it "fails legitimately whenever someone edits a
 * brand without re-exporting". That reasoning was backwards: an export that no
 * longer matches its brand IS the defect — it is how an acceptance run ends up
 * critiquing documentation the code stopped producing, and how a handover ships
 * a stylesheet nobody generated. The failure is the point.
 *
 * What made it unaffordable before was the fix being manual. It isn't now:
 *
 *     npm run export
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"
import { brandSlugs, EXPORTS_DIR, expectedFiles } from "../../scripts/exportFromDisk"

const FIX = "Run `npm run export` to regenerate."

/** Every file actually on disk under a directory, as paths relative to it. */
function actualFiles(root: string): string[] {
    const found: string[] = []
    const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry)
            if (statSync(full).isDirectory()) walk(full)
            else found.push(relative(root, full))
        }
    }
    if (existsSync(root)) walk(root)
    return found.sort()
}

describe("exports are not stale", () => {
    const slugs = brandSlugs()

    it("there is at least one brand to check", () => {
        expect(slugs.length).toBeGreaterThan(0)
    })

    for (const slug of slugs) {
        describe(slug, () => {
            const expected = expectedFiles(slug)
            const root = join(EXPORTS_DIR, slug)

            it(`has exactly the files the engine generates. ${FIX}`, () => {
                expect(actualFiles(root)).toEqual(expected.map((file) => file.path).sort())
            })

            for (const file of expected) {
                it(`${file.path} matches. ${FIX}`, () => {
                    const target = join(root, file.path)
                    expect(existsSync(target), `${target} is missing. ${FIX}`).toBe(true)
                    if (file.encoding === "base64") {
                        expect(readFileSync(target).toString("base64")).toBe(file.content)
                    } else {
                        expect(readFileSync(target, "utf8")).toBe(file.content)
                    }
                })
            }
        })
    }
})
