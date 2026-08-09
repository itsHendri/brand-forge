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

export function ComponentsSheet({ secondaryAnchor }: { secondaryAnchor: number }) {
    // The step the secondary seed landed on verbatim — the brand colour as typed,
    // which is not always the same thing as the fill the system can put a label on.
    const anchorFill = `var(--secondary-${secondaryAnchor})`

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

            <Section
                title="Interactive states"
                lead="The four state tokens are translucent washes, so one of each covers every surface. Layer them over the surface an element already has — a mid grey darkens a light ground and lightens a dark one, so it always moves away from whatever it lands on."
            >
                <Grid min="200px">
                    {(
                        [
                            ["background", "var(--background)"],
                            ["surface", "var(--surface)"],
                            ["surface-raised", "var(--surface-raised)"],
                            ["muted", "var(--muted)"],
                        ] as const
                    ).map(([name, surface]) => (
                        <div
                            key={name}
                            style={{
                                background: surface,
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                overflow: "hidden",
                            }}
                        >
                            <code
                                style={{
                                    display: "block",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-code)",
                                    color: "var(--muted-foreground)",
                                    padding: "var(--space-2) var(--space-3)",
                                }}
                            >
                                on --{name}
                            </code>
                            {(
                                [
                                    ["rest", "transparent"],
                                    ["hover", "var(--state-hover)"],
                                    ["active", "var(--state-active)"],
                                    ["selected", "var(--state-selected)"],
                                ] as const
                            ).map(([label, wash]) => (
                                <div
                                    key={label}
                                    style={{
                                        ...typeRole("body-sm"),
                                        background: wash,
                                        color: "var(--foreground)",
                                        padding: "var(--space-2) var(--space-3)",
                                    }}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    ))}
                </Grid>
                <p
                    style={{
                        ...typeRole("body-sm"),
                        color: "var(--muted-foreground)",
                        margin: "var(--space-3) 0 0",
                        maxWidth: "var(--container-prose)",
                    }}
                >
                    The --muted column is the one that used to fail: the old --state-hover was the same
                    opaque step as --muted, so a hovered row there was identical to a resting one.
                </p>
            </Section>

            <Section
                title="Links"
                lead="A link is body text, so it is measured as body text. --primary is a fill colour and fails here — in dark mode it lands at Lc −28.7."
            >
                <Card>
                    <p style={{ ...typeRole("body"), margin: 0, maxWidth: "var(--container-prose)" }}>
                        Every colour in this system is generated from a seed and{" "}
                        <a
                            href="#"
                            onClick={(event) => event.preventDefault()}
                            style={{
                                color: "var(--link)",
                                textDecoration: "underline",
                                textUnderlineOffset: "0.2em",
                            }}
                        >
                            checked against the surface it actually sits on
                        </a>
                        , rather than picked from a step number. The hover state{" "}
                        <a
                            href="#"
                            onClick={(event) => event.preventDefault()}
                            style={{
                                color: "var(--link-hover)",
                                textDecoration: "underline",
                                textUnderlineOffset: "0.2em",
                            }}
                        >
                            gains contrast
                        </a>{" "}
                        rather than losing it.
                    </p>
                    <p
                        style={{
                            ...typeRole("body-sm"),
                            color: "var(--muted-foreground)",
                            margin: "var(--space-4) 0 0",
                            maxWidth: "var(--container-prose)",
                        }}
                    >
                        The underline is not decoration. --link sits at the same lightness as
                        --foreground and is told apart by hue alone, which disappears in greyscale — so
                        colour on its own does not mark a link here.
                    </p>
                </Card>
            </Section>

            <Section
                title="Inverse regions"
                lead="Opposite to the current mode, not a fixed dark: on a dark page an inverted chip is light."
            >
                <div
                    style={{
                        background: "var(--inverse)",
                        color: "var(--inverse-foreground)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-6)",
                        maxWidth: "var(--container-prose)",
                    }}
                >
                    <p style={{ ...typeRole("body"), margin: 0 }}>
                        A tooltip, a dark chip, a footer band. Text takes --inverse-foreground, and a{" "}
                        <a
                            href="#"
                            onClick={(event) => event.preventDefault()}
                            style={{
                                color: "var(--link-inverse)",
                                textDecoration: "underline",
                                textUnderlineOffset: "0.2em",
                            }}
                        >
                            link takes --link-inverse
                        </a>{" "}
                        — the page-measured --link is unreadable in here.
                    </p>
                    <hr
                        style={{
                            border: 0,
                            borderTop: "1px solid var(--inverse-border)",
                            margin: "var(--space-4) 0",
                        }}
                    />
                    <p style={{ ...typeRole("body-sm"), margin: 0 }}>
                        The divider above is --inverse-border.
                    </p>
                </div>
            </Section>

            <Section
                title="Focus"
                lead="--ring is the brand colour, so on a brand fill it is invisible. That shipped once; these are the two tokens that fix it."
            >
                <Row>
                    <button
                        type="button"
                        style={{
                            ...typeRole("label"),
                            background: "var(--surface)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                            outline: "2px solid var(--ring)",
                            outlineOffset: "2px",
                        }}
                    >
                        --ring on a neutral ground
                    </button>
                    <button
                        type="button"
                        style={{
                            ...typeRole("label"),
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            border: 0,
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                            outline: "2px solid var(--ring)",
                            outlineOffset: "2px",
                        }}
                    >
                        --ring on a brand fill
                    </button>
                    <button
                        type="button"
                        style={{
                            ...typeRole("label"),
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            border: 0,
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                            outline: "2px solid var(--ring-inverse)",
                            outlineOffset: "2px",
                        }}
                    >
                        --ring-inverse on a brand fill
                    </button>
                    <button
                        type="button"
                        style={{
                            ...typeRole("label"),
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            border: 0,
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                            // The pair: one hairline always contrasts, whichever
                            // ground the control turns out to be sitting on.
                            boxShadow: "0 0 0 2px var(--ring-inset), 0 0 0 4px var(--ring)",
                        }}
                    >
                        --ring + --ring-inset
                    </button>
                </Row>
            </Section>

            <Section
                title="When a fill can't carry a label"
                lead="A mid-lightness accent is the classic case: neither white nor near-black clears the bar on it. The system steps the fill darker so it can hold a label, and keeps the seed exactly where you typed it."
            >
                <Row>
                    <div
                        style={{
                            ...typeRole("label"),
                            background: anchorFill,
                            color: "var(--neutral-950)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                        }}
                    >
                        the seed, dark label
                    </div>
                    <div
                        style={{
                            ...typeRole("label"),
                            background: anchorFill,
                            color: "var(--neutral-50)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                        }}
                    >
                        the seed, light label
                    </div>
                    <div
                        style={{
                            ...typeRole("label"),
                            background: "var(--secondary)",
                            color: "var(--secondary-foreground)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                        }}
                    >
                        --secondary (what ships)
                    </div>
                </Row>
                <p
                    style={{
                        ...typeRole("body-sm"),
                        color: "var(--muted-foreground)",
                        margin: "var(--space-3) 0 0",
                        maxWidth: "var(--container-prose)",
                    }}
                >
                    The first two are the seed verbatim. Whichever of them you can read, the third is what
                    the system chose — and the seed itself is still in the ramp, which is what the mark
                    points at.
                </p>
            </Section>

            <Section
                title="Loading and overlay"
                lead="Skeletons, the scrim, and the only two opacities the system blesses."
            >
                <Grid min="260px">
                    <Card>
                        <div
                            style={{
                                background: "var(--skeleton-surface)",
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-4)",
                                display: "grid",
                                gap: "var(--space-3)",
                            }}
                        >
                            {["60%", "100%", "85%"].map((width) => (
                                <div
                                    key={width}
                                    style={{
                                        background: "var(--skeleton)",
                                        borderRadius: "var(--radius-sm)",
                                        height: "var(--space-3)",
                                        width,
                                    }}
                                />
                            ))}
                        </div>
                        <p
                            style={{
                                ...typeRole("body-sm"),
                                color: "var(--muted-foreground)",
                                margin: "var(--space-3) 0 0",
                            }}
                        >
                            --skeleton blocks on --skeleton-surface.
                        </p>
                    </Card>

                    <div
                        style={{
                            position: "relative",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            border: "1px solid var(--border)",
                            minHeight: "var(--space-24)",
                        }}
                    >
                        <div style={{ background: "var(--surface)", padding: "var(--space-4)" }}>
                            <p style={{ ...typeRole("body"), margin: 0 }}>Page content underneath.</p>
                            <p
                                style={{
                                    ...typeRole("body-sm"),
                                    color: "var(--muted-foreground)",
                                    margin: "var(--space-2) 0 0",
                                }}
                            >
                                Still legible through the scrim, which is the point of it.
                            </p>
                        </div>
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "var(--scrim)",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    ...typeRole("label"),
                                    background: "var(--surface-raised)",
                                    color: "var(--foreground)",
                                    boxShadow: "var(--shadow-overlay)",
                                    borderRadius: "var(--radius-md)",
                                    padding: "var(--space-3) var(--space-4)",
                                }}
                            >
                                A dialog over --scrim
                            </div>
                        </div>
                    </div>

                    <Card>
                        <Row>
                            <Button tone="primary">Enabled</Button>
                            <span style={{ opacity: "var(--opacity-disabled)" }}>
                                <Button tone="primary">Disabled</Button>
                            </span>
                        </Row>
                        <p
                            style={{
                                ...typeRole("body-sm"),
                                color: "var(--muted-foreground)",
                                margin: "var(--space-3) 0 0",
                            }}
                        >
                            --opacity-disabled. Never fade live text with it — opacity defeats the
                            contrast audit, because the result depends on a ground the system can't see.
                        </p>
                    </Card>
                </Grid>
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
