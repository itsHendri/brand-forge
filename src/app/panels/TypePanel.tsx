import { useStore } from "../store"
import { Field, NumberInput, Section, StringList, TextInput } from "./controls"

/**
 * Roles, not sizes. The role name is the API — `--text-body`, not `--text-16` —
 * so a page keeps meaning after someone decides body should be 17px.
 */
export function TypePanel() {
    const { config, patch } = useStore()
    const { families, roles, fontLinks } = config.typography

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

            <Section title="Font links" hint="Stylesheet URLs, listed in the docs so a build knows what to load.">
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
