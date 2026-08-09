import { assetUrl } from "../persistence"
import { useStore } from "../store"
import { AssetUpload } from "./AssetUpload"
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
                title="Logo"
                hint="An SVG is stored inline so its ink can follow the foreground token and invert in dark mode. A raster file can't do that — it's stored as a file and used as-is."
            >
                {meta.logoSvg ? (
                    <div className="grid gap-2">
                        <div
                            className="flex h-16 items-center justify-center rounded-md border border-[var(--app-border)] bg-white p-2 [&_svg]:max-h-full [&_svg]:max-w-full"
                            dangerouslySetInnerHTML={{ __html: meta.logoSvg }}
                        />
                        <button
                            type="button"
                            onClick={() => patch((draft) => void (draft.meta.logoSvg = undefined))}
                            className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
                        >
                            Remove logo
                        </button>
                    </div>
                ) : meta.logoFile ? (
                    <div className="grid gap-2">
                        <img
                            src={assetUrl(meta.slug, meta.logoFile)}
                            alt=""
                            className="h-16 justify-self-start rounded-md border border-[var(--app-border)] bg-white object-contain p-2"
                        />
                        <button
                            type="button"
                            onClick={() => patch((draft) => void (draft.meta.logoFile = undefined))}
                            className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
                        >
                            Remove logo
                        </button>
                    </div>
                ) : (
                    <AssetUpload
                        accept=".svg,.png,.jpg,.jpeg,.webp"
                        label="+ upload logo"
                        onUploaded={async (fileName, file) => {
                            if (file.type === "image/svg+xml" || fileName.endsWith(".svg")) {
                                const svg = await file.text()
                                patch((draft) => {
                                    draft.meta.logoSvg = svg
                                    draft.meta.logoFile = undefined
                                })
                            } else {
                                patch((draft) => {
                                    draft.meta.logoFile = fileName
                                    draft.meta.logoSvg = undefined
                                })
                            }
                        }}
                    />
                )}
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
