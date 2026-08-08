import type { ReactNode } from "react"
import { previewCss } from "../../export/css"
import type { Mode, ResolvedTokens } from "../../engine/types"

/**
 * The canvas injects the SAME declarations array the exporter prints, scoped to
 * `#preview-root` so brand colour never leaks into the app's own chrome.
 *
 * Everything rendered inside must use `var(--token)` only. There is a lint that
 * fails on a hex literal in `preview/contexts/` — if the preview can express a
 * colour the export can't, the tool is lying.
 */
export function PreviewCanvas({
    resolved,
    mode,
    children,
}: {
    resolved: ResolvedTokens
    mode: Mode
    children: ReactNode
}) {
    return (
        <>
            <style>{previewCss(resolved)}</style>
            <div
                id="preview-root"
                data-theme={mode}
                style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-sans)",
                    minHeight: "100%",
                }}
            >
                {children}
            </div>
        </>
    )
}
