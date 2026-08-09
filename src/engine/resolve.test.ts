import { describe, expect, it } from "vitest"
import { hendriPreset } from "../presets/hendri"
import { apca, composite, LC_THRESHOLD } from "./contrast"
import { DEFAULT_POLISH } from "./defaults"
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
            const darkShadow = resolved.declarations.dark.find(([name]) => name === "--shadow-raised")
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

        // Dark shows elevation by climbing the ramp, so all four must differ.
        expect(
            new Set(
                ["background", "surface", "surface-raised", "surface-overlay"].map((n) => value(n, "dark")),
            ).size,
        ).toBe(4)
        expect(value("background", "light")).not.toBe(value("surface", "light"))
        expect(value("surface-sunken", "light")).not.toBe(value("background", "light"))
    })

    describe("the elevation ladder", () => {
        const value = (name: string, mode: "light" | "dark") => semanticByName(resolved, name)!.values[mode]!

        it("climbs in the right direction in each mode", () => {
            const ladder = ["surface-sunken", "background", "surface", "surface-raised", "surface-overlay"]
            const light = ladder.map((n) => value(n, "light").oklch.l)
            const dark = ladder.map((n) => value(n, "dark").oklch.l)
            // Never goes backwards: light climbs toward white, dark toward light.
            for (let i = 1; i < ladder.length; i++) {
                expect(light[i]!, `light ${ladder[i]} vs ${ladder[i - 1]}`).toBeGreaterThanOrEqual(light[i - 1]!)
                expect(dark[i]!, `dark ${ladder[i]} vs ${ladder[i - 1]}`).toBeGreaterThanOrEqual(dark[i - 1]!)
            }
        })

        it("collapses at opposite ends in the two modes, which is the palette's doing", () => {
            // Light runs out of room at the top — there is nothing whiter than
            // white — so raised and overlay share `surface`'s fill and the
            // shadows carry the elevation. Dark runs out at the bottom, so
            // sunken shares `background`. Both are documented, not accidents.
            expect(value("surface-raised", "light").hex).toBe(value("surface", "light").hex)
            expect(value("surface-overlay", "light").hex).toBe(value("surface", "light").hex)
            expect(value("surface-sunken", "dark").hex).toBe(value("background", "dark").hex)
            // …and each collapse happens in one mode only.
            expect(value("surface-raised", "dark").hex).not.toBe(value("surface", "dark").hex)
            expect(value("surface-sunken", "light").hex).not.toBe(value("background", "light").hex)
        })

        it("keeps body text readable on every level, including the top of dark", () => {
            // Dark `surface-overlay` is `neutral-700` at Lc 79 — four points off
            // the bar, and the reason there is no fifth level: `neutral-600`
            // measures 68 and fails outright.
            for (const mode of ["light", "dark"] as const) {
                for (const n of ["surface-sunken", "background", "surface", "surface-raised", "surface-overlay"]) {
                    const lc = Math.abs(apca(value("foreground", mode).hex, value(n, mode).hex))
                    expect(lc, `foreground on ${n} (${mode})`).toBeGreaterThanOrEqual(LC_THRESHOLD.body)
                }
            }
        })

        it("pairs every elevation shadow with a surface of the same name", () => {
            const shadows = resolved.declarations.light
                .filter(([name]) => name.startsWith("--shadow-"))
                .map(([name]) => name.replace("--shadow-", ""))
            expect(shadows).toContain("raised")
            expect(shadows).toContain("overlay")
            for (const level of shadows) {
                if (level === "sm") continue // deliberately not an elevation level
                expect(semanticByName(resolved, `surface-${level}`), `--surface-${level}`).toBeDefined()
            }
        })

        it("overrides every shadow in dark mode, leaving none as a light drop shadow", () => {
            const darkNames = resolved.declarations.dark
                .filter(([name]) => name.startsWith("--shadow-"))
                .map(([name]) => name)
            const lightNames = resolved.declarations.light
                .filter(([name]) => name.startsWith("--shadow-"))
                .map(([name]) => name)
            // A renamed level once silently lost its dark override, because
            // DARK_SHADOWS is keyed by name and no longer had an entry.
            expect(darkNames.sort()).toEqual(lightNames.sort())
        })

        it("makes --muted a wash, since the dark ladder uses every step it has", () => {
            for (const mode of ["light", "dark"] as const) {
                expect(semanticByName(resolved, "muted")![mode].alpha, mode).toBeGreaterThan(0)
            }
        })
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

/**
 * The batch added from the Carbon and Atlassian reference. Each of these
 * existed as a documented gap that every acceptance run had to invent around.
 */
describe("the inverse, link, focus, scrim and skeleton tokens", () => {
    const value = (name: string, mode: "light" | "dark") => semanticByName(resolved, name)!.values[mode]!

    it("gives links enough contrast to be read as body text, in both modes", () => {
        // The trap this token exists to remove: `--primary` as a link measures
        // Lc -28.7 in dark. Anything claiming to be body text clears Lc 75.
        for (const mode of ["light", "dark"] as const) {
            for (const ground of ["surface-sunken", "background", "surface"]) {
                const lc = Math.abs(apca(value("link", mode).hex, value(ground, mode).hex))
                expect(lc, `link on ${ground} (${mode})`).toBeGreaterThanOrEqual(LC_THRESHOLD.body)
            }
        }
    })

    it("does not let a link rely on colour alone", () => {
        // `--link` sits at the same lightness as `--foreground` on this palette
        // and is told apart by hue only, which is invisible in greyscale. The
        // system compensates with a rule, so the rule has to actually be there.
        expect(DEFAULT_POLISH["underline-links"]).toBe(true)
    })

    it("inverts against the mode rather than always going dark", () => {
        // A dark chip on a dark page is not an inverse region. Light mode's
        // inverse must be darker than its page and dark mode's must be lighter.
        expect(value("inverse", "light").oklch.l).toBeLessThan(value("background", "light").oklch.l)
        expect(value("inverse", "dark").oklch.l).toBeGreaterThan(value("background", "dark").oklch.l)
    })

    it("keeps everything placed on an inverse region readable there", () => {
        for (const mode of ["light", "dark"] as const) {
            const ground = value("inverse", mode).hex
            expect(Math.abs(apca(value("inverse-foreground", mode).hex, ground))).toBeGreaterThanOrEqual(
                LC_THRESHOLD.body,
            )
            expect(Math.abs(apca(value("link-inverse", mode).hex, ground))).toBeGreaterThanOrEqual(
                LC_THRESHOLD.body,
            )
        }
    })

    it("gives focus a ring that survives a brand fill", () => {
        // Acceptance run 4: focus was invisible on a brand field because
        // `--ring` IS `--primary`. That must stay fixed.
        for (const mode of ["light", "dark"] as const) {
            const onBrand = Math.abs(apca(value("ring", mode).hex, value("primary", mode).hex))
            const inverseOnBrand = Math.abs(apca(value("ring-inverse", mode).hex, value("primary", mode).hex))
            expect(inverseOnBrand, `ring-inverse on primary (${mode})`).toBeGreaterThanOrEqual(
                LC_THRESHOLD["non-text"],
            )
            // The whole reason the second token exists.
            expect(inverseOnBrand, `${mode}: ring-inverse must beat ring on a brand fill`).toBeGreaterThan(
                onBrand,
            )
        }
    })

    it("pairs the inset ring with the ring itself, not with the page", () => {
        for (const mode of ["light", "dark"] as const) {
            const lc = Math.abs(apca(value("ring-inset", mode).hex, value("ring", mode).hex))
            expect(lc, `ring-inset on ring (${mode})`).toBeGreaterThanOrEqual(LC_THRESHOLD["non-text"])
        }
    })

    it("emits the scrim as a translucent literal, not an opaque alias", () => {
        // A `var(--neutral-950)` holds `oklch(L C H)` and has no alpha to bend,
        // so this is the one token that cannot alias its primitive.
        for (const mode of ["light", "dark"] as const) {
            const declaration = resolved.declarations[mode].find(([name]) => name === "--scrim")
            expect(declaration, `--scrim missing in ${mode}`).toBeDefined()
            expect(declaration![1]).toMatch(/^oklch\([^)]+ \/ 0\.\d+\)$/)
        }
    })

    it("carries more scrim in dark mode, where a dim one reads as nothing", () => {
        const alphaOf = (mode: "light" | "dark") =>
            Number(/\/ ([\d.]+)\)/.exec(resolved.declarations[mode].find(([n]) => n === "--scrim")![1])![1])
        expect(alphaOf("dark")).toBeGreaterThan(alphaOf("light"))
    })

    it("keeps skeleton blocks visible against their own container", () => {
        // Measured against `skeleton-surface`, not the page — the blocks only
        // ever appear inside it, and picking against the page is how they end
        // up invisible in the one place they are used.
        for (const mode of ["light", "dark"] as const) {
            const lc = Math.abs(apca(value("skeleton", mode).hex, value("skeleton-surface", mode).hex))
            expect(lc, `skeleton on skeleton-surface (${mode})`).toBeGreaterThanOrEqual(
                LC_THRESHOLD["non-text"],
            )
        }
    })

    it("ships exactly two opacities, and neither is for live text", () => {
        const names = resolved.declarations.light.filter(([n]) => n.startsWith("--opacity")).map(([n]) => n)
        expect(names).toEqual(["--opacity-disabled", "--opacity-loading"])
    })
})

