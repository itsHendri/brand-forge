import { useMemo, useState } from "react"
import { resolveTokens } from "../engine/resolve"
import { SCALE_ROLES, STEPS, type Mode } from "../engine/types"
import { hendriPreset } from "../presets/hendri"

/**
 * P0 surface: dump every generated ramp so the scale maths can be judged by eye
 * before any editing UI exists. P1 replaces this with the real editor + preview.
 */
export function App() {
    const [mode, setMode] = useState<Mode>("light")
    const resolved = useMemo(() => resolveTokens(hendriPreset), [])

    return (
        <div className="min-h-full p-8">
            <header className="mb-8 flex items-baseline gap-4">
                <h1 className="text-xl font-semibold">Brand Forge</h1>
                <span className="text-sm text-[var(--app-ink-soft)]">
                    {resolved.config.meta.name} · {resolved.semantics.length} semantic tokens ·{" "}
                    {resolved.warnings.length} warnings
                </span>
                <button
                    type="button"
                    onClick={() => setMode(mode === "light" ? "dark" : "light")}
                    className="ml-auto rounded-md border border-[var(--app-border)] px-3 py-1.5 text-sm"
                >
                    {mode === "light" ? "Light" : "Dark"} ramps
                </button>
            </header>

            <section className="mb-10">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--app-ink-soft)]">
                    Primitives
                </h2>
                <div className="space-y-2">
                    {SCALE_ROLES.map((role) => {
                        const scale = resolved.scales[role]
                        if (!scale) return null
                        return (
                            <div key={role} className="flex items-center gap-3">
                                <div className="w-28 shrink-0 text-sm">
                                    <div className="font-medium">{scale.name}</div>
                                    <div className="text-xs text-[var(--app-ink-soft)]">{role}</div>
                                </div>
                                <div className="flex flex-1 gap-1">
                                    {STEPS.map((step) => {
                                        const swatch = scale.steps[mode][step]!
                                        const isAnchor = step === scale.anchorStep
                                        return (
                                            <div key={step} className="flex-1">
                                                <div
                                                    className="h-12 rounded"
                                                    style={{
                                                        background: swatch.css,
                                                        outline: isAnchor ? "2px solid var(--app-ink)" : undefined,
                                                        outlineOffset: 1,
                                                    }}
                                                    title={`${role}-${step} · ${swatch.hex}`}
                                                />
                                                <div className="mt-1 text-center text-[10px] text-[var(--app-ink-soft)]">
                                                    {step}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <p className="mt-3 text-xs text-[var(--app-ink-soft)]">
                    Outlined swatch = the step the typed seed landed on.
                </p>
            </section>

            <section>
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--app-ink-soft)]">
                    Semantics
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
                    {resolved.semantics.map((token) => (
                        <div
                            key={token.name}
                            className="flex items-center gap-2 rounded-md border border-[var(--app-border)] p-2"
                        >
                            <div
                                className="h-9 w-9 shrink-0 rounded border border-[var(--app-border)]"
                                style={{ background: token.values[mode]!.css }}
                            />
                            <div className="min-w-0">
                                <div className="truncate font-mono text-xs">--{token.name}</div>
                                <div className="truncate text-[11px] text-[var(--app-ink-soft)]">
                                    {token[mode].scale}-{token[mode].step} · {token.values[mode]!.hex}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {resolved.warnings.length > 0 && (
                <section className="mt-10">
                    <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--app-ink-soft)]">
                        Warnings
                    </h2>
                    <ul className="space-y-1 text-sm">
                        {resolved.warnings.map((warning, i) => (
                            <li key={i}>
                                <span className="font-mono text-xs">[{warning.level}]</span> {warning.message}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}
