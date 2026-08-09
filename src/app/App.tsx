import { useEffect, useMemo, useState } from "react"
import { resolveTokens } from "../engine/resolve"
import { BrandSwitcher } from "./BrandSwitcher"
import { ExportDialog } from "./ExportDialog"
import { BrandPanel } from "./panels/BrandPanel"
import { ColorPanel } from "./panels/ColorPanel"
import { LayoutPanel } from "./panels/LayoutPanel"
import { MotionPanel } from "./panels/MotionPanel"
import { RulesPanel } from "./panels/RulesPanel"
import { SemanticsPanel } from "./panels/SemanticsPanel"
import { ShapePanel } from "./panels/ShapePanel"
import { TypePanel } from "./panels/TypePanel"
import { ComponentsSheet } from "./preview/contexts/ComponentsSheet"
import { PreviewCanvas } from "./preview/PreviewCanvas"
import { useStore, type PanelId } from "./store"
import { WarningsDrawer } from "./warnings/WarningsDrawer"

const PANELS: Array<{ id: PanelId; label: string }> = [
    { id: "brand", label: "Brand" },
    { id: "color", label: "Colour" },
    { id: "semantics", label: "Semantics" },
    { id: "type", label: "Type" },
    { id: "layout", label: "Layout" },
    { id: "shape", label: "Space & shape" },
    { id: "motion", label: "Motion" },
    { id: "rules", label: "Rules" },
]

export function App() {
    const {
        config,
        mode,
        panel,
        setMode,
        setPanel,
        saving,
        hydrate,
        previewWidth,
        setPreviewWidth,
        undo,
        redo,
        canUndo,
        canRedo,
    } = useStore()
    const resolved = useMemo(() => resolveTokens(config), [config])
    const [showWarnings, setShowWarnings] = useState(false)
    const [showExport, setShowExport] = useState(false)
    const failures = resolved.warnings.filter((w) => w.level === "fail").length

    useEffect(() => {
        void hydrate()
    }, [hydrate])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") return
            event.preventDefault()
            if (event.shiftKey) redo()
            else undo()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [undo, redo])

    return (
        <div className="relative grid h-full grid-cols-[340px_1fr] grid-rows-[52px_1fr]">
            <header className="col-span-2 flex items-center gap-4 border-b border-[var(--app-border)] px-4">
                <strong className="text-sm">Brand Forge</strong>
                <BrandSwitcher />

                <div className="flex overflow-hidden rounded-md border border-[var(--app-border)] text-xs">
                    <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo()}
                        title="Undo (⌘Z)"
                        className="px-2 py-1.5 disabled:opacity-30"
                    >
                        ↶
                    </button>
                    <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo()}
                        title="Redo (⇧⌘Z)"
                        className="px-2 py-1.5 disabled:opacity-30"
                    >
                        ↷
                    </button>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    {/* Pinning the canvas to a breakpoint is how the responsive
                        rules stop being numbers in a doc and start being visible. */}
                    <div className="flex overflow-hidden rounded-md border border-[var(--app-border)] text-xs">
                        <button
                            type="button"
                            onClick={() => setPreviewWidth(null)}
                            className={`px-2 py-1.5 ${previewWidth === null ? "bg-[var(--app-ink)] text-white" : ""}`}
                        >
                            Fill
                        </button>
                        {config.layout.breakpoints.map((breakpoint) => (
                            <button
                                key={breakpoint.name}
                                type="button"
                                title={`${breakpoint.minPx}px — ${breakpoint.note}`}
                                onClick={() => setPreviewWidth(breakpoint.minPx)}
                                className={`px-2 py-1.5 ${
                                    previewWidth === breakpoint.minPx ? "bg-[var(--app-ink)] text-white" : ""
                                }`}
                            >
                                {breakpoint.name}
                            </button>
                        ))}
                    </div>

                    <span className="text-xs text-[var(--app-ink-soft)]">
                        {saving ? "Saving…" : "Saved"}
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowWarnings((open) => !open)}
                        className={`rounded-md border px-2.5 py-1.5 text-xs ${
                            failures > 0
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-[var(--app-border)] text-[var(--app-ink-soft)]"
                        }`}
                    >
                        {failures > 0 ? `${failures} failing` : "Contrast clear"}
                    </button>
                    <div className="flex overflow-hidden rounded-md border border-[var(--app-border)] text-xs">
                        {(["light", "dark"] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setMode(option)}
                                className={`px-3 py-1.5 capitalize ${
                                    mode === option ? "bg-[var(--app-ink)] text-white" : ""
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowExport(true)}
                        className="rounded-md bg-[var(--app-ink)] px-3 py-1.5 text-xs text-white"
                    >
                        Export
                    </button>
                </div>
            </header>

            <aside className="flex min-h-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-panel)]">
                <nav className="flex flex-wrap gap-1 border-b border-[var(--app-border)] p-2">
                    {PANELS.map((entry) => (
                        <button
                            key={entry.id}
                            type="button"
                            onClick={() => setPanel(entry.id)}
                            className={`rounded px-2 py-1 text-xs ${
                                panel === entry.id
                                    ? "bg-white text-[var(--app-ink)] shadow-sm"
                                    : "text-[var(--app-ink-soft)]"
                            }`}
                        >
                            {entry.label}
                        </button>
                    ))}
                </nav>

                <div className="min-h-0 flex-1 overflow-auto p-4">
                    {panel === "brand" && <BrandPanel />}
                    {panel === "color" && <ColorPanel resolved={resolved} />}
                    {panel === "semantics" && <SemanticsPanel resolved={resolved} />}
                    {panel === "type" && <TypePanel />}
                    {panel === "layout" && <LayoutPanel />}
                    {panel === "shape" && <ShapePanel resolved={resolved} />}
                    {panel === "motion" && <MotionPanel />}
                    {panel === "rules" && <RulesPanel />}
                </div>
            </aside>

            <main className="min-h-0 overflow-auto">
                <PreviewCanvas resolved={resolved} mode={mode} width={previewWidth}>
                    <ComponentsSheet />
                </PreviewCanvas>
            </main>

            {showWarnings && (
                <WarningsDrawer resolved={resolved} onClose={() => setShowWarnings(false)} />
            )}
            {showExport && <ExportDialog resolved={resolved} onClose={() => setShowExport(false)} />}
        </div>
    )
}
