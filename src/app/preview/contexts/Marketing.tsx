/**
 * A marketing page: the only context where display type runs at page scale and
 * the brand colour has to hold a full-width field rather than a 40px button.
 *
 * It is also the context that stress-tests the type scale on a phone, since
 * `--text-display` is a fixed 3.5rem and nothing in the system makes it fluid.
 */

import { useStore } from "../../store"
import { Badge, Button, Card, Grid, Page, Row, Section, typeRole } from "../kit"
import { Logo } from "../Logo"

const FEATURES = [
    {
        title: "Seeds, not swatches",
        body: "Type one colour and get eleven, generated in OKLCH with lightness targets shared across every hue — so the whole system reads at one weight.",
    },
    {
        title: "Measured, not guessed",
        body: "Every text colour is chosen by measuring contrast against the surface it actually sits on. The system passes its own audit by construction.",
    },
    {
        title: "Legible to machines",
        body: "The export is a skill folder. Point an agent at it and the brand is context it can build from, not a PDF it has to interpret.",
    },
]

export function Marketing() {
    const config = useStore((state) => state.config)

    return (
        <div>
            {/* Full-bleed background, contained content — the chrome exception. */}
            <header style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div
                    style={{
                        maxWidth: "var(--container-page)",
                        marginInline: "auto",
                        padding: "var(--space-4) var(--space-6)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-4)",
                        flexWrap: "wrap",
                    }}
                >
                    <Logo config={config} />
                    <nav style={{ display: "flex", gap: "var(--space-4)", marginLeft: "auto", flexWrap: "wrap" }}>
                        {["Work", "Notes", "About"].map((item) => (
                            <a
                                key={item}
                                href="#"
                                style={{
                                    ...typeRole("body-sm"),
                                    color: "var(--foreground-secondary)",
                                    textDecoration: "none",
                                }}
                            >
                                {item}
                            </a>
                        ))}
                    </nav>
                    <Button>Book a call</Button>
                </div>
            </header>

            <Page>
                <section style={{ marginBottom: "var(--space-24)" }}>
                    <div style={{ marginBottom: "var(--space-6)" }}>
                        <Badge>New · v0.1</Badge>
                    </div>
                    <h1
                        style={{
                            ...typeRole("display"),
                            margin: "0 0 var(--space-6)",
                            maxWidth: "var(--container-prose)",
                            textWrap: "balance",
                        }}
                    >
                        A brand system you can hand to a machine.
                    </h1>
                    <p
                        style={{
                            ...typeRole("body-lg"),
                            color: "var(--foreground-secondary)",
                            maxWidth: "var(--container-prose)",
                            margin: "0 0 var(--space-8)",
                            textWrap: "pretty",
                        }}
                    >
                        Colour, type, spacing and motion, authored once and exported as tokens,
                        a stylesheet, and documentation an agent can actually build from — instead of
                        a slide deck that goes stale the week after it ships.
                    </p>
                    <Row>
                        <Button>Start a system</Button>
                        <Button tone="outline">See an example</Button>
                    </Row>
                </section>

                <Section
                    title="Why it holds"
                    lead="Three decisions that do most of the work."
                >
                    <Grid min="240px">
                        {FEATURES.map((feature) => (
                            <Card key={feature.title}>
                                <h3 style={{ ...typeRole("heading-sm"), margin: "0 0 var(--space-2)" }}>
                                    {feature.title}
                                </h3>
                                <p
                                    style={{
                                        ...typeRole("body-sm"),
                                        color: "var(--foreground-secondary)",
                                        margin: 0,
                                        textWrap: "pretty",
                                    }}
                                >
                                    {feature.body}
                                </p>
                            </Card>
                        ))}
                    </Grid>
                </Section>

                <Section title="In numbers">
                    <Grid min="160px">
                        {[
                            ["57", "semantic tokens"],
                            ["11", "steps per ramp"],
                            ["2", "modes, generated"],
                            ["0", "colour literals"],
                        ].map(([value, caption]) => (
                            <div key={caption}>
                                <div
                                    style={{
                                        ...typeRole("heading-lg"),
                                        color: "var(--primary)",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {value}
                                </div>
                                <div style={{ ...typeRole("body-sm"), color: "var(--muted-foreground)" }}>
                                    {caption}
                                </div>
                            </div>
                        ))}
                    </Grid>
                </Section>

                <Section title="Long form" lead="Running text stays at the prose measure even though the page frame is wider.">
                    <div style={{ maxWidth: "var(--container-prose)" }}>
                        <p style={{ ...typeRole("body"), margin: "0 0 var(--space-4)", textWrap: "pretty" }}>
                            Most design systems are documentation about a design system. The tokens
                            live in one place, the rules live in another, and the gap between them is
                            filled by whoever happens to be building that week.
                        </p>
                        <p style={{ ...typeRole("body"), margin: 0, textWrap: "pretty" }}>
                            The alternative is to generate both from the same source, so a rule that
                            is written down is a rule the stylesheet already enforces — and the
                            documentation cannot drift from the thing it describes, because it is
                            printed from it.
                        </p>
                    </div>
                </Section>
            </Page>

            {/* The brand colour holding a full-width field, which is the one place
                --primary-foreground gets tested at something other than button size. */}
            <section style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <div
                    style={{
                        maxWidth: "var(--container-page)",
                        marginInline: "auto",
                        padding: "var(--space-16) var(--space-6)",
                    }}
                >
                    <h2
                        style={{
                            ...typeRole("heading-lg"),
                            margin: "0 0 var(--space-4)",
                            maxWidth: "var(--container-prose)",
                            textWrap: "balance",
                        }}
                    >
                        Forge one, then hand it over.
                    </h2>
                    <p
                        style={{
                            ...typeRole("body-lg"),
                            margin: "0 0 var(--space-8)",
                            maxWidth: "var(--container-prose)",
                            // No opacity fade: the system does not model opacity,
                            // and dimming the pair that was contrast-checked is
                            // how a validated colour quietly stops being valid.
                            textWrap: "pretty",
                        }}
                    >
                        Export the tokens, the stylesheet and the skill folder in one go.
                    </p>
                    <Button tone="inverse">Read the docs</Button>
                </div>
            </section>

            <footer style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <div
                    style={{
                        maxWidth: "var(--container-page)",
                        marginInline: "auto",
                        padding: "var(--space-8) var(--space-6)",
                        display: "flex",
                        gap: "var(--space-4)",
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Logo config={config} height={20} />
                    <span style={{ ...typeRole("body-sm"), color: "var(--muted-foreground)" }}>
                        {config.meta.domain ?? config.meta.name}
                    </span>
                    <span
                        style={{
                            ...typeRole("body-sm"),
                            color: "var(--muted-foreground)",
                            marginLeft: "auto",
                        }}
                    >
                        Generated by Brand Forge
                    </span>
                </div>
            </footer>
        </div>
    )
}
