import { SCALE_ROLES, STEPS, type ResolvedTokens, type SemanticGroup } from "../../engine/types"
import { useStore } from "../store"

const GROUP_LABELS: Record<SemanticGroup, string> = {
    surface: "Surfaces",
    text: "Text",
    state: "States",
    border: "Borders",
    brand: "Brand",
    status: "Status",
}

const GROUP_ORDER: SemanticGroup[] = ["surface", "text", "state", "border", "brand", "status"]

/**
 * The mapping layer, made editable. Each row is a semantic token and the
 * primitive it points at in the current mode — change the pointer, not the value.
 */
export function SemanticsPanel({ resolved }: { resolved: ResolvedTokens }) {
    const { mode, setSemanticRef, resetSemanticRef, highlighted, highlight } = useStore()
    const overriddenCount = resolved.semantics.filter((token) => token.overridden[mode]).length

    return (
        <div className="flex flex-col gap-5">
            <p className="text-xs leading-relaxed text-[var(--app-ink-soft)]">
                Semantics are what your code and your agents use. Each points at a primitive step in{" "}
                <strong>{mode}</strong> mode.
            </p>
            <p className="text-xs leading-relaxed text-[var(--app-ink-soft)]">
                {overriddenCount === 0 ? (
                    <>
                        Every token here is generated from your seeds, so all of them improve when the
                        engine does. Change one and it stops tracking — the ↺ undoes that.
                    </>
                ) : (
                    <>
                        <strong>
                            {overriddenCount} token{overriddenCount === 1 ? "" : "s"}
                        </strong>{" "}
                        in {mode} mode {overriddenCount === 1 ? "is" : "are"} pinned by hand and no longer{" "}
                        {overriddenCount === 1 ? "tracks" : "track"} your seeds. Everything else still does.
                    </>
                )}
            </p>

            {GROUP_ORDER.map((group) => {
                const tokens = resolved.semantics.filter((token) => token.group === group)
                if (tokens.length === 0) return null
                return (
                    <section key={group}>
                        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--app-ink-soft)]">
                            {GROUP_LABELS[group]}
                        </h3>
                        <div className="space-y-1">
                            {tokens.map((token) => {
                                const ref = token[mode]
                                const isHighlighted = highlighted === token.name
                                return (
                                    <div
                                        key={token.name}
                                        onMouseEnter={() => highlight(null)}
                                        className={`flex items-center gap-2 rounded-md px-1.5 py-1 ${
                                            isHighlighted ? "bg-amber-100 ring-1 ring-amber-300" : ""
                                        }`}
                                    >
                                        <span
                                            className="h-6 w-6 shrink-0 rounded border border-[var(--app-border)]"
                                            style={{ background: token.values[mode]!.css }}
                                            title={token.description}
                                        />
                                        <code
                                            className="min-w-0 flex-1 truncate font-mono text-[11px]"
                                            title={token.description}
                                        >
                                            --{token.name}
                                        </code>
                                        <select
                                            value={ref.scale}
                                            onChange={(event) =>
                                                setSemanticRef(token.name, mode, {
                                                    scale: event.target.value as (typeof SCALE_ROLES)[number],
                                                    step: ref.step,
                                                })
                                            }
                                            className="rounded border border-[var(--app-border)] bg-white px-1 py-0.5 text-[11px]"
                                        >
                                            {SCALE_ROLES.map((role) => (
                                                <option key={role} value={role}>
                                                    {resolved.scales[role]?.name ?? role}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={ref.step}
                                            onChange={(event) =>
                                                setSemanticRef(token.name, mode, {
                                                    scale: ref.scale,
                                                    step: Number(event.target.value) as (typeof STEPS)[number],
                                                })
                                            }
                                            className="rounded border border-[var(--app-border)] bg-white px-1 py-0.5 text-[11px]"
                                        >
                                            {STEPS.map((step) => (
                                                <option key={step} value={step}>
                                                    {step}
                                                </option>
                                            ))}
                                        </select>
                                        {/*
                                          Always rendered, so the row never reflows
                                          when a token becomes overridden — the
                                          control just stops being invisible.
                                        */}
                                        <button
                                            type="button"
                                            onClick={() => resetSemanticRef(token.name, mode)}
                                            disabled={!token.overridden[mode]}
                                            aria-label={`Reset --${token.name} to the generated value`}
                                            title={
                                                token.overridden[mode]
                                                    ? "Pinned by hand. Reset it to track your seeds again."
                                                    : "Generated from your seeds."
                                            }
                                            className={`w-4 shrink-0 text-[11px] leading-none ${
                                                token.overridden[mode]
                                                    ? "cursor-pointer text-[var(--app-ink-soft)] hover:text-[var(--app-ink)]"
                                                    : "invisible"
                                            }`}
                                        >
                                            ↺
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
