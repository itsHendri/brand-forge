import { useState } from "react"
import { concentricInner, spaceName } from "../../engine/defaults"
import type { RadiusStep, ResolvedTokens } from "../../engine/types"
import { useStore } from "../store"
import { Field, NumberInput, Section } from "./controls"

const RADIUS_STEPS: RadiusStep[] = ["sm", "md", "lg", "xl"]

/**
 * One radius knob and a blessed spacing subset.
 *
 * The concentric demo is here rather than in the docs alone because the rule is
 * the kind of thing people agree with in prose and then get wrong in practice.
 * Drag the padding and watch the inner radius follow.
 */
export function ShapePanel({ resolved }: { resolved: ResolvedTokens }) {
    const { config, patch } = useStore()
    const [demoPadding, setDemoPadding] = useState(16)
    const outer = resolved.radius.lg
    const inner = concentricInner(outer, demoPadding)
    const beyondRule = demoPadding > 24

    return (
        <div className="grid gap-5">
            <Section title="Radius" hint="Everything derives from one base. Set it to 0 and the whole system goes sharp.">
                <Field label="Base (px)">
                    <NumberInput
                        value={config.radius.basePx}
                        min={0}
                        max={32}
                        onChange={(basePx) => patch((draft) => void (draft.radius.basePx = basePx))}
                    />
                </Field>
                <input
                    type="range"
                    min={0}
                    max={24}
                    value={config.radius.basePx}
                    onChange={(event) =>
                        patch((draft) => void (draft.radius.basePx = Number(event.target.value)))
                    }
                    className="w-full"
                />
                <div className="flex gap-2">
                    {RADIUS_STEPS.map((step) => (
                        <div key={step} className="flex-1 text-center">
                            <div
                                className="mx-auto h-10 w-full border border-[var(--app-border)] bg-white"
                                style={{ borderRadius: `${resolved.radius[step]}px` }}
                            />
                            <div className="mt-1 font-mono text-[10px] text-[var(--app-ink-soft)]">
                                {step} · {resolved.radius[step]}px
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section
                title="Concentric radius"
                hint="A rounded box inside another uses inner = outer − padding, floored at 0. Past 24px padding the surfaces stop reading as nested and the rule no longer applies."
            >
                <div
                    className="border border-[var(--app-border)] bg-white"
                    style={{ borderRadius: `${outer}px`, padding: `${demoPadding}px` }}
                >
                    <div
                        className="flex h-14 items-center justify-center bg-[var(--app-ink)] font-mono text-[11px] text-white"
                        style={{ borderRadius: `${beyondRule ? resolved.radius.md : inner}px` }}
                    >
                        {beyondRule ? resolved.radius.md : inner}px
                    </div>
                </div>
                <Field label={`Padding — ${demoPadding}px`}>
                    <input
                        type="range"
                        min={0}
                        max={40}
                        step={4}
                        value={demoPadding}
                        onChange={(event) => setDemoPadding(Number(event.target.value))}
                        className="w-full"
                    />
                </Field>
                <p className="font-mono text-[11px] text-[var(--app-ink-soft)]">
                    {beyondRule
                        ? `${demoPadding}px > 24px — treat the surfaces independently; inner falls back to --radius-md (${resolved.radius.md}px).`
                        : `${outer} − ${demoPadding} = ${inner}px`}
                </p>
            </Section>

            <Section
                title="Spacing"
                hint="A blessed subset, not every multiple. A value between two of these is a bug, not a refinement."
            >
                <Field label="Base (px)">
                    <NumberInput
                        value={config.spacing.basePx}
                        min={1}
                        max={8}
                        onChange={(basePx) => patch((draft) => void (draft.spacing.basePx = basePx))}
                    />
                </Field>
                <div className="grid gap-1">
                    {config.spacing.blessed.map((px, index) => (
                        <div key={px} className="flex items-center gap-2">
                            <code className="w-24 shrink-0 whitespace-nowrap font-mono text-[11px] text-[var(--app-ink-soft)]">
                                --space-{spaceName(px, config.spacing.basePx)}
                            </code>
                            <span
                                className="h-3 shrink-0 bg-[var(--app-ink)]"
                                style={{ width: `${Math.min(px, 120)}px` }}
                            />
                            <span className="font-mono text-[11px] text-[var(--app-ink-soft)]">{px}px</span>
                            <button
                                type="button"
                                title="Remove"
                                onClick={() =>
                                    patch(
                                        (draft) =>
                                            void (draft.spacing.blessed = draft.spacing.blessed.filter(
                                                (_, i) => i !== index,
                                            )),
                                    )
                                }
                                className="ml-auto px-1 text-xs text-[var(--app-ink-soft)]"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <AddSpacing
                    basePx={config.spacing.basePx}
                    existing={config.spacing.blessed}
                    onAdd={(px) =>
                        patch(
                            (draft) =>
                                void (draft.spacing.blessed = [...draft.spacing.blessed, px].sort((a, b) => a - b)),
                        )
                    }
                />
            </Section>
        </div>
    )
}

function AddSpacing({
    basePx,
    existing,
    onAdd,
}: {
    basePx: number
    existing: number[]
    onAdd: (px: number) => void
}) {
    const [value, setValue] = useState(20)
    const offGrid = value % basePx !== 0
    const duplicate = existing.includes(value)

    return (
        <div className="grid gap-1">
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <NumberInput value={value} step={basePx} min={0} onChange={setValue} suffix="px" />
                </div>
                <button
                    type="button"
                    disabled={offGrid || duplicate}
                    onClick={() => onAdd(value)}
                    className="rounded border border-[var(--app-border)] px-2 py-1.5 text-[11px] disabled:opacity-40"
                >
                    Add
                </button>
            </div>
            {offGrid && (
                <span className="text-[11px] text-red-700">
                    {value}px is off the {basePx}px grid.
                </span>
            )}
            {duplicate && <span className="text-[11px] text-[var(--app-ink-soft)]">Already blessed.</span>}
        </div>
    )
}
