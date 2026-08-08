import { describe, expect, it } from "vitest"
import { hendriPreset } from "../presets/hendri"
import { primitiveVar, resolveTokens, semanticByName } from "./resolve"
import { SCALE_ROLES, STEPS } from "./types"

const resolved = resolveTokens(hendriPreset)

describe("resolveTokens", () => {
    it("resolves every scale and every semantic token", () => {
        for (const role of SCALE_ROLES) expect(resolved.scales[role]).toBeDefined()
        expect(resolved.semantics.length).toBe(hendriPreset.color.semantics.length)
    })

    it("reports no failures for the shipped preset", () => {
        expect(resolved.warnings.filter((w) => w.level === "fail")).toEqual([])
    })

    it("makes the typed brand colour the actual primary fill", () => {
        const primary = semanticByName(resolved, "primary")!
        expect(primary.values.light!.hex).toBe("#574cff")
    })

    it("lifts the brand fill in dark mode rather than reusing the light value", () => {
        const primary = semanticByName(resolved, "primary")!
        expect(primary.values.dark!.oklch.l).toBeGreaterThan(primary.values.light!.oklch.l)
        // Lighter AND calmer: full-chroma brand on a dark ground reads as neon.
        expect(primary.values.dark!.oklch.c).toBeLessThan(primary.values.light!.oklch.c)
    })

    it("flips surfaces and ink between modes", () => {
        const background = semanticByName(resolved, "background")!
        const foreground = semanticByName(resolved, "foreground")!
        expect(background.values.light!.oklch.l).toBeGreaterThan(0.9)
        expect(background.values.dark!.oklch.l).toBeLessThan(0.3)
        expect(foreground.values.light!.oklch.l).toBeLessThan(0.3)
        expect(foreground.values.dark!.oklch.l).toBeGreaterThan(0.9)
    })

    describe("declarations — the single serialization", () => {
        const names = (mode: "light" | "dark") => resolved.declarations[mode].map(([name]) => name)

        it("emits every primitive step in both modes", () => {
            for (const role of SCALE_ROLES) {
                for (const step of STEPS) {
                    expect(names("light")).toContain(primitiveVar(role, step))
                    expect(names("dark")).toContain(primitiveVar(role, step))
                }
            }
        })

        it("aliases semantics to primitives instead of restating colour values", () => {
            const declaration = resolved.declarations.light.find(([name]) => name === "--primary")
            expect(declaration?.[1]).toMatch(/^var\(--primary-\d+\)$/)
        })

        it("puts mode-invariant tokens in light only, so dark is a pure override", () => {
            expect(names("light")).toContain("--radius-md")
            expect(names("light")).toContain("--duration-base")
            expect(names("light")).toContain("--text-body")
            expect(names("dark")).not.toContain("--radius-md")
            expect(names("dark")).not.toContain("--duration-base")
        })

        it("overrides elevation in dark mode — a ring, not a drop shadow", () => {
            const darkShadow = resolved.declarations.dark.find(([name]) => name === "--shadow-md")
            expect(darkShadow?.[1]).toContain("oklch(1 0 0")
        })

        it("has no duplicate declarations within a mode", () => {
            for (const mode of ["light", "dark"] as const) {
                const list = names(mode)
                expect(new Set(list).size).toBe(list.length)
            }
        })
    })

    it("keeps the surface ladder distinguishable where it claims to be", () => {
        const value = (name: string, mode: "light" | "dark") =>
            semanticByName(resolved, name)!.values[mode]!.hex

        // Dark mode shows elevation by climbing the ramp, so these must differ.
        expect(value("background", "dark")).not.toBe(value("surface", "dark"))
        expect(value("surface", "dark")).not.toBe(value("surface-raised", "dark"))
        expect(value("surface-raised", "dark")).not.toBe(value("muted", "dark"))
        expect(value("background", "light")).not.toBe(value("surface", "light"))
        expect(value("muted", "light")).not.toBe(value("surface", "light"))
    })

    it("keeps the three text levels genuinely distinct", () => {
        // A hierarchy the docs promise but the values don't make is worse than
        // no hierarchy: picking the wrong one looks correct until the ramp moves.
        for (const mode of ["light", "dark"] as const) {
            const levels = ["foreground", "foreground-secondary", "muted-foreground", "foreground-tertiary"]
            const hexes = levels.map((name) => semanticByName(resolved, name)!.values[mode]!.hex)
            expect(new Set(hexes).size, `${mode}: ${levels.join("/")} → ${hexes.join(", ")}`).toBe(
                levels.length,
            )
        }
    })

    it("puts a crisp label on solid fills, not a washed mid-grey", () => {
        for (const name of ["primary", "secondary", "danger", "success", "warning", "info"]) {
            for (const mode of ["light", "dark"] as const) {
                const step = semanticByName(resolved, `${name}-foreground`)![mode].step
                expect(
                    step <= 100 || step >= 900,
                    `${name}-foreground (${mode}) sits at neutral-${step} — a label on a fill should come from an end of the ramp`,
                ).toBe(true)
            }
        }
    })

    it("derives radius from one knob", () => {
        expect(resolved.radius.md).toBe(hendriPreset.radius.basePx)
        expect(resolved.radius.sm).toBeLessThan(resolved.radius.md)
        expect(resolved.radius.xl).toBeGreaterThan(resolved.radius.lg)
    })

    it("honours a manual per-step override", () => {
        const withOverride = structuredClone(hendriPreset)
        withOverride.color.scales[0]!.overrides = { light: { 500: "#ff0000" } }
        const swatch = resolveTokens(withOverride).scales.primary!.steps.light[500]!
        expect(swatch.hex).toBe("#ff0000")
        expect(swatch.overridden).toBe(true)
    })
})
