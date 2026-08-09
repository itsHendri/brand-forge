import { useStore } from "../store"
import { Field, NumberInput, Section, TextInput } from "./controls"

/**
 * Breakpoints and containers.
 *
 * These are the two things the system used to leave to whoever was building —
 * which meant every page invented its own. The panel keeps them in the same
 * shape as everything else: named for the job, with a note saying what actually
 * changes, because a breakpoint without a reason is just a number.
 */
export function LayoutPanel() {
    const { config, patch, previewWidth, setPreviewWidth } = useStore()
    const { breakpoints, containers } = config.layout

    return (
        <div className="grid gap-5">
            <Section
                title="Breakpoints"
                hint="Mobile-first min-widths. Base styles are the narrowest case; each of these is an upgrade. CSS can't read a var() inside a media query, so these exist to state the legitimate set — and to feed Tailwind's variants."
            >
                <div className="grid gap-2">
                    {breakpoints.map((breakpoint, index) => (
                        <div key={breakpoint.name} className="rounded-md border border-[var(--app-border)] bg-white p-2">
                            <div className="mb-2 flex items-center gap-2">
                                <code className="font-mono text-[11px]">--breakpoint-{breakpoint.name}</code>
                                <button
                                    type="button"
                                    title="Remove"
                                    onClick={() =>
                                        patch(
                                            (draft) =>
                                                void (draft.layout.breakpoints = draft.layout.breakpoints.filter(
                                                    (_, i) => i !== index,
                                                )),
                                        )
                                    }
                                    className="ml-auto px-1 text-xs text-[var(--app-ink-soft)]"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Name">
                                    <TextInput
                                        mono
                                        value={breakpoint.name}
                                        onChange={(name) =>
                                            patch((draft) => void (draft.layout.breakpoints[index]!.name = name))
                                        }
                                    />
                                </Field>
                                <Field label="Min width">
                                    <NumberInput
                                        value={breakpoint.minPx}
                                        step={16}
                                        min={240}
                                        suffix="px"
                                        onChange={(minPx) =>
                                            patch((draft) => {
                                                draft.layout.breakpoints[index]!.minPx = minPx
                                                draft.layout.breakpoints.sort((a, b) => a.minPx - b.minPx)
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="mt-2">
                                <Field label="What changes here">
                                    <TextInput
                                        value={breakpoint.note}
                                        onChange={(note) =>
                                            patch((draft) => void (draft.layout.breakpoints[index]!.note = note))
                                        }
                                    />
                                </Field>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewWidth(breakpoint.minPx)}
                                className={`mt-2 rounded border px-2 py-1 text-[11px] ${
                                    previewWidth === breakpoint.minPx
                                        ? "border-[var(--app-ink)] bg-[var(--app-ink)] text-white"
                                        : "border-[var(--app-border)]"
                                }`}
                            >
                                Preview at {breakpoint.minPx}px
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() =>
                        patch((draft) => {
                            draft.layout.breakpoints = [
                                ...draft.layout.breakpoints,
                                { name: "new", minPx: 1440, note: "" },
                            ].sort((a, b) => a.minPx - b.minPx)
                        })
                    }
                    className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
                >
                    + breakpoint
                </button>
            </Section>

            <Section
                title="Containers"
                hint="Max-widths, named for the job. Nothing spans the viewport. `prose` is the one people skip — running text at laptop width is unreadable however good the type is."
            >
                <div className="grid gap-2">
                    {containers.map((container, index) => (
                        <div key={container.name} className="rounded-md border border-[var(--app-border)] bg-white p-2">
                            <div className="mb-2 flex items-center gap-2">
                                <code className="font-mono text-[11px]">--container-{container.name}</code>
                                <span className="text-[11px] text-[var(--app-ink-soft)]">
                                    {container.maxRem * 16}px
                                </span>
                                <button
                                    type="button"
                                    title="Remove"
                                    onClick={() =>
                                        patch(
                                            (draft) =>
                                                void (draft.layout.containers = draft.layout.containers.filter(
                                                    (_, i) => i !== index,
                                                )),
                                        )
                                    }
                                    className="ml-auto px-1 text-xs text-[var(--app-ink-soft)]"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Name">
                                    <TextInput
                                        mono
                                        value={container.name}
                                        onChange={(name) =>
                                            patch((draft) => void (draft.layout.containers[index]!.name = name))
                                        }
                                    />
                                </Field>
                                <Field label="Max width">
                                    <NumberInput
                                        value={container.maxRem}
                                        step={1}
                                        min={10}
                                        suffix="rem"
                                        onChange={(maxRem) =>
                                            patch((draft) => void (draft.layout.containers[index]!.maxRem = maxRem))
                                        }
                                    />
                                </Field>
                            </div>
                            <div className="mt-2">
                                <Field label="Use it for">
                                    <TextInput
                                        value={container.note}
                                        onChange={(note) =>
                                            patch((draft) => void (draft.layout.containers[index]!.note = note))
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() =>
                        patch((draft) => {
                            draft.layout.containers = [
                                ...draft.layout.containers,
                                { name: "new", maxRem: 60, note: "" },
                            ]
                        })
                    }
                    className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
                >
                    + container
                </button>
            </Section>
        </div>
    )
}
