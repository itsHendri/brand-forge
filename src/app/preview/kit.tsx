/**
 * The preview's own component kit.
 *
 * Every context builds from these, and each one is the exported recipe rendered
 * literally — so if a recipe is wrong, it is wrong on the canvas too. That is
 * the point: the preview is the first consumer of the documentation.
 *
 * Tokens only. `npm run lint:preview-colors` fails on a literal in this folder.
 */

import type { CSSProperties, ReactNode } from "react"

export const STATUSES = ["success", "warning", "danger", "info"] as const
export type Status = (typeof STATUSES)[number]

/** Applying a type role — four properties, never the `font` shorthand. */
export const typeRole = (role: string): CSSProperties => ({
    fontSize: `var(--text-${role})`,
    lineHeight: `var(--text-${role}--line-height)`,
    fontWeight: `var(--text-${role}--font-weight)` as unknown as number,
    letterSpacing: `var(--text-${role}--letter-spacing)`,
})

export function Page({ children, container = "page" }: { children: ReactNode; container?: string }) {
    return (
        <div
            style={{
                maxWidth: `var(--container-${container})`,
                marginInline: "auto",
                padding: "var(--space-12) var(--space-6)",
            }}
        >
            {children}
        </div>
    )
}

export function Section({
    title,
    lead,
    children,
}: {
    title: string
    lead?: string
    children: ReactNode
}) {
    return (
        <section style={{ marginBottom: "var(--space-12)" }}>
            <h2
                style={{
                    ...typeRole("label"),
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
                    margin: "0 0 var(--space-3)",
                }}
            >
                {title}
            </h2>
            {lead && (
                <p
                    style={{
                        ...typeRole("body-sm"),
                        color: "var(--foreground-secondary)",
                        maxWidth: "var(--container-prose)",
                        margin: "0 0 var(--space-4)",
                        textWrap: "pretty",
                    }}
                >
                    {lead}
                </p>
            )}
            {children}
        </section>
    )
}

/** Card recipe: border, no shadow. Elevation is for things that float. */
export function Card({
    children,
    style,
    raised,
}: {
    children: ReactNode
    style?: CSSProperties
    raised?: boolean
}) {
    return (
        <div
            style={{
                background: raised ? "var(--surface-raised)" : "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-6)",
                ...(raised
                    ? { boxShadow: "var(--shadow-lg)" }
                    : { border: "1px solid var(--border)" }),
                ...style,
            }}
        >
            {children}
        </div>
    )
}

/**
 * `inverse` is for a control sitting ON a brand field, where the surrounding
 * text is already `--primary-foreground`. The plain `outline` tone assumes a
 * neutral ground — it hardcodes `--foreground`, which on an indigo band is dark
 * ink on dark blue. The system has no "on a brand field" role, so this composes
 * one from the pair that already governs that context.
 */
type ButtonTone = "primary" | "secondary" | "outline" | "ghost" | "inverse" | Status
type ButtonState = "rest" | "hover" | "active" | "disabled" | "focus"

const FILLED: Record<string, true> = {
    primary: true,
    secondary: true,
    success: true,
    warning: true,
    danger: true,
    info: true,
}

export function Button({
    children,
    tone = "primary",
    state = "rest",
}: {
    children: ReactNode
    tone?: ButtonTone
    state?: ButtonState
}) {
    const filled = FILLED[tone]
    const suffix = state === "hover" ? "-hover" : state === "active" ? "-active" : ""

    const palette: CSSProperties = filled
        ? { background: `var(--${tone}${suffix})`, color: `var(--${tone}-foreground)` }
        : tone === "inverse"
          ? {
                background: "transparent",
                color: "var(--primary-foreground)",
                border: "1px solid var(--primary-foreground)",
            }
          : tone === "outline"
          ? {
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--input)",
            }
          : {
                background: state === "rest" ? "transparent" : `var(--state${suffix || "-hover"})`,
                color: "var(--foreground)",
            }

    return (
        <button
            type="button"
            disabled={state === "disabled"}
            style={{
                ...typeRole("label"),
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                height: "40px",
                padding: "0 var(--space-4)",
                borderRadius: "var(--radius-md)",
                border: "1px solid transparent",
                cursor: state === "disabled" ? "not-allowed" : "pointer",
                // Exits are quicker than entrances: the base rule times the exit.
                transition: "background-color var(--duration-fast) var(--ease-out)",
                ...palette,
                ...(state === "disabled"
                    ? { background: "var(--state-disabled)", color: "var(--foreground-tertiary)" }
                    : {}),
                ...(state === "focus"
                    ? { outline: "2px solid var(--ring)", outlineOffset: "2px" }
                    : {}),
            }}
        >
            {children}
        </button>
    )
}

export function Badge({ children, tone = "primary" }: { children: ReactNode; tone?: ButtonTone | "neutral" }) {
    const neutral = tone === "neutral"
    return (
        <span
            style={{
                ...typeRole("label"),
                display: "inline-block",
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-sm)",
                background: neutral ? "var(--muted)" : `var(--${tone}-subtle)`,
                color: neutral ? "var(--muted-foreground)" : `var(--${tone}-subtle-foreground)`,
            }}
        >
            {children}
        </span>
    )
}

export function Alert({ tone, children }: { tone: Status; children: ReactNode }) {
    return (
        <div
            style={{
                ...typeRole("body-sm"),
                background: `var(--${tone}-subtle)`,
                color: `var(--${tone}-subtle-foreground)`,
                border: `1px solid var(--${tone}-border)`,
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
            }}
        >
            {children}
        </div>
    )
}

export function Field({
    label,
    value,
    placeholder,
    help,
}: {
    label: string
    value?: string
    placeholder?: string
    help?: string
}) {
    return (
        <label style={{ display: "grid", gap: "var(--space-2)" }}>
            <span style={{ ...typeRole("label") }}>{label}</span>
            <input
                defaultValue={value}
                placeholder={placeholder}
                style={{
                    ...typeRole("body"),
                    fontFamily: "inherit",
                    height: "40px",
                    padding: "0 var(--space-3)",
                    color: "var(--foreground)",
                    background: "transparent",
                    border: "1px solid var(--input)",
                    // Inside a padded card the concentric rule squares this off.
                    borderRadius: "0",
                }}
            />
            {help && (
                <span style={{ ...typeRole("body-sm"), color: "var(--muted-foreground)" }}>{help}</span>
            )}
        </label>
    )
}

export const Row = ({ children }: { children: ReactNode }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
        {children}
    </div>
)

/** auto-fit so pinning the canvas to a breakpoint reflows rather than crops. */
export const Grid = ({ min = "220px", children }: { min?: string; children: ReactNode }) => (
    <div
        style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))`,
            gap: "var(--space-4)",
        }}
    >
        {children}
    </div>
)
