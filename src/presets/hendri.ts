/**
 * Hendri's own brand as the default system — the template every new brand forks.
 *
 * Colour seeds are the real production values from
 * ~/Framer/hendri-design/ids.json → colorTokens (hendri.design, live).
 */

import {
    DEFAULT_MOTION,
    DEFAULT_POLISH,
    DEFAULT_SHADOWS,
    DEFAULT_SPACING,
    DEFAULT_TYPE_ROLES,
} from "../engine/defaults"
import { anchorsFrom } from "../engine/resolve"
import { defaultSemanticMapping } from "../engine/semantics"
import type { BrandConfig, ScaleConfig } from "../engine/types"

const scales: ScaleConfig[] = [
    {
        role: "primary",
        name: "Signal",
        seed: "#574cff", // Brand Primary, live on hendri.design
    },
    {
        role: "secondary",
        name: "Slate",
        // PROVISIONAL: hendri.design has no declared secondary brand colour. This is
        // Foreground Secondary (#40525e), which is what its quiet buttons already use.
        seed: "#40525e",
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
        voice: ["considered", "warm", "precise", "unfussy"],
        deviations: [
            "The secondary scale is provisional — hendri.design has no declared secondary brand colour yet.",
            "Type families are placeholders pending confirmation against the live site.",
        ],
    },
    color: {
        scales,
        semantics: defaultSemanticMapping(anchorsFrom(scales)),
    },
    typography: {
        families: {
            sans: '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
            mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        },
        roles: DEFAULT_TYPE_ROLES,
    },
    spacing: DEFAULT_SPACING,
    radius: { basePx: 10, concentric: true },
    shadows: DEFAULT_SHADOWS,
    motion: DEFAULT_MOTION,
    rules: { polish: DEFAULT_POLISH },
}
