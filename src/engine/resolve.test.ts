import { describe, expect, it } from "vitest"
import { hendriPreset } from "../presets/hendri"
import { primitiveVar, resolveTokens, semanticByName } from "./resolve"
import { defaultSemanticMapping } from "./semantics"
import { SCALE_ROLES, STEPS } from "./types"

const resolved = resolveTokens(hendriPreset)

describe("resolveTokens", () => {
    it("resolves every scale and every semantic token", () => {
        for (const role of SCALE_ROLES) expect(resolved.scales[role]).toBeDefined()
        expect(resolved.semantics.length).toBe(defaultSemanticMapping(hendriPreset.color.scales).length)
    })

    it("reports no warnings at all for the shipped preset", () => {
        // Deliberately stricter than "no failures". Non-text boundaries report as
        // `warn`, so counting only failures let every status border sit at Lc 0 —
        // invisible — while the docs claimed the system was clean.
        expect(resolved.warnings).toEqual([])
    })

    it("gives every solid fill its own hover and pressed state", () => {
        // Without these, the docs tell you to build a destructive button and then
        // make its hover inexpressible: `--state-hover` is a neutral wash, and
        // computing one with filter/opacity is banned by name.
        for (const role of ["primary", "secondary", "success", "warning", "danger", "info"]) {
            expect(semanticByName(resolved, `${role}-hover`), `${role}-hover`).toBeDefined()
            expect(semanticByName(resolved, `${role}-active`), `${role}-active`).toBeDefined()
        }
    })

    it("keeps borders visible against the surfaces they divide", () => {
        for (const [fg, bg] of [
            ["border", "background"],
            ["input", "surface"],
            ["danger-border", "danger-subtle"],
        ]) {
            const border = semanticByName(resolved, fg!)!.values.light!
            const ground = semanticByName(resolved, bg!)!.values.light!
            expect(Math.abs(border.oklch.l - ground.oklch.l), `${fg} on ${bg}`).toBeGreaterThan(0.08)
        }
    })

    it("makes the typed brand colour the actual primary fill", () => {
        const primary = semanticByName(resolved, "primary")!
        expect(primary.values.light!.hex).toBe("#574cff")
    })

    it("keeps the exact secondary seed in the ramp even when it can't be the fill", () => {
        // #f1760f is a mid-lightness orange: the best label any neutral manages
        // on it is Lc 55, under the 60 bar. So `--secondary` steps darker to
        // something that can carry a label, while the ramp still holds the real
        // brand colour — which is what the wordmark points at.
        const scale = resolved.scales.secondary!
        expect(scale.steps.light[scale.anchorStep]!.hex).toBe("#f1760f")
        expect(semanticByName(resolved, "secondary")!.values.light!.hex).not.toBe("#f1760f")
    })

    it("still gives primary the verbatim promise", () => {
        const scale = resolved.scales.primary!
        expect(semanticByName(resolved, "primary")!.light.step).toBe(scale.anchorStep)
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

    describe("fluid type", () => {
        const declared = new Map(resolved.declarations.light)

        it("emits a clamp for fluid roles and a plain size for the rest", () => {
            expect(declared.get("--text-display")).toMatch(/^clamp\(/)
            expect(declared.get("--text-heading-lg")).toMatch(/^clamp\(/)
            // Body text must not move — reading size is the reader's business.
            expect(declared.get("--text-body")).toBe("1rem")
            expect(declared.get("--text-heading")).toBe("1.5rem")
        })

        it("lands exactly on its endpoints at the ends of the range", () => {
            const range = hendriPreset.typography.fluidRange ?? { minPx: 390, maxPx: 1280 }
            const role = hendriPreset.typography.roles.find((r) => r.role === "display")!
            const match = /clamp\(([\d.]+)rem, ([\d.]+)rem \+ ([\d.]+)vw, ([\d.]+)rem\)/.exec(
                declared.get("--text-display")!,
            )!
            const [min, intercept, slope, max] = match.slice(1).map(Number) as number[]
            const at = (vw: number) => intercept! + (slope! * vw) / 100 / 16
            expect(min).toBe(role.minSizeRem)
            expect(max).toBe(role.sizeRem)
            expect(at(range.minPx)).toBeCloseTo(role.minSizeRem!, 2)
            expect(at(range.maxPx)).toBeCloseTo(role.sizeRem, 2)
        })

        it("keeps a rem term, so the size still responds to zoom", () => {
            // A pure-vw clamp ignores the reader's font-size preference.
            expect(declared.get("--text-display")).toMatch(/[\d.]+rem \+ [\d.]+vw/)
        })
    })

    it("gives the display role its own family slot, whatever that slot points at", () => {
        // The slot is the point, not its current value: it lets a display face be
        // swapped in without touching any role. Today it borrows the sans,
        // because the real display face is licensed and deliberately not bundled.
        const display = hendriPreset.typography.roles.find((r) => r.role === "display")!
        expect(display.family).toBe("display")
        expect(new Map(resolved.declarations.light).get("--font-display")).toBeTruthy()
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
