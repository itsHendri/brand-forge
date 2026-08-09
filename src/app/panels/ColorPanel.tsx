import { useEffect, useState } from "react"
import { parseSeed } from "../../engine/scale"
import { SCALE_ROLES, STEPS, type ResolvedTokens } from "../../engine/types"
import { useStore } from "../store"

/**
 * Primitives are where a human edits colour: type a seed, get a ramp, override
 * any individual step when the maths and your eye disagree.
 */
export function ColorPanel({ resolved }: { resolved: ResolvedTokens }) {
    const { mode, editingScale, setEditingScale, setSeed, setScaleName, setStepOverride, config } =
        useStore()
    const scale = resolved.scales[editingScale]
    const scaleConfig = config.color.scales.find((s) => s.role === editingScale)
    if (!scale || !scaleConfig) return null

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1">
                {SCALE_ROLES.map((role) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => setEditingScale(role)}
                        className={`rounded px-2 py-1 text-xs ${
                            role === editingScale
                                ? "bg-[var(--app-ink)] text-white"
                                : "bg-[var(--app-panel)] text-[var(--app-ink-soft)]"
                        }`}
                    >
                        <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: resolved.scales[role]?.steps[mode][600]?.css }}
                        />
                        {resolved.scales[role]?.name ?? role}
                    </button>
                ))}
            </div>

            <div className="grid gap-3">
                <label className="grid gap-1">
                    <span className="text-xs text-[var(--app-ink-soft)]">Name</span>
                    <input
                        value={scaleConfig.name}
                        onChange={(event) => setScaleName(editingScale, event.target.value)}
                        className="rounded-md border border-[var(--app-border)] px-2 py-1.5 text-sm"
                    />
                </label>

                <label className="grid gap-1">
                    <span className="text-xs text-[var(--app-ink-soft)]">
                        Seed — lands verbatim on step {scale.anchorStep}
                    </span>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={toHexInput(scaleConfig.seed, scale.steps.light[scale.anchorStep]!.hex)}
                            onChange={(event) => setSeed(editingScale, event.target.value)}
                            className="h-9 w-12 cursor-pointer rounded border border-[var(--app-border)] bg-transparent p-0.5"
                        />
                        <SeedField
                            value={scaleConfig.seed}
                            onCommit={(seed) => setSeed(editingScale, seed)}
                        />
                    </div>
                </label>
            </div>

            <div>
                <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-xs text-[var(--app-ink-soft)]">
                        {mode === "light" ? "Light" : "Dark"} ramp
                    </span>
                    <span className="text-[11px] text-[var(--app-ink-soft)]">
                        click a swatch to override
                    </span>
                </div>
                <div className="grid gap-1">
                    {STEPS.map((step) => {
                        const swatch = scale.steps[mode][step]!
                        const isAnchor = step === scale.anchorStep && mode === "light"
                        return (
                            <div key={step} className="flex items-center gap-2">
                                <code className="w-8 shrink-0 text-right text-[11px] text-[var(--app-ink-soft)]">
                                    {step}
                                </code>
                                <label
                                    className="h-7 flex-1 cursor-pointer rounded border border-[var(--app-border)]"
                                    style={{ background: swatch.css }}
                                    title={`${editingScale}-${step}`}
                                >
                                    <input
                                        type="color"
                                        value={swatch.hex}
                                        onChange={(event) =>
                                            setStepOverride(editingScale, mode, step, event.target.value)
                                        }
                                        className="sr-only"
                                    />
                                </label>
                                <code className="w-16 shrink-0 font-mono text-[11px] text-[var(--app-ink-soft)]">
                                    {swatch.hex}
                                </code>
                                <span className="w-4 shrink-0 text-center text-[11px]">
                                    {swatch.overridden ? (
                                        <button
                                            type="button"
                                            title="Overridden — click to return to the generated value"
                                            onClick={() => setStepOverride(editingScale, mode, step, null)}
                                            className="text-[var(--app-ink)]"
                                        >
                                            ●
                                        </button>
                                    ) : isAnchor ? (
                                        <span title="The seed landed here" className="text-[var(--app-ink-soft)]">
                                            ◆
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/** <input type="color"> only accepts #rrggbb, so fall back to the resolved swatch. */
function toHexInput(seed: string, fallback: string): string {
    return /^#[0-9a-fA-F]{6}$/.test(seed.trim()) ? seed.trim() : fallback
}

/**
 * Typing a hex goes through half-finished states — `#5`, `#57`, `#574c`. Writing
 * each of those to the brand replaces the whole ramp with garbage and fills the
 * undo stack with keystrokes, so the field holds its own text and only commits
 * when the value actually parses as a colour.
 */
function SeedField({ value, onCommit }: { value: string; onCommit: (seed: string) => void }) {
    const [draft, setDraft] = useState(value)
    useEffect(() => setDraft(value), [value])

    const valid = parseSeed(draft) !== null
    return (
        <input
            value={draft}
            spellCheck={false}
            onChange={(event) => {
                setDraft(event.target.value)
                if (parseSeed(event.target.value) !== null) onCommit(event.target.value)
            }}
            onBlur={() => setDraft(value)}
            title={valid ? undefined : "Not a colour yet — nothing has been changed"}
            className={`flex-1 rounded-md border px-2 py-1.5 font-mono text-sm ${
                valid ? "border-[var(--app-border)]" : "border-amber-400 bg-amber-50"
            }`}
        />
    )
}
