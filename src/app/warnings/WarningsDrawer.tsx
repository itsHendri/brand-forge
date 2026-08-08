import type { ResolvedTokens, Warning } from "../../engine/types"
import { useStore } from "../store"

/**
 * Warnings are only useful if acting on them is one click. Every contrast
 * failure carries the step that would fix it, so the drawer offers the fix
 * rather than just the diagnosis.
 */
export function WarningsDrawer({
    resolved,
    onClose,
}: {
    resolved: ResolvedTokens
    onClose: () => void
}) {
    const { setSemanticRef, setPanel, highlight, setMode } = useStore()
    const failures = resolved.warnings.filter((w) => w.level === "fail")
    const notes = resolved.warnings.filter((w) => w.level === "warn")

    const applyFix = (warning: Warning) => {
        if (!warning.fix) return
        setSemanticRef(warning.fix.token, warning.fix.mode, warning.fix.ref)
    }

    const jumpTo = (warning: Warning) => {
        if (warning.mode) setMode(warning.mode)
        setPanel("semantics")
        highlight(warning.tokens?.[0] ?? null)
        onClose()
    }

    return (
        <div className="absolute inset-y-0 right-0 z-10 flex w-[420px] flex-col border-l border-[var(--app-border)] bg-white shadow-xl">
            <header className="flex items-center gap-2 border-b border-[var(--app-border)] px-4 py-3">
                <strong className="text-sm">Warnings</strong>
                <span className="text-xs text-[var(--app-ink-soft)]">
                    {failures.length} failing · {notes.length} to watch
                </span>
                <button type="button" onClick={onClose} className="ml-auto text-sm text-[var(--app-ink-soft)]">
                    Close
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto p-3">
                {resolved.warnings.length === 0 ? (
                    <p className="p-4 text-sm text-[var(--app-ink-soft)]">
                        Nothing to report. Every text and boundary pair clears its APCA threshold in both
                        modes.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {[...failures, ...notes].map((warning, index) => (
                            <li
                                key={index}
                                className="rounded-md border border-[var(--app-border)] p-3 text-sm"
                            >
                                <div className="mb-1 flex items-center gap-2">
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                                            warning.level === "fail"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-amber-100 text-amber-900"
                                        }`}
                                    >
                                        {warning.level}
                                    </span>
                                    {warning.mode && (
                                        <span className="text-[11px] text-[var(--app-ink-soft)]">
                                            {warning.mode}
                                        </span>
                                    )}
                                </div>

                                <p className="leading-snug">{warning.message}</p>

                                {warning.apcaLc !== undefined && (
                                    <p className="mt-1 font-mono text-[11px] text-[var(--app-ink-soft)]">
                                        APCA Lc {warning.apcaLc} (needs {warning.requiredLc}) · WCAG{" "}
                                        {warning.wcagRatio}:1
                                    </p>
                                )}

                                <div className="mt-2 flex gap-2">
                                    {warning.fix && (
                                        <button
                                            type="button"
                                            onClick={() => applyFix(warning)}
                                            className="rounded border border-[var(--app-border)] px-2 py-1 text-xs"
                                        >
                                            Use {warning.fix.ref.scale}-{warning.fix.ref.step}
                                        </button>
                                    )}
                                    {warning.tokens && (
                                        <button
                                            type="button"
                                            onClick={() => jumpTo(warning)}
                                            className="rounded px-2 py-1 text-xs text-[var(--app-ink-soft)]"
                                        >
                                            Show token
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
