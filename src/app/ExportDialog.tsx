import { useEffect, useMemo, useState } from "react"
import { buildExport, exportAsMap, exportBudget, referencedAssets, type ExportFile } from "../export/bundle"
import type { ResolvedTokens } from "../engine/types"
import { readAssetBase64, writeExport } from "./persistence"

export function ExportDialog({
    resolved,
    onClose,
}: {
    resolved: ResolvedTokens
    onClose: () => void
}) {
    const baseFiles = useMemo(() => buildExport(resolved), [resolved])
    const [assets, setAssets] = useState<ExportFile[]>([])
    const files = useMemo(() => [...baseFiles, ...assets], [baseFiles, assets])

    // Asset bytes are read back from disk, so the export is a complete handover
    // rather than a stylesheet pointing at files only this machine has.
    useEffect(() => {
        let cancelled = false
        const names = referencedAssets(resolved)
        if (names.length === 0) {
            setAssets([])
            return
        }
        void Promise.all(
            names.map(async (fileName): Promise<ExportFile | null> => {
                const base64 = await readAssetBase64(resolved.config.meta.slug, fileName)
                return base64
                    ? {
                          path: `assets/${fileName}`,
                          content: base64,
                          note: "Referenced by tokens.css — ships with the export.",
                          encoding: "base64",
                      }
                    : null
            }),
        ).then((loaded) => {
            if (!cancelled) setAssets(loaded.filter((entry) => entry !== null))
        })
        return () => {
            cancelled = true
        }
    }, [resolved])
    const budget = exportBudget(files)
    const [result, setResult] = useState<string | null>(null)
    const [preview, setPreview] = useState(files[0]!.path)
    const failures = resolved.warnings.filter((w) => w.level === "fail").length

    const write = async () => {
        setResult("Writing…")
        const response = await writeExport(resolved.config.meta.slug, exportAsMap(files))
        setResult(response.ok ? `Written to ${response.dir}` : "Write failed — is the dev server running?")
    }

    const download = (path: string, content: string) => {
        const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }))
        const link = document.createElement("a")
        link.href = url
        link.download = path.split("/").pop()!
        link.click()
        URL.revokeObjectURL(url)
    }

    const previewed = files.find((file) => file.path === preview)!

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 p-8">
            <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[var(--app-border)] bg-white shadow-2xl">
                <header className="flex items-center gap-3 border-b border-[var(--app-border)] px-4 py-3">
                    <strong className="text-sm">Export {resolved.config.meta.name}</strong>
                    <span className="text-xs text-[var(--app-ink-soft)]">
                        ~{budget.tokens.toLocaleString()} LLM tokens
                        {budget.overBudget ? " — over budget, trim the docs" : ""}
                    </span>
                    {failures > 0 && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] text-red-800">
                            {failures} contrast failures will ship
                        </span>
                    )}
                    <button type="button" onClick={onClose} className="ml-auto text-sm text-[var(--app-ink-soft)]">
                        Close
                    </button>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
                    <ul className="min-h-0 overflow-auto border-r border-[var(--app-border)] p-2">
                        {files.map((file) => (
                            <li key={file.path}>
                                <button
                                    type="button"
                                    onClick={() => setPreview(file.path)}
                                    className={`w-full rounded-md p-2 text-left ${
                                        preview === file.path ? "bg-[var(--app-panel)]" : ""
                                    }`}
                                >
                                    <code className="block font-mono text-[11px]">{file.path}</code>
                                    <span className="text-[11px] leading-snug text-[var(--app-ink-soft)]">
                                        {file.note}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="flex min-h-0 flex-col">
                        <pre className="min-h-0 flex-1 overflow-auto bg-[var(--app-panel)] p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                            {previewed.content}
                        </pre>
                        <div className="flex items-center gap-2 border-t border-[var(--app-border)] px-4 py-3">
                            <button
                                type="button"
                                onClick={write}
                                className="rounded-md bg-[var(--app-ink)] px-3 py-1.5 text-xs text-white"
                            >
                                Write to exports/{resolved.config.meta.slug}/
                            </button>
                            <button
                                type="button"
                                onClick={() => download(previewed.path, previewed.content)}
                                className="rounded-md border border-[var(--app-border)] px-3 py-1.5 text-xs"
                            >
                                Download this file
                            </button>
                            {result && <span className="text-xs text-[var(--app-ink-soft)]">{result}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
