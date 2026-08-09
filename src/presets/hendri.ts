/**
 * Hendri's own brand as the default system — the template every new brand forks.
 *
 * Colour seeds are the real production values from
 * ~/Framer/hendri-design/ids.json → colorTokens (hendri.design, live).
 */

import {
    DEFAULT_BREAKPOINTS,
    DEFAULT_CONTAINERS,
    DEFAULT_MOTION,
    DEFAULT_POLISH,
    DEFAULT_SHADOWS,
    DEFAULT_SPACING,
    DEFAULT_TYPE_ROLES,
} from "../engine/defaults"
import { defaultSemanticMapping } from "../engine/semantics"
import type { BrandConfig, ScaleConfig } from "../engine/types"
import { HENDRI_WORDMARK } from "./hendriWordmark"

const scales: ScaleConfig[] = [
    {
        role: "primary",
        name: "Signal",
        seed: "#574cff", // Brand Primary, live on hendri.design
    },
    {
        role: "secondary",
        name: "Ember",
        // The real Brand Secondary from hendri.design, read off the live site's
        // token layer. It is the orange in the wordmark's flourish — so the
        // system and the mark now reference the same colour rather than agreeing
        // by coincidence.
        seed: "#f1760f",
    },
    {
        role: "neutral",
        name: "Ink",
        seed: "#1f262d", // Foreground Primary / dark Background Primary
        tuning: {
            // Keep the slate tint without letting the neutrals read as blue.
            light: { maxChroma: 0.03, hueShift: 1 },
            dark: { maxChroma: 0.035, hueShift: 1 },
        },
    },
    { role: "success", name: "Grow", seed: "#16a34a" },
    { role: "warning", name: "Flag", seed: "#d97706" },
    { role: "danger", name: "Stop", seed: "#dc2626" },
    { role: "info", name: "Note", seed: "#0284c7" },
]

export const hendriPreset: BrandConfig = {
    $schemaVersion: 1,
    meta: {
        id: "hendri",
        name: "Hendri",
        slug: "hendri",
        domain: "hendri.design",
        logoSvg: HENDRI_WORDMARK,
        voice: ["considered", "warm", "precise", "unfussy"],
        deviations: [
            "`--text-display` and `--text-heading-lg` are fluid — they scale with the viewport between 390px and 1280px rather than holding one size. Never override them with a fixed rem value.",
            "Alpha Lyrae ships one weight (500). Do not ask for bold display type: there isn't any, and the browser will synthesise a fake bold that looks wrong.",
            "hendri.design also uses Inter for its machine-view panel. This system has no slot for a fourth family, so it is not represented here.",
            "No mono face is declared on the live site; `--font-mono` is a neutral system stack until one is chosen.",
        ],
    },
    color: {
        scales,
        semantics: defaultSemanticMapping(scales),
    },
    typography: {
        families: {
            // Space Grotesk does nearly all the work on hendri.design — headings
            // and body both — so it is the sans, not a display face.
            sans: '"Space Grotesk", ui-sans-serif, system-ui, -apple-system, sans-serif',
            // Alpha Lyrae is the display face. It only ships at weight 500, so
            // the display role sits there rather than at the 600 the other
            // headings use.
            display: '"Alpha Lyrae Medium", "Space Grotesk", ui-sans-serif, system-ui, sans-serif',
            // Undeclared on the live site; a neutral stack until Hendri picks one.
            mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
        },
        fontLinks: [
            "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap",
        ],
        // Alpha Lyrae has no hosted stylesheet — it is a Framer-served face — so
        // it travels as a file or it does not render at all.
        fontFiles: [
            { fileName: "AlphaLyrae-Medium.woff2", family: "display", weight: 500, style: "normal" },
        ],
        // Tracking and weights measured off the live site rather than guessed:
        // Space Grotesk runs negative at every size, and its headings sit at 500.
        roles: DEFAULT_TYPE_ROLES.map((role) => {
            // Alpha Lyrae ships one weight, and its own tracking — leave it alone.
            if (role.role === "display") return { ...role, weight: 500, tracking: "-0.02em" }
            if (role.family !== "sans") return role
            if (role.role.startsWith("heading")) {
                return { ...role, weight: 500, tracking: role.role === "heading-sm" ? "-0.02em" : "-0.04em" }
            }
            if (role.role.startsWith("body")) return { ...role, tracking: "-0.02em" }
            return role
        }),
    },
    layout: { breakpoints: DEFAULT_BREAKPOINTS, containers: DEFAULT_CONTAINERS },
    spacing: DEFAULT_SPACING,
    radius: { basePx: 10, concentric: true },
    shadows: DEFAULT_SHADOWS,
    motion: DEFAULT_MOTION,
    rules: { polish: DEFAULT_POLISH },
}