/**
 * Step 2 of the Carbon/Atlassian pass. The old `--state-*` tokens were opaque
 * aliases calibrated for one surface each, which made `--state-hover` literally
 * the same colour as `--muted` — a hover that did nothing.
 */
describe("the state washes", () => {
    const WASHES = ["state-hover", "state-active", "state-selected", "state-disabled"] as const
    // The opaque ladder. `muted` is a wash itself now and cannot be a ground.
    const GROUNDS = ["surface-sunken", "background", "surface", "surface-raised", "surface-overlay"] as const
    const value = (name: string, mode: "light" | "dark") => semanticByName(resolved, name)!.values[mode]!

    it("is translucent, every one of them", () => {
        for (const name of WASHES) {
            for (const mode of ["light", "dark"] as const) {
                const token = semanticByName(resolved, name)!
                expect(token[mode].alpha, `${name} (${mode})`).toBeGreaterThan(0)
                expect(token[mode].alpha, `${name} (${mode})`).toBeLessThan(1)
            }
        }
    })

    it("is visible on every surface it is allowed on — the bug this replaced", () => {
        // The old `--state-hover` was `neutral-200`, and so was `--muted`, so a
        // hovered row on a muted surface was indistinguishable from an unhovered
        // one. Each wash must now shift every ground perceptibly.
        for (const name of WASHES) {
            const token = semanticByName(resolved, name)!
            for (const mode of ["light", "dark"] as const) {
                for (const ground of GROUNDS) {
                    const groundHex = value(ground, mode).hex
                    const washed = composite(value(name, mode).hex, token[mode].alpha!, groundHex)
                    expect(washed, `${name} on ${ground} (${mode}) does not change the surface`).not.toBe(
                        groundHex,
                    )
                    // Perceptible, not merely different: a one-bit change passes
                    // an inequality check and is invisible to a person.
                    const shift = Math.abs(
                        parseInt(washed.slice(1, 3), 16) - parseInt(groundHex.slice(1, 3), 16),
                    )
                    expect(shift, `${name} on ${ground} (${mode}) shifts by only ${shift}/255`).toBeGreaterThan(4)
                }
            }
        }
    })

    it("moves away from the surface whichever direction that is", () => {
        // One mid-grey darkens every light surface and lightens every dark one.
        // That is the whole reason a single token can serve all four grounds.
        for (const mode of ["light", "dark"] as const) {
            for (const ground of GROUNDS) {
                const token = semanticByName(resolved, "state-hover")!
                const groundHex = value(ground, mode).hex
                const washed = composite(value("state-hover", mode).hex, token[mode].alpha!, groundHex)
                const lift = parseInt(washed.slice(1, 3), 16) - parseInt(groundHex.slice(1, 3), 16)
                if (mode === "light") expect(lift, `${ground} should darken`).toBeLessThan(0)
                else expect(lift, `${ground} should lighten`).toBeGreaterThan(0)
            }
        }
    })

    it("gets stronger from hover to disabled to active, never weaker", () => {
        for (const mode of ["light", "dark"] as const) {
            const alpha = (name: string) => semanticByName(resolved, name)![mode].alpha!
            expect(alpha("state-hover")).toBeLessThan(alpha("state-disabled"))
            expect(alpha("state-disabled")).toBeLessThan(alpha("state-active"))
        }
    })

    it("is squeezed from both sides in dark mode, and the solver feels it", () => {
        // Dark `surface-raised` is simultaneously the ground with the least
        // contrast headroom (a lightening wash pushes it toward the near-white
        // foreground) and the ground nearest the wash on the ramp, so the wash
        // shifts it least. Dark therefore tolerates *less* wash at the top and
        // needs *more* at the bottom — the two ends move in opposite directions,
        // which is not something you would guess by picking alphas by hand.
        const alpha = (name: string, mode: "light" | "dark") => semanticByName(resolved, name)![mode].alpha!

        expect(alpha("state-active", "dark")).toBeLessThan(alpha("state-active", "light"))
        expect(alpha("state-hover", "dark")).toBeGreaterThan(alpha("state-hover", "light"))
        // And the two still have not crossed, in either mode.
        for (const mode of ["light", "dark"] as const) {
            expect(alpha("state-hover", mode)).toBeLessThan(alpha("state-active", mode))
        }
    })

    it("keeps body text readable on every washed surface", () => {
        for (const name of ["state-hover", "state-active", "state-selected"] as const) {
            const token = semanticByName(resolved, name)!
            for (const mode of ["light", "dark"] as const) {
                for (const ground of GROUNDS) {
                    const washed = composite(
                        value(name, mode).hex,
                        token[mode].alpha!,
                        value(ground, mode).hex,
                    )
                    const lc = Math.abs(apca(value("foreground", mode).hex, washed))
                    expect(lc, `foreground on ${name} over ${ground} (${mode})`).toBeGreaterThanOrEqual(
                        LC_THRESHOLD.body,
                    )
                }
            }
        }
    })
})

