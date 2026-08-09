/**
 * Surfaces and elevation, given the room they need.
 *
 * The surface ladder is the part of a system people infer wrongly: four tokens
 * that look interchangeable in a table and are not. Shown nested — page holding
 * a card holding a raised panel — the relationship is obvious, and so is the
 * fact that light mode runs out of ladder and hands the job to shadow.
 */

import { Badge, Button, Card, Grid, Page, Row, Section, typeRole } from "../kit"

const SHADOWS = ["sm", "raised", "overlay"] as const

const label: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-code)",
    color: "var(--muted-foreground)",
}

export function SurfacesSheet() {
    return (
        <Page>
            <header style={{ marginBottom: "var(--space-12)" }}>
                <h1 style={{ ...typeRole("heading-lg"), margin: "0 0 var(--space-2)", textWrap: "balance" }}>
                    Surfaces & elevation
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
                    Four surfaces and four elevations. Switch to dark and watch which one carries
                    depth — the shadows become rings, and the ladder does the work instead.
                </p>
            </header>

            <Section
                title="The ladder, nested"
                lead="Each surface sits on the one below it. This is the arrangement they are designed for, and the only way to judge whether the steps are far enough apart."
            >
                <div
                    style={{
                        background: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-6)",
                    }}
                >
                    <code style={label}>--background · the page</code>
                    <div style={{ marginTop: "var(--space-4)" }}>
                        <Card>
                            <code style={label}>--surface · a card</code>
                            <div style={{ marginTop: "var(--space-4)" }}>
                                <Card raised>
                                    <code style={label}>--surface-raised · a popover</code>
                                    <div
                                        style={{
                                            marginTop: "var(--space-4)",
                                            background: "var(--muted)",
                                            borderRadius: "0",
                                            padding: "var(--space-4)",
                                        }}
                                    >
                                        <code style={label}>--muted · a quiet fill</code>
                                    </div>
                                </Card>
                            </div>
                        </Card>
                    </div>
                </div>
            </Section>

            <Section
                title="Side by side"
                lead="The whole ladder, flat. Each mode runs out of ramp at one end and it is the opposite end: light has nowhere brighter than surface, so raised and overlay share its fill and the shadow does the lifting; dark has nothing below background, so sunken shares that. --muted is not a level — it is a translucent wash, shown here over surface."
            >
                <Grid min="180px">
                    {[
                        ["surface-sunken", "Wells, kanban columns"],
                        ["background", "The page"],
                        ["surface", "Cards, panels"],
                        ["surface-raised", "Cards that lift"],
                        ["surface-overlay", "Modals, dropdowns"],
                        ["muted", "Quiet fills, table headers"],
                    ].map(([token, use]) => (
                        <div key={token}>
                            {/*
                              `muted` is translucent, so it is shown over
                              `surface` — on its own it would render as whatever
                              the page is and look like a bug.
                            */}
                            <div
                                style={{
                                    height: "88px",
                                    ...(token === "muted" ? { background: "var(--surface)" } : {}),
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        background: `var(--${token})`,
                                        borderRadius: "calc(var(--radius-md) - 1px)",
                                    }}
                                />
                            </div>
                            <code style={{ ...label, display: "block", marginTop: "var(--space-2)" }}>
                                --{token}
                            </code>
                            <p style={{ ...typeRole("body-sm"), color: "var(--muted-foreground)", margin: 0 }}>
                                {use}
                            </p>
                        </div>
                    ))}
                </Grid>
            </Section>

            <Section
                title="Elevation"
                lead="Shadows lift; borders divide. Never both for the same job — the card recipe uses a border and no shadow for exactly this reason. In dark mode each of these becomes a hairline ring, because a shadow on a dark ground is invisible."
            >
                <Grid min="200px">
                    {SHADOWS.map((level) => (
                        <div
                            key={level}
                            style={{
                                background: "var(--surface)",
                                borderRadius: "var(--radius-lg)",
                                padding: "var(--space-6)",
                                boxShadow: `var(--shadow-${level})`,
                            }}
                        >
                            <code style={label}>--shadow-{level}</code>
                            <p style={{ ...typeRole("body-sm"), color: "var(--foreground-secondary)", margin: "var(--space-2) 0 0" }}>
                                {
                                    {
                                        sm: "A control lifting off its surface. Not an elevation level.",
                                        raised: "Pairs with --surface-raised. Never with another level.",
                                        overlay: "Pairs with --surface-overlay. Modals, dropdowns, popovers.",
                                    }[level]
                                }
                            </p>
                        </div>
                    ))}
                </Grid>
            </Section>

            <Section
                title="A floating thing"
                lead="What the raised surface is actually for."
            >
                <div
                    style={{
                        background: "var(--muted)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-12) var(--space-6)",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            background: "var(--surface-overlay)",
                            borderRadius: "var(--radius-lg)",
                            boxShadow: "var(--shadow-overlay)",
                            padding: "var(--space-6)",
                            maxWidth: "var(--container-narrow)",
                        }}
                    >
                        <h3 style={{ ...typeRole("heading-sm"), margin: "0 0 var(--space-2)" }}>
                            Publish these changes?
                        </h3>
                        <p
                            style={{
                                ...typeRole("body-sm"),
                                color: "var(--foreground-secondary)",
                                margin: "0 0 var(--space-4)",
                                textWrap: "pretty",
                            }}
                        >
                            Twelve routes will be rebuilt. The previous deploy stays available for
                            thirty days.
                        </p>
                        <Row>
                            <Button>Publish</Button>
                            <Button tone="outline">Cancel</Button>
                            <Badge tone="neutral">No downtime</Badge>
                        </Row>
                    </div>
                </div>
            </Section>
        </Page>
    )
}
