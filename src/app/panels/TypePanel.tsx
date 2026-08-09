import { useStore } from "../store"
import { AssetUpload } from "./AssetUpload"
import { Field, NumberInput, Section, StringList, TextInput } from "./controls"

/**
 * Roles, not sizes. The role name is the API — `--text-body`, not `--text-16` —
 * so a page keeps meaning after someone decides body should be 17px.
 */
export function TypePanel() {
    const { config, patch } = useStore()
    const { families, roles, fontLinks, fontFiles } = config.typography

    return (
        <div className="grid gap-5">
            <Section
                title="Families"
                hint="CSS stacks. v1 does not manage font files — add a <link> below if the face needs loading."
            >
                <Field label="Sans">
                    <TextInput
                        mono
                        value={families.sans}
                        onChange={(sans) => patch((draft) => void (draft.typography.families.sans = sans))}
                    />
                </Field>
                <Field label="Mono">
                    <TextInput
                        mono
                        value={families.mono}
                        onChange={(mono) => patch((draft) => void (draft.typography.families.mono = mono))}
                    />
                </Field>
                <Field label="Serif" hint="Optional. Only emitted when set.">
                    <TextInput
                        mono
                        value={families.serif ?? ""}
                        onChange={(serif) =>
                            patch((draft) => void (draft.typography.families.serif = serif || undefined))
                        }
                    />
                </Field>
            </Section>

            <Section
                title="Font files"
                hint="One entry per weight and style — that's how @font-face works. Uploaded files become @font-face rules in the preview and travel with the export, so the brand carries its typeface rather than pointing at someone else's server."
            >
                <div className="grid gap-1">
                    {(fontFiles ?? []).map((font, index) => (
                        <div
                            key={font.fileName}
                            className="grid gap-2 rounded-md border border-[var(--app-border)] bg-white p-2"
                        >
                            <div className="flex items-center gap-2">
                                <code className="min-w-0 flex-1 truncate font-mono text-[11px]">
                                    {font.fileName}
                                </code>
                                <button
                                    type="button"
                                    title="Remove"
                                    onClick={() =>
                                        patch(
                                            (draft) =>
                                                void (draft.typography.fontFiles =
                                                    draft.typography.fontFiles?.filter((_, i) => i !== index)),
                                        )
                                    }
                                    className="px-1 text-xs text-[var(--app-ink-soft)]"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <Field label="Family">
                                    <select
                                        value={font.family}
                                        onChange={(event) =>
                                            patch(
                                                (draft) =>
                                                    void (draft.typography.fontFiles![index]!.family = event.target
                                                        .value as typeof font.family),
                                            )
                                        }
                                        className="w-full rounded-md border border-[var(--app-border)] bg-white px-1 py-1.5 text-xs"
                                    >
                                        <option value="sans">sans</option>
                                        <option value="serif">serif</option>
                                        <option value="mono">mono</option>
                                    </select>
                                </Field>
                                <Field label="Weight">
                                    <NumberInput
                                        value={font.weight}
                                        step={100}
                                        min={100}
                                        max={900}
                                        onChange={(weight) =>
                                            patch(
                                                (draft) =>
                                                    void (draft.typography.fontFiles![index]!.weight = weight),
                                            )
                                        }
                                    />
                                </Field>
                                <Field label="Style">
                                    <select
                                        value={font.style}
                                        onChange={(event) =>
                                            patch(
                                                (draft) =>
                                                    void (draft.typography.fontFiles![index]!.style = event.target
                                                        .value as typeof font.style),
                                            )
                                        }
                                        className="w-full rounded-md border border-[var(--app-border)] bg-white px-1 py-1.5 text-xs"
                                    >
                                        <option value="normal">normal</option>
                                        <option value="italic">italic</option>
                                    </select>
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
                <AssetUpload
                    accept=".woff2,.woff,.ttf,.otf"
                    label="+ upload font file"
                    onUploaded={(fileName) =>
                        patch((draft) => {
                            draft.typography.fontFiles = [
                                ...(draft.typography.fontFiles ?? []),
                                // Guessed from the name, then corrected by hand —
                                // faster than making someone fill three fields first.
                                {
                                    fileName,
                                    family: /mono/i.test(fileName) ? "mono" : /serif/i.test(fileName) ? "serif" : "sans",
                                    weight: /(\d{3})/.exec(fileName) ? Number(/(\d{3})/.exec(fileName)![1]) : 400,
                                    style: /italic/i.test(fileName) ? "italic" : "normal",
                                },
                            ]
                        })
                    }
                />
            </Section>

            <Section
                title="Hosted font links"
                hint="Stylesheet URLs for faces you don't host. Listed in the docs so a build knows what to load."
            >
                <StringList
                    values={fontLinks ?? []}
                    placeholder="href"
                    onChange={(links) => patch((draft) => void (draft.typography.fontLinks = links))}
                />
            </Section>

            <Section title="Roles">
                <div className="grid gap-3">
                    {roles.map((role, index) => (
                        <div key={role.role} className="rounded-md border border-[var(--app-border)] bg-white p-2">
                            <div className="mb-2 flex items-baseline justify-between">
                                <code className="font-mono text-[11px]">--text-{role.role}</code>
                                <span className="text-[11px] text-[var(--app-ink-soft)]">{role.family}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Size (rem)">
                                    <NumberInput
                                        value={role.sizeRem}
                                        step={0.0625}
                                        min={0.5}
                                        onChange={(sizeRem) =>
                                            patch((draft) => void (draft.typography.roles[index]!.sizeRem = sizeRem))
                                        }
                                    />
                                </Field>
                                <Field label="Line height">
                                    <NumberInput
                                        value={role.lineHeight}
                                        step={0.05}
                                        min={0.8}
                                        onChange={(lineHeight) =>
                                            patch((draft) => void (draft.typography.roles[index]!.lineHeight = lineHeight))
                                        }
                                    />
                                </Field>
                                <Field label="Weight">
                                    <NumberInput
                                        value={role.weight}
                                        step={50}
                                        min={100}
                                        max={900}
                                        onChange={(weight) =>
                                            patch((draft) => void (draft.typography.roles[index]!.weight = weight))
                                        }
                                    />
                                </Field>
                                <Field label="Tracking">
                                    <TextInput
                                        mono
                                        value={role.tracking ?? ""}
                                        placeholder="-0.02em"
                                        onChange={(tracking) =>
                                            patch(
                                                (draft) =>
                                                    void (draft.typography.roles[index]!.tracking = tracking || undefined),
                                            )
                                        }
                                    />
                                </Field>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    )
}
