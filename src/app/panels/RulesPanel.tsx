import { POLISH_RULES } from "../../engine/defaults"
import { useStore } from "../store"
import { Section, Toggle } from "./controls"

/**
 * The universal craft layer. These aren't brand decisions — they hold for any
 * system — but they only reach anyone if they ship inside the skill, so each
 * enabled rule is written into SKILL.md with this brand's actual values.
 */
export function RulesPanel() {
    const { config, patch } = useStore()
    const polish = config.rules.polish
    const enabled = POLISH_RULES.filter((rule) => polish[rule.id]).length

    const setAll = (value: boolean) =>
        patch((draft) => {
            for (const rule of POLISH_RULES) draft.rules.polish[rule.id] = value
        })

    return (
        <div className="grid gap-4">
            <Section
                title="Craft rules"
                hint="Every rule left on becomes a numbered instruction in the exported SKILL.md. Turning one off doesn't make it false — it just stops the agent being told."
            >
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--app-ink-soft)]">
                        {enabled} of {POLISH_RULES.length} shipping
                    </span>
                    <button
                        type="button"
                        onClick={() => setAll(true)}
                        className="ml-auto rounded border border-[var(--app-border)] px-2 py-1 text-[11px]"
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setAll(false)}
                        className="rounded border border-[var(--app-border)] px-2 py-1 text-[11px]"
                    >
                        None
                    </button>
                </div>

                <div className="grid gap-0.5">
                    {POLISH_RULES.map((rule) => (
                        <Toggle
                            key={rule.id}
                            checked={Boolean(polish[rule.id])}
                            onChange={(checked) => patch((draft) => void (draft.rules.polish[rule.id] = checked))}
                            label={rule.title}
                            description={rule.rule}
                        />
                    ))}
                </div>
            </Section>
        </div>
    )
}
