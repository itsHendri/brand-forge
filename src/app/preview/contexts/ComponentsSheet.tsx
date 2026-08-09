/**
 * The densest preview: every surface, every state, every status, on one page.
 * If a token is broken, it shows up here first.
 *
 * Only `var(--token)` values below — no literals. `npm run lint:preview-colors`
 * enforces it.
 */

import type { CSSProperties, ReactNode } from "react"

// Border, no shadow: the border is the structure, and --shadow-sm carries its own
// hairline layer, so both together double the edge. Matches the Card recipe.
const card: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-6)",
}

const buttonBase: CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-label)",
    lineHeight: "var(--text-label--line-height)",
    fontWeight: "var(--text-label--font-weight)" as unknown as number,
    letterSpacing: "var(--text-label--letter-spacing)",
    // Concentric-radius rule: inner radius = outer − padding, floored at 0.
    borderRadius: "var(--radius-md)",
    padding: "0 var(--space-4)",
    height: "40px",
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--space-2)",
    border: "1px solid transparent",
    cursor: "pointer",
    transition: "background-color var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out)",
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section style={{ marginBottom: "var(--space-12)" }}>
            <h2
                style={{
                    fontSize: "var(--text-label)",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--muted-foreground)",
                    margin: "0 0 var(--space-4)",
                }}
            >
                {title}
            </h2>
            {children}
        </section>
    )
}

const Row = ({ children }: { children: ReactNode }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
        {children}
    </div>
)

const STATUSES = ["success", "warning", "danger", "info"] as const

