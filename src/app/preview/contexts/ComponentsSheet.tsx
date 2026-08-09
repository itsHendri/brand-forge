/**
 * The densest context: every surface, state and status on one page.
 * If a token is broken it shows up here first.
 */

import {
    Alert,
    Badge,
    Button,
    Card,
    Field,
    Grid,
    Page,
    Row,
    Section,
    STATUSES,
    typeRole,
} from "../kit"

const TYPE_SAMPLES = [
    ["display", "Design systems, made legible"],
    ["heading-lg", "Design systems, made legible"],
    ["heading", "Design systems, made legible"],
    ["heading-sm", "Design systems, made legible"],
    ["body-lg", "The quick brown fox jumps over the lazy dog."],
    ["body", "The quick brown fox jumps over the lazy dog."],
    ["body-sm", "The quick brown fox jumps over the lazy dog."],
    ["label", "Section label"],
] as const

export function ComponentsSheet() {
    return (
        <Page>
            <header style={{ marginBottom: "var(--space-12)" }}>
                <h1 style={{ ...typeRole("heading-lg"), margin: "0 0 var(--space-2)", textWrap: "balance" }}>
                    Components
                </h1>
                <p
                    style={{
                        ...typeRole("body-lg"),
                        color: "var(--foreground-secondary)",
                        maxWidth: "var(--container-prose)",
                        margin: 0,
                        textWrap: "pretty",
                    }}
                >
                    Every surface, state and status the system defines — rendered from the same
                    declarations the export writes.
                </p>
            </header>

            <Section
                title="Buttons"
                lead="Interaction moves a fill away from its label, so contrast improves as you hover rather than collapsing."
            >
                <Row>
                    <Button>Primary</Button>
                    <Button state="hover">Primary · hover</Button>
                    <Button state="active">Primary · active</Button>
                    <Button tone="secondary">Secondary</Button>
                    <Button tone="outline">Outline</Button>
                    <Button tone="ghost" state="hover">
                        Ghost · hover
                    </Button>
                    <Button tone="danger">Delete</Button>
                    <Button tone="danger" state="hover">
                        Delete · hover
                    </Button>
                    <Button state="disabled">Disabled</Button>
                    <Button state="focus">Focused</Button>
                </Row>
            </Section>

            <Section
                title="Badges"
                lead="Subtle by default — a badge names something, it doesn't act. Neutral uses muted rather than a status colour."
            >
                <Row>
                    <Badge>Primary</Badge>
                    <Badge tone="neutral">Off</Badge>
                    {STATUSES.map((status) => (
                        <Badge key={status} tone={status}>
                            {status}
                        </Badge>
                    ))}
                </Row>
            </Section>

            <Section
                title="Form"
                lead="Fields are transparent, not surface-filled: they sit inside cards as often as on the page. Inside a padded card the concentric rule squares their corners."
            >
                <Card style={{ display: "grid", gap: "var(--space-4)", maxWidth: "var(--container-narrow)" }}>
                    <Field
                        label="Email"
                        value="hendri@hendri.design"
                        help="We only use this to send the build report."
                    />
                    <Field label="Project" placeholder="Placeholder text" />
                    <Row>
                        <Button>Save</Button>
                        <Button tone="outline">Cancel</Button>
                    </Row>
                </Card>
            </Section>

            <Section
                title="Status messages"
                lead="The solid fill is for things that act or plot. A message uses the subtle wash, its paired text, and its border."
            >
                <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {STATUSES.map((status) => (
                        <Alert key={status} tone={status}>
                            <Badge tone={status}>{status}</Badge>
                            The build finished in 42 seconds. Twelve routes were pre-rendered.
                        </Alert>
                    ))}
                </div>
            </Section>

            <Section title="Table">
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {/* A table is the most common thing to break a narrow screen. */}
                    <div style={{ overflowX: "auto" }} tabIndex={0}>
                        <table style={{ width: "100%", borderCollapse: "collapse", ...typeRole("body-sm") }}>
                            <thead>
                                <tr style={{ background: "var(--muted)" }}>
                                    {["Route", "Status", "Size"].map((heading) => (
                                        <th
                                            key={heading}
                                            style={{
                                                ...typeRole("label"),
                                                textAlign: "left",
                                                padding: "var(--space-3) var(--space-4)",
                                                color: "var(--muted-foreground)",
                                                borderBottom: "1px solid var(--border)",
                                                whiteSpace: "nowrap",
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
                                        <td
                                            style={{
                                                padding: "var(--space-3) var(--space-4)",
                                                fontFamily: "var(--font-mono)",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {row.route}
                                        </td>
                                        <td
                                            style={{
                                                padding: "var(--space-3) var(--space-4)",
                                                color: "var(--foreground-secondary)",
                                            }}
                                        >
                                            {row.status}
                                        </td>
                                        <td
                                            style={{
                                                padding: "var(--space-3) var(--space-4)",
                                                // Compared down a column, so tabular.
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
                </Card>
            </Section>

            <Section title="Type scale" lead="Roles, not sizes. The name is the API.">
                <Card style={{ display: "grid", gap: "var(--space-4)" }}>
                    {TYPE_SAMPLES.map(([role, sample]) => (
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
                                    ...typeRole(role),
                                    textTransform: role === "label" ? "uppercase" : "none",
                                    textWrap: "balance",
                                }}
                            >
                                {sample}
                            </div>
                        </div>
                    ))}
                </Card>
            </Section>

            <Section title="Text hierarchy" lead="Four levels, each verified against the surfaces it is allowed on.">
                <Card style={{ display: "grid", gap: "var(--space-3)" }}>
                    {[
                        ["foreground", "Body copy and headings — the default ink.", "var(--foreground)"],
                        [
                            "foreground-secondary",
                            "Supporting copy at body-lg or larger. The only one checked against raised surfaces.",
                            "var(--foreground-secondary)",
                        ],
                        [
                            "muted-foreground",
                            "Captions, helper text, metadata — small text, so more contrast.",
                            "var(--muted-foreground)",
                        ],
                        [
                            "foreground-tertiary",
                            "Placeholders and watermarks. Below the reading threshold on purpose.",
                            "var(--foreground-tertiary)",
                        ],
                    ].map(([name, copy, color]) => (
                        <div key={name}>
                            <code
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-code)",
                                    color: "var(--foreground-tertiary)",
                                }}
                            >
                                --{name}
                            </code>
                            <p style={{ ...typeRole("body"), color, margin: "var(--space-1) 0 0" }}>{copy}</p>
                        </div>
                    ))}
                </Card>
            </Section>

            <Section title="Radius" lead="One knob, four derived steps — and the concentric rule for anything flush inside.">
                <Grid min="140px">
                    {(["sm", "md", "lg", "xl"] as const).map((step) => (
                        <div key={step}>
                            <div
                                style={{
                                    height: "72px",
                                    background: "var(--muted)",
                                    border: "1px solid var(--border)",
                                    borderRadius: `var(--radius-${step})`,
                                }}
                            />
                            <code
                                style={{
                                    display: "block",
                                    marginTop: "var(--space-2)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-code)",
                                    color: "var(--muted-foreground)",
                                }}
                            >
                                --radius-{step}
                            </code>
                        </div>
                    ))}
                </Grid>
            </Section>
        </Page>
    )
}
