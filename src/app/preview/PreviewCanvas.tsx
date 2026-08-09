import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { previewCss } from "../../export/css"
import type { Mode, ResolvedTokens } from "../../engine/types"

/**
 * The canvas is an iframe, not a div.
 *
 * A div constrained to 390px is not a 390px viewport: `vw` units and media
 * queries both resolve against the browser window, so pinning the width showed
 * the right column count and the wrong type size, silently. Fluid type made that
 * obvious — the heading measured identically at every breakpoint — but media
 * queries had been lying the whole time in the same way.
 *
 * An iframe *is* a viewport. Everything viewport-relative now means what it says.
 *
 * The declarations injected here are the same array the exporter prints, so the
 * preview still cannot drift from the stylesheet it ships beside.
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
    const frame = useRef<HTMLIFrameElement>(null)
    const [body, setBody] = useState<HTMLElement | null>(null)

    // An about:blank iframe already has a document — use it. Rewriting it with
    // doc.write() fires a second load that replaces the body React has just
    // portalled into, so the canvas comes up empty.
    const attach = () => {
        const doc = frame.current?.contentDocument
        if (!doc?.body) return
        doc.body.style.margin = "0"
        setBody((current) => (current === doc.body ? current : doc.body))
    }

    useEffect(attach, [])

    useEffect(() => {
        const doc = frame.current?.contentDocument
        if (doc?.documentElement) doc.documentElement.style.colorScheme = mode
    }, [mode, body])

    return (
        <div
            style={{
                height: "100%",
                background: width ? "var(--app-panel)" : undefined,
                padding: width ? "16px 0" : undefined,
                display: "flex",
                justifyContent: "center",
                // Wider than the pane scrolls rather than being squeezed: a canvas
                // labelled "xl" that is actually 400px wide is worse than none.
                overflowX: "auto",
            }}
        >
            <iframe
                ref={frame}
                onLoad={attach}
                title="Preview"
                style={{
                    border: width ? "1px solid var(--app-border)" : "none",
                    width: width ? `${width}px` : "100%",
                    flex: "0 0 auto",
                    height: "100%",
                    background: "var(--app-panel)",
                }}
            />
            {body &&
                createPortal(
                    <>
                        <style>
                            {previewCss(
                                resolved,
                                ":root",
                                `/api/assets/${resolved.config.meta.slug}`,
                            )}
                        </style>
                        <div
                            id="preview-root"
                            data-theme={mode}
                            style={{
                                background: "var(--background)",
                                color: "var(--foreground)",
                                fontFamily: "var(--font-sans)",
                                minHeight: "100vh",
                            }}
                        >
                            {children}
                        </div>
                    </>,
                    body,
                )}
        </div>
    )
}