export function ComponentsSheet() {
    return (
        <div
            style={{
                padding: "var(--space-12) var(--space-6)",
                maxWidth: "var(--container-page)",
                marginInline: "auto",
            }}
        >
            <header style={{ marginBottom: "var(--space-12)" }}>
                <h1
                    style={{
                        fontSize: "var(--text-heading-lg)",
                        lineHeight: "var(--text-heading-lg--line-height)",
                        fontWeight: 600,
                        letterSpacing: "var(--text-heading-lg--letter-spacing)",
                        margin: "0 0 var(--space-2)",
                    }}
                >
                    Components
                </h1>
                <p
                    style={{
                        fontSize: "var(--text-body-lg)",
                        lineHeight: "var(--text-body-lg--line-height)",
                        color: "var(--foreground-secondary)",
                        // Running text stays at the readable measure even though
                        // the page frame around it is wider.
                        maxWidth: "var(--container-prose)",
                        margin: 0,
                        textWrap: "pretty",
                    }}
                >
                    Every surface, state and status the system defines — rendered from the same
                    declarations the export writes.
                </p>
            </header>

            <Section title="Buttons">
                <Row>
                    <button style={{ ...buttonBase, background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        Primary
                    </button>
                    <button style={{ ...buttonBase, background: "var(--primary-hover)", color: "var(--primary-foreground)" }}>
                        Primary · hover
                    </button>
                    <button style={{ ...buttonBase, background: "var(--primary-active)", color: "var(--primary-foreground)" }}>
                        Primary · active
                    </button>
                    <button style={{ ...buttonBase, background: "var(--secondary)", color: "var(--secondary-foreground)" }}>
                        Secondary
                    </button>
                    <button
                        style={{
                            ...buttonBase,
                            background: "transparent",
                            color: "var(--foreground)",
                            borderColor: "var(--input)",
                        }}
                    >
                        Outline
                    </button>
                    <button style={{ ...buttonBase, background: "var(--state-hover)", color: "var(--foreground)" }}>
                        Ghost · hover
                    </button>
                    <button style={{ ...buttonBase, background: "var(--danger)", color: "var(--danger-foreground)" }}>
                        Delete
                    </button>
                    <button
                        style={{
                            ...buttonBase,
                            background: "var(--state-disabled)",
                            color: "var(--foreground-tertiary)",
                            cursor: "not-allowed",
                        }}
                    >
                        Disabled
                    </button>
                    <button
                        style={{
                            ...buttonBase,
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            outline: "2px solid var(--ring)",
                            outlineOffset: "2px",
                        }}
                    >
                        Focused
                    </button>
                </Row>
            </Section>

            <Section title="Form">
                <div style={{ ...card, display: "grid", gap: "var(--space-4)", maxWidth: "440px" }}>
                    <label style={{ display: "grid", gap: "var(--space-2)" }}>
                        <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>Email</span>
                        <input
                            defaultValue="hendri@hendri.design"
                            style={{
                                height: "40px",
                                padding: "0 var(--space-3)",
                                fontFamily: "inherit",
                                fontSize: "var(--text-body)",
                                color: "var(--foreground)",
                                background: "var(--surface)",
                                border: "1px solid var(--input)",
                                // Concentric: card radius (lg) minus the card's padding is 0,
                                // so fields inside a padded card step down to md.
                                borderRadius: "var(--radius-md)",
                            }}
                        />
                        <span style={{ fontSize: "var(--text-body-sm)", color: "var(--muted-foreground)" }}>
                            We only use this to send the build report.
                        </span>
                    </label>
                    <label style={{ display: "grid", gap: "var(--space-2)" }}>
                        <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>Project</span>
                        <input
                            placeholder="Placeholder text"
                            style={{
                                height: "40px",
                                padding: "0 var(--space-3)",
                                fontFamily: "inherit",
                                fontSize: "var(--text-body)",
                                color: "var(--foreground)",
                                background: "var(--surface)",
                                border: "1px solid var(--border-strong)",
                                borderRadius: "var(--radius-md)",
                            }}
                        />
                    </label>
                </div>
            </Section>

            <Section title="Surfaces">
                {/* auto-fit reflows without a query, so pinning the canvas width
                    genuinely exercises the layout rather than just cropping it. */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "var(--space-4)",
                    }}
                >
                    {[
                        { name: "background", label: "Page", token: "var(--background)" },
                        { name: "surface", label: "Card", token: "var(--surface)" },
                        { name: "surface-raised", label: "Popover", token: "var(--surface-raised)" },
                    ].map((surface) => (
                        <div
                            key={surface.name}
                            style={{
                                background: surface.token,
                                // Raised surfaces float (shadow, no border); flat ones
                                // are structured (border, no shadow). Never both.
                                ...(surface.name === "surface-raised"
                                    ? { boxShadow: "var(--shadow-lg)", border: "none" }
                                    : { border: "1px solid var(--border)" }),
                                borderRadius: "var(--radius-lg)",
                                padding: "var(--space-6)",
                            }}
                        >
                            <div style={{ fontSize: "var(--text-heading-sm)", fontWeight: 600 }}>{surface.label}</div>
                            <code
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-code)",
                                    color: "var(--muted-foreground)",
                                }}
                            >
                                --{surface.name}
                            </code>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Status messages">
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {STATUSES.map((status) => (
                        <div
                            key={status}
                            style={{
                                background: `var(--${status}-subtle)`,
                                color: `var(--${status}-subtle-foreground)`,
                                border: `1px solid var(--${status}-border)`,
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-4)",
                                fontSize: "var(--text-body-sm)",
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                            }}
                        >
                            <span
                                style={{
                                    background: `var(--${status})`,
                                    color: `var(--${status}-foreground)`,
                                    borderRadius: "var(--radius-sm)",
                                    padding: "2px var(--space-2)",
                                    fontSize: "var(--text-label)",
                                    fontWeight: 500,
                                    textTransform: "capitalize",
                                }}
                            >
                                {status}
                            </span>
                            The build finished in 42 seconds. Twelve routes were pre-rendered.
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Table">
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-body-sm)" }}>
                        <thead>
                            <tr style={{ background: "var(--muted)" }}>
                                {["Route", "Status", "Size"].map((heading) => (
                                    <th
                                        key={heading}
                                        style={{
                                            textAlign: "left",
                                            padding: "var(--space-3) var(--space-4)",
                                            fontSize: "var(--text-label)",
                                            fontWeight: 500,
                                            color: "var(--muted-foreground)",
                                            borderBottom: "1px solid var(--border)",
                                        }}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { route: "/", status: "Static", size: "12.4 kB", state: "default" },
                                { route: "/work", status: "Static", size: "18.1 kB", state: "hover" },
                                { route: "/work/[slug]", status: "Dynamic", size: "9.8 kB", state: "selected" },
                            ].map((row) => (
                                <tr
                                    key={row.route}
                                    style={{
                                        background:
                                            row.state === "hover"
                                                ? "var(--state-hover)"
                                                : row.state === "selected"
                                                  ? "var(--state-selected)"
                                                  : "transparent",
                                        borderBottom: "1px solid var(--border-subtle)",
                                    }}
                                >
                                    <td style={{ padding: "var(--space-3) var(--space-4)", fontFamily: "var(--font-mono)" }}>
                                        {row.route}
                                    </td>
                                    <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--foreground-secondary)" }}>
                                        {row.status}
                                    </td>
                                    <td
                                        style={{
                                            padding: "var(--space-3) var(--space-4)",
                                            fontVariantNumeric: "tabular-nums",
                                            color: "var(--foreground-secondary)",
                                        }}
                                    >
                                        {row.size}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            <Section title="Type scale">
                <div style={{ ...card, display: "grid", gap: "var(--space-4)" }}>
                    {(
                        [
                            ["display", "Design systems, made legible"],
                            ["heading-lg", "Design systems, made legible"],
                            ["heading", "Design systems, made legible"],
                            ["heading-sm", "Design systems, made legible"],
                            ["body-lg", "The quick brown fox jumps over the lazy dog."],
                            ["body", "The quick brown fox jumps over the lazy dog."],
                            ["body-sm", "The quick brown fox jumps over the lazy dog."],
                            ["label", "Section label"],
                        ] as const
                    ).map(([role, sample]) => (
                        <div key={role} style={{ display: "flex", gap: "var(--space-4)", alignItems: "baseline" }}>
                            <code
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-code)",
                                    color: "var(--foreground-tertiary)",
                                    minWidth: "104px",
                                    flexShrink: 0,
                                }}
                            >
                                {role}
                            </code>
                            <div
                                style={{
                                    fontSize: `var(--text-${role})`,
                                    lineHeight: `var(--text-${role}--line-height)`,
                                    fontWeight: `var(--text-${role}--font-weight)` as unknown as number,
                                    letterSpacing: `var(--text-${role}--letter-spacing)`,
                                    textTransform: role === "label" ? "uppercase" : "none",
                                    textWrap: "balance",
                                }}
                            >
                                {sample}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    )
}
