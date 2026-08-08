import { useStore } from "../store"
import { Field, Section, StringList, TextInput } from "./controls"

/**
 * Identity and intent. `voice` and `deviations` are not decoration — both are
 * written straight into the exported docs, and the deviations list is where a
 * human adds the traps that can't be computed.
 */
export function BrandPanel() {
    const { config, patch } = useStore()
    const { meta } = config

    return (
        <div className="grid gap-5">
            <Section title="Identity">
                <Field label="Name">
                    <TextInput value={meta.name} onChange={(name) => patch((draft) => void (draft.meta.name = name))} />
                </Field>
                <Field
                    label="Slug"
                    hint="Keys brands/<slug>.json, exports/<slug>/ and the exported skill name."
                >
                    <TextInput
                        mono
                        value={meta.slug}
                        onChange={(slug) =>
                            patch((draft) => void (draft.meta.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-")))
                        }
                    />
                </Field>
                <Field label="Domain">
                    <TextInput
                        value={meta.domain ?? ""}
                        placeholder="example.com"
                        onChange={(domain) => patch((draft) => void (draft.meta.domain = domain))}
                    />
                </Field>
            </Section>

            <Section
                title="Voice"
                hint="Adjectives. These open the exported docs, so an agent writing copy has a tone to aim at."
            >
                <StringList
                    values={meta.voice}
                    placeholder="adjective"
                    onChange={(voice) => patch((draft) => void (draft.meta.voice = voice))}
                />
            </Section>

            <Section
                title="Deviations"
                hint="Traps a machine can't infer. These are merged with the computed ones at the top of DESIGN_SYSTEM.md — the section an agent reads first."
            >
                <StringList
                    multiline
                    values={meta.deviations}
                    placeholder="note"
                    onChange={(deviations) => patch((draft) => void (draft.meta.deviations = deviations))}
                />
            </Section>
        </div>
    )
}
