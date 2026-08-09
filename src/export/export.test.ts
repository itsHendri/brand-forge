import { describe, expect, it } from "vitest"
import { resolveTokens } from "../engine/resolve"
import { hendriPreset } from "../presets/hendri"
import { buildExport, exportAsMap, exportBudget, referencedAssets } from "./bundle"
import { previewCss } from "./css"
import { toSkillMd } from "./skillMd"

const resolved = resolveTokens(hendriPreset)
const files = buildExport(resolved)
const fileAt = (suffix: string) => files.find((f) => f.path.endsWith(suffix))!.content
const fileAt2 = (tokens: typeof resolved, suffix: string) =>
    buildExport(tokens).find((f) => f.path.endsWith(suffix))!.content

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

describe("assets", () => {
    const withFonts = structuredClone(hendriPreset)
    withFonts.typography.fontFiles = [
        { fileName: "Geist-Regular.woff2", family: "sans", weight: 400, style: "normal" },
        { fileName: "Geist-Italic.woff2", family: "sans", weight: 400, style: "italic" },
        { fileName: "GeistMono.woff2", family: "mono", weight: 400, style: "normal" },
    ]
    withFonts.meta.logoFile = "mark.png"
    const resolvedWithFonts = resolveTokens(withFonts)
    const css = fileAt2(resolvedWithFonts, "tokens.css")

    it("names the @font-face after the first family in the stack, not the stack", () => {
        // `font-family: "Geist", ui-sans-serif, …` only picks up a face called
        // exactly `Geist`; naming the rule after the whole stack loads nothing.
        expect(css).toContain('font-family: "Space Grotesk";')
        // The full stack still belongs in the --font-sans token; it just must
        // not leak into the @font-face rule.
        const faces = css.slice(0, css.indexOf(":root"))
        expect(faces).not.toContain("ui-sans-serif")
    })

    it("emits one rule per weight and style", () => {
        expect(css.match(/@font-face/g)).toHaveLength(3)
        expect(css).toContain("font-style: italic;")
        expect(css).toContain('format("woff2")')
        expect(css).toContain("font-display: swap;")
    })

    it("points at assets sitting beside the stylesheet", () => {
        expect(css).toContain('url("./assets/Geist-Regular.woff2")')
    })

    it("lists every referenced asset so the export can carry them", () => {
        expect(referencedAssets(resolvedWithFonts).sort()).toEqual([
            "Geist-Italic.woff2",
            "Geist-Regular.woff2",
            "GeistMono.woff2",
            "mark.png",
        ])
    })

    it("does not count an inline SVG logo as a file to copy", () => {
        const withSvg = structuredClone(hendriPreset)
        withSvg.meta.logoSvg = "<svg/>"
        withSvg.meta.logoFile = undefined
        withSvg.typography.fontFiles = []
        expect(referencedAssets(resolveTokens(withSvg))).toEqual([])
    })

    it("emits no @font-face block when a brand has no font files", () => {
        const bare = structuredClone(hendriPreset)
        bare.typography.fontFiles = []
        expect(fileAt2(resolveTokens(bare), "tokens.css")).not.toContain("@font-face")
    })

    it("ships the display face as a file, because it has no hosted source", () => {
        // Alpha Lyrae is Framer-served — there is no stylesheet to link, so it
        // travels as bytes or it doesn't render.
        expect(referencedAssets(resolved)).toContain("AlphaLyrae-Medium.woff2")
        expect(fileAt("tokens.css")).toContain('font-family: "Alpha Lyrae Medium";')
    })

    it("marks binary entries so the writer knows they are bytes", () => {
        const map = exportAsMap([
            { path: "assets/x.woff2", content: "AAAA", note: "", encoding: "base64" },
            { path: "tokens.css", content: ":root{}", note: "" },
        ])
        expect(Object.keys(map)).toEqual(["base64:assets/x.woff2", "tokens.css"])
    })
})

