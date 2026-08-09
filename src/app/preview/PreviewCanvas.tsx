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
    width,
    children,
}: {
    resolved: ResolvedTokens
    mode: Mode
    /** Pin the canvas to a width to judge a breakpoint. null fills the pane. */
    width: number | null
    children: ReactNode
}) {
    return (
        <div
            style={{
                minHeight: "100%",
                // The gutter makes a pinned width read as a frame rather than as
                // the whole world, which is the difference between judging a
                // layout and just looking at it.
                background: width ? "var(--app-panel)" : undefined,
                padding: width ? "16px 0" : undefined,
                // fit-content, so a breakpoint wider than the pane scrolls
                // instead of being quietly squeezed. A canvas labelled "xl" that
                // is actually 400px wide is worse than no canvas at all.
                minWidth: width ? "fit-content" : undefined,
            }}
        >
            <style>{previewCss(resolved)}</style>
            <div
                id="preview-root"
                data-theme={mode}
                style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontFamily: "var(--font-sans)",
                    minHeight: width ? undefined : "100%",
                    width: width ? `${width}px` : undefined,
                    marginInline: width ? "auto" : undefined,
                    outline: width ? "1px solid var(--border)" : undefined,
                }}
            >
                {children}
            </div>
        </div>
    )
}
