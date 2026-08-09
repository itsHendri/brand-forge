import { describe, expect, it } from "vitest"
import { resolveTokens } from "../engine/resolve"
import { hendriPreset } from "../presets/hendri"
import { buildExport, exportBudget } from "./bundle"
import { previewCss } from "./css"
import { toSkillMd } from "./skillMd"

const resolved = resolveTokens(hendriPreset)
const files = buildExport(resolved)
const fileAt = (suffix: string) => files.find((f) => f.path.endsWith(suffix))!.content

describe("the export bundle", () => {
    it("writes the skill folder, the stylesheet, the tokens and the source", () => {
        expect(files.map((f) => f.path)).toEqual([
            "skill/SKILL.md",
            "skill/references/DESIGN_SYSTEM.md",
            "tokens.css",
            "tokens.json",
            "brand.json",
        ])
    })

    it("keeps the agent-facing docs inside a single-load budget", () => {
        const budget = exportBudget(files)
        expect(budget.overBudget).toBe(false)
        expect(budget.tokens).toBeGreaterThan(1000) // it should actually say something
    })
})

describe("tokens.css", () => {
    const css = fileAt("tokens.css")

    it("emits both modes and never leaks a raw colour into a semantic", () => {
        expect(css).toContain(":root,")
        expect(css).toContain('[data-theme="dark"] {')
        expect(css).toMatch(/--primary: var\(--primary-\d+\);/)
    })

    it("defines light explicitly, so getting back from dark isn't luck", () => {
        // A toggle that writes data-theme="light" used to work only by falling
        // through to :root. Accidents stop working.
        expect(css).toContain('[data-theme="light"] {')
    })

    it("does not ship a media query while the docs promise an attribute", () => {
        // Both together means a dark-preference OS renders dark with no attribute
        // set, and a toggle that only removes the attribute can never reach light.
        expect(css).not.toContain("prefers-color-scheme")
    })

    it("forwards tokens into a Tailwind v4 theme block", () => {
        expect(css).toContain("@theme inline {")
        expect(css).toContain("--color-background: var(--background);")
        expect(css).toContain("--radius-md:")
        // Tailwind's own namespaces, so `md:` variants and `max-w-page` work
        // without a config file.
        expect(css).toContain("--container-prose: var(--container-prose);")
    })

    it("gives Tailwind literal breakpoints, because var() dies in a media query", () => {
        // `@theme inline { --breakpoint-lg: var(--breakpoint-lg) }` compiles to
        // `@media (width >= var(--breakpoint-lg))`, which is invalid CSS — every
        // `lg:` utility silently stops applying. Verified against a real build.
        const theme = css.slice(css.indexOf("@theme inline"))
        expect(theme).toContain("--breakpoint-lg: 1024px;")
        expect(theme).not.toMatch(/--breakpoint-\w+: var\(/)
    })

    it("emits layout tokens once, in the mode-invariant block", () => {
        const light = resolved.declarations.light.map(([name]) => name)
        const dark = resolved.declarations.dark.map(([name]) => name)
        expect(light).toContain("--breakpoint-lg")
        expect(light).toContain("--container-page")
        expect(dark).not.toContain("--breakpoint-lg")
        expect(dark).not.toContain("--container-page")
    })

    it("shares its serialization with the live preview — no second code path", () => {
        // Every declaration the preview injects must appear in the export verbatim.
        const preview = previewCss(resolved)
        for (const [name, value] of resolved.declarations.light) {
            expect(preview).toContain(`${name}: ${value};`)
            expect(css).toContain(`${name}: ${value};`)
        }
    })

    it("scopes the preview so brand colour cannot leak into the app chrome", () => {
        expect(previewCss(resolved)).toContain("#preview-root {")
        expect(previewCss(resolved)).not.toContain(":root {")
    })
})

describe("DESIGN_SYSTEM.md", () => {
    const md = fileAt("DESIGN_SYSTEM.md")

    it("leads with the deviations, before any token table", () => {
        expect(md.indexOf("🚨")).toBeLessThan(md.indexOf("| Token |"))
    })

    it("names the shadcn tokens this system does NOT have", () => {
        expect(md).toContain("`card` → `surface`")
        expect(md).toContain("`destructive` → `danger`")
    })

    it("documents every semantic token with a real hex in both modes", () => {
        for (const token of resolved.semantics) {
            expect(md).toContain(`\`--${token.name}\``)
            expect(md).toContain(token.values.light!.hex)
        }
    })

    it("gives exact component recipes rather than principles", () => {
        expect(md).toContain("background: var(--primary)")
        expect(md).toContain(`\`--radius-lg\` (${resolved.radius.lg}px)`)
    })

    describe("layout", () => {
        it("states the breakpoints as a closed, mobile-first set", () => {
            for (const breakpoint of hendriPreset.layout.breakpoints) {
                expect(md).toContain(`\`--breakpoint-${breakpoint.name}\``)
                expect(md).toContain(`${breakpoint.minPx}px`)
                expect(md).toContain(breakpoint.note)
            }
            expect(md).toContain("mobile-first")
            expect(md).toContain("no `max-width` breakpoints")
        })

        it("warns that var() does not resolve inside a media query", () => {
            // The trap: the rule is dropped silently, so nothing looks broken
            // until someone checks the layout at that width.
            expect(md).toContain("@media (min-width: var(--breakpoint-sm))")
            expect(md).toMatch(/silently ignored|does not work inside a media query/)
        })

        it("documents every container with the job it does", () => {
            for (const container of hendriPreset.layout.containers) {
                expect(md).toContain(`\`--container-${container.name}\``)
                expect(md).toContain(container.note)
            }
            expect(md).toContain("--container-prose")
        })

        it("no longer lists layout among the things the system doesn't define", () => {
            const section = md.slice(md.indexOf("## What this system does not define"))
            expect(section).not.toMatch(/\*\*Breakpoints\.\*\*/)
            expect(section).not.toMatch(/\*\*Container widths/)
        })
    })

    describe("claims the docs make about themselves", () => {
        it("does not claim every pair clears the body threshold", () => {
            // It doesn't: `-foreground` labels and `foreground-secondary` are held
            // to the Lc 60 bar and land in the 65-75 range. Saying "all of them
            // clear" next to "body targets Lc 75" reads as a stronger promise
            // than the validator actually makes.
            expect(md).not.toContain("were generated against those thresholds and all of them clear")
            expect(md).toContain("its own")
        })

        it("scopes the concentric rule so it doesn't forbid the radius scale", () => {
            // A card is --radius-lg with --space-6 padding, so `outer - padding`
            // is 0 for every child. Unscoped, the rule bans small radii outright.
            expect(md).toContain("flush against the parent's inner edge")
            expect(md).not.toContain("Only applies while padding ≤ 24px")
        })

        it("agrees with SKILL.md about badges", () => {
            const skillText = fileAt("SKILL.md")
            expect(md).toContain("**Badge** — subtle by default")
            expect(skillText).not.toContain("for fills and badges")
        })
    })

    it("shows wrong alongside right", () => {
        expect(md).toContain("❌")
        expect(md).toContain("✅")
    })

    it("never tells anyone to put a bare length in the `font` shorthand", () => {
        // `font: var(--text-label)` is invalid CSS and is dropped SILENTLY —
        // a copied recipe would produce an unstyled element and no error.
        // The doc is allowed to quote the pattern while warning against it.
        const offending = md
            .split("\n")
            .filter((line) => /font:\s*var\(--text-/.test(line) && !line.includes("invalid"))
        expect(offending).toEqual([])
        expect(md).toContain("--text-label--line-height")
    })

    it("names the companion type properties, not just their values", () => {
        for (const role of resolved.config.typography.roles) {
            expect(md).toContain(`--text-${role.role}--line-height`)
            expect(md).toContain(`--text-${role.role}--font-weight`)
        }
    })

    it("surfaces tokens that currently share a value instead of hiding them", () => {
        expect(md).toContain("## Tokens that currently share a value")
    })

    it("says what the system deliberately does not define", () => {
        expect(md).toContain("Breakpoints")
        expect(md).toContain("no tokens")
    })
})

describe("SKILL.md", () => {
    const skill = fileAt("SKILL.md")

    it("carries frontmatter an agent can match on", () => {
        expect(skill.startsWith("---\n")).toBe(true)
        expect(skill).toContain("name: hendri-brand")
        expect(skill).toContain("description:")
    })

    it("carries the layout rules, including the media-query trap", () => {
        expect(skill).toContain("Breakpoints are mobile-first and closed")
        expect(skill).toContain("640px (`sm`)")
        expect(skill).toContain("No content spans the viewport")
        expect(skill).toContain("--container-prose")
    })

    it("numbers its hard rules without repeating or skipping", () => {
        const numbers = [...skill.matchAll(/^(\d+)\. \*\*/gm)].map((match) => Number(match[1]))
        const hardRules = numbers.slice(0, numbers.indexOf(1, 1) === -1 ? numbers.length : numbers.indexOf(1, 1))
        expect(hardRules).toEqual(hardRules.map((_, i) => i + 1))
    })

    it("points at its own reference file", () => {
        expect(skill).toContain("references/DESIGN_SYSTEM.md")
    })

    it("ships only the craft rules that are switched on", () => {
        // The Rules panel is not decoration: toggling a rule off has to remove it
        // from the skill, or the panel is lying about what the agent will be told.
        expect(skill).toContain("Concentric radius")

        const withoutConcentric = structuredClone(hendriPreset)
        withoutConcentric.rules.polish["concentric-radius"] = false
        const trimmed = toSkillMd(resolveTokens(withoutConcentric))
        expect(trimmed).not.toContain("**Concentric radius.**")
        expect(trimmed).toContain("Tabular numbers") // the others survive
    })

    it("states the rules that stop a model reaching past the semantic layer", () => {
        expect(skill).toContain("Never write a colour literal")
        expect(skill).toContain("Never reference a primitive")
        expect(skill).toContain("Never write a dark-mode colour override")
    })
})

describe("tokens.json (DTCG)", () => {
    const json = JSON.parse(fileAt("tokens.json"))

    it("aliases semantics at primitives rather than duplicating values", () => {
        expect(json.color.light.semantic.background.$value).toMatch(
            /^\{color\.light\.primitive\.\w+\.\d+\}$/,
        )
    })

    it("stores colour in oklch with an sRGB fallback", () => {
        const swatch = json.color.light.primitive.primary["700"].$value
        expect(swatch.colorSpace).toBe("oklch")
        expect(swatch.components).toHaveLength(3)
        expect(swatch.hex).toMatch(/^#[0-9a-f]{6}$/)
    })

    it("records provenance so a re-import stays possible", () => {
        expect(json.$extensions["design.hendri.brandforge"].seeds.primary).toBe("#574cff")
    })

    it("resolves every alias it declares", () => {
        for (const mode of ["light", "dark"] as const) {
            for (const token of Object.values(json.color[mode].semantic)) {
                const value = (token as { $value?: string }).$value
                if (typeof value !== "string") continue
                const path = value.slice(1, -1).split(".")
                let node = json
                for (const key of path) node = node[key]
                expect(node, value).toBeDefined()
            }
        }
    })
})
