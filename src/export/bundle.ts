/**
 * One bundle definition, two transports: the dev-server middleware writes it to
 * disk, and the download path zips the same map. Adding an artifact here makes
 * it appear in both.
 */

import type { ResolvedTokens } from "../engine/types"
import { toTokensCss } from "./css"
import { estimateTokens, toDesignSystemMd } from "./designSystemMd"
import { toDtcgJson } from "./dtcg"
import { toSkillMd } from "./skillMd"

export interface ExportFile {
    path: string
    content: string
    /** What this file is for, shown in the export dialog. */
    note: string
    /** Binary assets travel as base64 and are decoded by the writer. */
    encoding?: "base64"
}

/**
 * Every asset the config references. Fonts and a raster logo are real files; an
 * SVG logo is already inline in `brand.json` and needs no copy.
 */
export function referencedAssets(resolved: ResolvedTokens): string[] {
    const { config } = resolved
    const names = (config.typography.fontFiles ?? []).map((file) => file.fileName)
    if (config.meta.logoFile) names.push(config.meta.logoFile)
    return [...new Set(names)]
}

export function buildExport(resolved: ResolvedTokens): ExportFile[] {
    const designSystem = toDesignSystemMd(resolved)
    return [
        {
            path: "skill/SKILL.md",
            content: toSkillMd(resolved),
            note: "Drop the skill/ folder into ~/.claude/skills/ (or symlink it).",
        },
        {
            path: "skill/references/DESIGN_SYSTEM.md",
            content: designSystem,
            note: "The reference the skill points at.",
        },
        {
            path: "tokens.css",
            content: toTokensCss(resolved),
            note: "Import once. Includes a Tailwind v4 @theme block.",
        },
        {
            path: "tokens.json",
            content: toDtcgJson(resolved),
            note: "W3C DTCG format, for Figma / Tokens Studio / Style Dictionary.",
        },
        {
            path: "brand.json",
            content: JSON.stringify(resolved.config, null, 4) + "\n",
            note: "The source of truth — re-import to keep editing.",
        },
    ]
}

export const exportAsMap = (files: ExportFile[]): Record<string, string> =>
    Object.fromEntries(
        files.map((file) => [
            // The writer needs to know which entries are bytes, not text.
            file.encoding === "base64" ? `base64:${file.path}` : file.path,
            file.content,
        ]),
    )

/** Budget meter: the reference file has to stay comfortably loadable in one go. */
export function exportBudget(files: ExportFile[]): { tokens: number; overBudget: boolean } {
    const reference = files.find((file) => file.path.endsWith("DESIGN_SYSTEM.md"))
    const skill = files.find((file) => file.path.endsWith("SKILL.md"))
    const tokens = estimateTokens((reference?.content ?? "") + (skill?.content ?? ""))
    return { tokens, overBudget: tokens > 18_000 }
}
