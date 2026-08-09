import { assetUrl } from "../persistence"
import type { BrandConfig } from "../../engine/types"

/**
 * The brand mark on the canvas.
 *
 * An inline SVG has its explicit fills stripped so it inherits `currentColor` —
 * that is the whole reason SVG logos are stored inline rather than as files, and
 * it is what lets one mark work in both modes. A raster logo can't be recoloured,
 * so it renders as-is and it is the brand's problem if it disappears in dark.
 */
export function Logo({ config, height = 24 }: { config: BrandConfig; height?: number }) {
    const { logoSvg, logoFile, name, slug } = config.meta

    if (logoSvg) {
        const themed = logoSvg
            .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"')
            .replace(/<svg /, `<svg style="height:${height}px;width:auto;display:block" `)
        return (
            <span
                aria-label={name}
                style={{ color: "var(--foreground)", display: "inline-flex" }}
                dangerouslySetInnerHTML={{ __html: themed }}
            />
        )
    }

    if (logoFile) {
        return <img src={assetUrl(slug, logoFile)} alt={name} style={{ height, width: "auto" }} />
    }

    return <strong style={{ fontSize: "var(--text-heading-sm)", fontWeight: 600 }}>{name}</strong>
}
