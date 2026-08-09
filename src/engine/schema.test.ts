import { describe, expect, it } from "vitest"
import { hendriPreset } from "../presets/hendri"
import { resolveTokens } from "./resolve"
import { migrateConfig } from "./schema"
import { defaultSemanticMapping, semanticDefs } from "./semantics"
import type { SemanticTokenDef } from "./types"

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

    // ── The pre-override format ─────────────────────────────────────────────
    // Files written before the semantic set stopped being persisted still store
    // all 57 resolved tokens. They have to keep working, and a hand edit inside
    // one has to survive the conversion.

    const asOldFormat = (semantics: SemanticTokenDef[]) => ({
        ...structuredClone(hendriPreset),
        color: { scales: hendriPreset.color.scales, semantics },
    })

    it("converts an untouched pre-override file into no overrides at all", () => {
        const stored = defaultSemanticMapping(hendriPreset.color.scales)

        const { config, inferredOverrides } = migrateConfig(asOldFormat(stored), hendriPreset)
        expect(inferredOverrides).toEqual([])
        expect(config.color.semanticOverrides).toEqual([])
    })

    it("keeps a hand edit found inside a pre-override file", () => {
        const stored = defaultSemanticMapping(hendriPreset.color.scales)
        const ring = stored.find((token) => token.name === "ring")!
        ring.light = { scale: "danger", step: 600 }

        const { config, inferredOverrides } = migrateConfig(asOldFormat(stored), hendriPreset)
        expect(inferredOverrides).toEqual(["ring"])
        expect(config.color.semanticOverrides).toEqual([
            { name: "ring", light: { scale: "danger", step: 600 } },
        ])
        // …and only that mode. Dark still tracks the generator.
        expect(config.color.semanticOverrides[0]!.dark).toBeUndefined()
    })
})

describe("semanticDefs", () => {
    const { scales } = hendriPreset.color

    it("regenerates from the seeds when nothing is overridden", () => {
        const { defs, orphaned } = semanticDefs(scales, [])
        expect(orphaned).toEqual([])
        expect(defs.map((def) => def.name)).toEqual(defaultSemanticMapping(scales).map((def) => def.name))
        expect(defs.every((def) => !def.overridden.light && !def.overridden.dark)).toBe(true)
    })

    it("applies an override to one mode and leaves the other generated", () => {
        const generated = defaultSemanticMapping(scales).find((def) => def.name === "ring")!
        const { defs } = semanticDefs(scales, [{ name: "ring", light: { scale: "danger", step: 600 } }])
        const ring = defs.find((def) => def.name === "ring")!

        expect(ring.light).toEqual({ scale: "danger", step: 600 })
        expect(ring.dark).toEqual(generated.dark)
        expect(ring.overridden).toEqual({ light: true, dark: false })
    })

    it("keeps the generated description — an override moves a ref, not the docs", () => {
        const generated = defaultSemanticMapping(scales).find((def) => def.name === "primary")!
        const { defs } = semanticDefs(scales, [{ name: "primary", light: { scale: "neutral", step: 950 } }])
        const primary = defs.find((def) => def.name === "primary")!

        expect(primary.description).toBe(generated.description)
        expect(primary.group).toBe(generated.group)
    })

    it("reports an override for a token that no longer exists rather than dropping it", () => {
        const { defs, orphaned } = semanticDefs(scales, [
            { name: "token-that-was-renamed", light: { scale: "primary", step: 500 } },
        ])
        expect(orphaned).toEqual(["token-that-was-renamed"])
        expect(defs.find((def) => def.name === "token-that-was-renamed")).toBeUndefined()
    })

    it("is why an improved default reaches a brand that already exists", () => {
        // The bug this format change fixes, stated as a test: a brand carrying
        // one hand edit still tracks the generator for all 56 other tokens.
        const overrides = [{ name: "ring", light: { scale: "danger" as const, step: 600 as const } }]
        const { defs } = semanticDefs(scales, overrides)
        const generated = defaultSemanticMapping(scales)

        const tracking = defs.filter((def) => {
            const match = generated.find((g) => g.name === def.name)!
            return JSON.stringify(def.light) === JSON.stringify(match.light)
        })
        expect(tracking.length).toBe(generated.length - 1)
    })
})