/**
 * Step 4. Every acceptance run has invented a z-index and a sidebar width,
 * differently each time, because `--container-*` bounds the page and nothing
 * bounded what sits around it.
 */
describe("stacking order and the app frame", () => {
    const decl = (name: string) => resolved.declarations.light.find(([n]) => n === name)?.[1]
    const z = (name: string) => Number(decl(`--z-${name}`))

    it("emits a z token for every layer and a shell token for every dimension", () => {
        for (const layer of hendriPreset.layout.zLayers) expect(decl(`--z-${layer.name}`)).toBeDefined()
        for (const dim of hendriPreset.layout.shell) expect(decl(`--shell-${dim.name}`)).toBeDefined()
    })

    it("keeps the stacking order strictly ascending, so the names are the order", () => {
        const values = hendriPreset.layout.zLayers.map((layer) => layer.value)
        expect([...values].sort((a, b) => a - b)).toEqual(values)
        expect(new Set(values).size).toBe(values.length)
    })

    it("puts a modal immediately above its own scrim, not a whole step above", () => {
        // The pairing people get wrong. A hundred apart invites something to be
        // placed between a dialog and its backdrop, which is never correct.
        expect(z("modal")).toBeGreaterThan(z("scrim"))
        expect(z("modal") - z("scrim")).toBeLessThan(50)
    })

    it("puts a toast above a modal, and a tooltip above everything", () => {
        // A save confirmation behind the dialog that triggered it is invisible
        // exactly when it matters.
        expect(z("toast")).toBeGreaterThan(z("modal"))
        expect(z("tooltip")).toBe(Math.max(...hendriPreset.layout.zLayers.map((l) => l.value)))
    })

    it("keeps nav below anything that opens out of it", () => {
        expect(z("nav")).toBeGreaterThan(z("sticky"))
        expect(z("dropdown")).toBeGreaterThan(z("nav"))
    })

    it("matches the collapsed rail to the header, so the logo cell is square", () => {
        const rem = (name: string) =>
            hendriPreset.layout.shell.find((dimension) => dimension.name === name)!.rem
        expect(rem("sidebar-collapsed")).toBe(rem("header"))
        expect(rem("sidebar")).toBeGreaterThan(rem("sidebar-collapsed"))
    })

    it("keeps the frame out of the dark block — none of it changes with theme", () => {
        const darkNames = resolved.declarations.dark.map(([n]) => n)
        expect(darkNames.some((n) => n.startsWith("--z-"))).toBe(false)
        expect(darkNames.some((n) => n.startsWith("--shell-"))).toBe(false)
    })
})
