import type { ReactNode } from "react"

/** Shared chrome for the editing panels. Deliberately plain — the canvas is the design. */

export function Field({
    label,
    hint,
    children,
}: {
    label: string
    hint?: string
    children: ReactNode
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs text-[var(--app-ink-soft)]">{label}</span>
            {children}
            {hint && <span className="text-[11px] leading-snug text-[var(--app-ink-soft)]">{hint}</span>}
        </label>
    )
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <section className="grid gap-2">
            <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--app-ink-soft)]">
                {title}
            </h3>
            {hint && <p className="text-[11px] leading-relaxed text-[var(--app-ink-soft)]">{hint}</p>}
            {children}
        </section>
    )
}

const inputClass =
    "w-full rounded-md border border-[var(--app-border)] bg-white px-2 py-1.5 text-sm outline-none focus:border-[var(--app-ink-soft)]"

export function TextInput({
    value,
    onChange,
    mono,
    placeholder,
}: {
    value: string
    onChange: (value: string) => void
    mono?: boolean
    placeholder?: string
}) {
    return (
        <input
            value={value}
            placeholder={placeholder}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            className={`${inputClass} ${mono ? "font-mono text-xs" : ""}`}
        />
    )
}

export function NumberInput({
    value,
    onChange,
    step = 1,
    min,
    max,
    suffix,
}: {
    value: number
    onChange: (value: number) => void
    step?: number
    min?: number
    max?: number
    suffix?: string
}) {
    return (
        <span className="flex items-center gap-1">
            <input
                type="number"
                value={value}
                step={step}
                min={min}
                max={max}
                onChange={(event) => {
                    const next = Number(event.target.value)
                    if (!Number.isNaN(next)) onChange(next)
                }}
                className={`${inputClass} font-mono text-xs`}
            />
            {suffix && <span className="text-[11px] text-[var(--app-ink-soft)]">{suffix}</span>}
        </span>
    )
}

export function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean
    onChange: (checked: boolean) => void
    label: string
    description: string
}) {
    return (
        <label className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-white">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="mt-0.5 shrink-0"
            />
            <span className="min-w-0">
                <span className="block text-xs font-medium">{label}</span>
                <span className="block text-[11px] leading-snug text-[var(--app-ink-soft)]">
                    {description}
                </span>
            </span>
        </label>
    )
}

/** An editable list of short strings — voice adjectives, deviation notes, font links. */
export function StringList({
    values,
    onChange,
    placeholder,
    multiline,
}: {
    values: string[]
    onChange: (values: string[]) => void
    placeholder: string
    multiline?: boolean
}) {
    const update = (index: number, next: string) =>
        onChange(values.map((value, i) => (i === index ? next : value)))

    return (
        <div className="grid gap-1">
            {values.map((value, index) => (
                <div key={index} className="flex items-start gap-1">
                    {multiline ? (
                        <textarea
                            value={value}
                            rows={2}
                            onChange={(event) => update(index, event.target.value)}
                            className={`${inputClass} resize-y text-xs`}
                        />
                    ) : (
                        <input
                            value={value}
                            onChange={(event) => update(index, event.target.value)}
                            className={`${inputClass} text-xs`}
                        />
                    )}
                    <button
                        type="button"
                        title="Remove"
                        onClick={() => onChange(values.filter((_, i) => i !== index))}
                        className="mt-1 shrink-0 px-1 text-xs text-[var(--app-ink-soft)]"
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...values, ""])}
                className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
            >
                + {placeholder}
            </button>
        </div>
    )
}
