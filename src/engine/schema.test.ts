import { describe, expect, it } from "vitest"
import { hendriPreset } from "../presets/hendri"
import { resolveTokens } from "./resolve"
import { migrateConfig } from "./schema"

describe("migrateConfig", () => {
    it("fills a block the saved file predates, instead of crashing on it", () => {
        // The exact failure that adding `layout` caused: every brand written
        // before it existed threw on first render reading config.layout.breakpoints.
        const old = structuredClone(hendriPreset) as Partial<typeof hendriPreset>
        delete old.layout

        const { config, filled } = migrateConfig(old, hendriPreset)
        expect(filled).toEqual(["layout"])
        expect(config.layout.breakpoints.length).toBeGreaterThan(0)
        expect(() => resolveTokens(config)).not.toThrow()
    })

    it("does not touch a block the file already has", () => {
        const saved = structuredClone(hendriPreset)
        saved.radius.basePx = 0
        saved.meta.name = "Client"

        const { config, filled } = migrateConfig(saved, hendriPreset)
        expect(filled).toEqual([])
        expect(config.radius.basePx).toBe(0)
        expect(config.meta.name).toBe("Client")
    })

    it("falls back completely when the file is not an object", () => {
        expect(migrateConfig(null, hendriPreset).config).toEqual(hendriPreset)
        expect(migrateConfig("nonsense", hendriPreset).filled).toEqual(["everything"])
    })

    it("survives a file missing everything but one block", () => {
        const { config, filled } = migrateConfig({ meta: hendriPreset.meta }, hendriPreset)
        expect(filled).not.toContain("meta")
        expect(filled.length).toBeGreaterThan(5)
        expect(() => resolveTokens(config)).not.toThrow()
    })
})