describe("assets in the docs", () => {
    const branded = structuredClone(hendriPreset)
    branded.meta.logoSvg = '<svg viewBox="0 0 10 10"><path fill="#574cff" d="M0 0h10v10H0z"/></svg>'
    branded.typography.fontFiles = [
        { fileName: "Geist-Regular.woff2", family: "sans", weight: 400, style: "normal" },
    ]
    const md = fileAt2(resolveTokens(branded), "DESIGN_SYSTEM.md")
    const skill = fileAt2(resolveTokens(branded), "SKILL.md")

    it("tells an agent the mark exists and how to colour it", () => {
        expect(md).toContain("### Logo")
        expect(md).toContain("currentColor")
        expect(skill).toContain("brand mark is inline SVG")
    })

    it("lists the font files and warns about moving them", () => {
        expect(md).toContain("`assets/Geist-Regular.woff2`")
        expect(md).toContain("first family in each stack")
        expect(skill).toContain("`assets/` sits beside it")
    })

    it("says something useful when a brand has no assets at all", () => {
        // The empty branch has to give an instruction, not go silent. The shipped
        // preset now has a mark, so this needs a brand stripped of one.
        const bare = structuredClone(hendriPreset)
        bare.meta.logoSvg = undefined
        bare.meta.logoFile = undefined
        bare.typography.fontLinks = []
        bare.typography.fontFiles = []
        const md = fileAt2(resolveTokens(bare), "DESIGN_SYSTEM.md")
        expect(md).toContain("**No mark is defined.**")
        expect(md).toContain("**No font files and no hosted links.**")
    })

    it("does not tell an agent to add a <link> when the fonts already ship", () => {
        expect(md).toContain("there is no separate `<link>` to add")
    })
})

describe("findings from acceptance run 4", () => {
    const md = fileAt("DESIGN_SYSTEM.md")
    const skill = fileAt("SKILL.md")
    const css = fileAt("tokens.css")

    it("emits letter-spacing for every role, so the four-property pattern is safe to copy", () => {
        // Four of nine roles used to skip it, so copying the documented pattern
        // gave `letter-spacing: var(--undefined)` — invalid, dropped in silence,
        // the exact failure the instruction exists to prevent.
        for (const role of hendriPreset.typography.roles) {
            expect(css, role.role).toContain(`--text-${role.role}--letter-spacing:`)
        }
    })

    it("says the focus ring is invisible on a brand fill and what to use instead", () => {
        // --ring IS --primary, so the mandated focus treatment was Lc 0 on
        // exactly the section the docs single out as dangerous.
        expect(md).toContain("outline: 2px solid var(--primary-foreground)")
        expect(md).toContain("The focus ring is part of this")
        expect(skill).toContain("except on a coloured fill")
    })

    it("does not claim tokens defined as invisible are validated", () => {
        const contrast = md.slice(md.indexOf("## Contrast"))
        expect(contrast).toContain("deliberately exempt")
        expect(contrast).toContain("--border-subtle")
    })

    it("defines what large text means, since two thresholds depend on it", () => {
        expect(md).toMatch(/\*\*"Large text" means/)
    })

    it("adjudicates the full-width button against the concentric rule", () => {
        expect(md).toContain("A full-width control is flush and does follow the formula")
        expect(skill).toContain("full-width field, banner or button follows the formula")
    })

    it("warns that --color-* only exists inside the theme block", () => {
        expect(css).toContain("resolves to nothing")
    })
})

describe("the on-brand rule", () => {
    const md = fileAt("DESIGN_SYSTEM.md")
    const skill = fileAt("SKILL.md")

    it("appears in the deviations, because it is a trap rather than a gap", () => {
        const deviations = md.slice(md.indexOf("🚨"), md.indexOf("## How the layers work"))
        expect(deviations).toContain("On a coloured fill, the neutral text tokens are wrong")
    })

    it("gives the composition rule for text AND border", () => {
        expect(md).toContain("for its text and its border both")
        expect(md).toContain("border: 1px solid var(--primary-foreground)")
    })

    it("marks the outline recipe as assuming a neutral ground", () => {
        expect(md).toContain("This recipe assumes a neutral ground")
    })

    it("forbids dimming a contrast-checked pair with opacity", () => {
        expect(md).toContain("do not fade the result with")
        expect(skill).toContain("Never soften the result with `opacity`")
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
