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

                <Section
                    title="Long form"
                    lead="Every editorial rule the docs state, rendered — running text at the prose measure, a heading that belongs to what follows it, lists, a quote, a figure and code."
                >
                    <div style={{ maxWidth: "var(--container-prose)" }}>
                        <p style={{ ...typeRole("body"), margin: "0 0 var(--space-6)", textWrap: "pretty" }}>
                            Most design systems are documentation about a design system. The tokens
                            live in one place, the rules live in another, and the gap between them is
                            filled by whoever happens to be building that week. The alternative is to{" "}
                            <a
                                href="#"
                                onClick={(event) => event.preventDefault()}
                                style={{
                                    color: "var(--link)",
                                    textDecoration: "underline",
                                    textUnderlineOffset: "0.2em",
                                }}
                            >
                                generate both from the same source
                            </a>
                            , so a rule that is written down is one the stylesheet already enforces.
                        </p>

                        {/* Space below a heading is smaller than the space above it, so
                            the heading belongs to the text it introduces. */}
                        <h3
                            style={{
                                ...typeRole("heading-sm"),
                                margin: "var(--space-12) 0 var(--space-3)",
                                textWrap: "balance",
                            }}
                        >
                            What that costs
                        </h3>
                        <p style={{ ...typeRole("body"), margin: "0 0 var(--space-6)", textWrap: "pretty" }}>
                            Every colour is measured against the surface it sits on, so a token that
                            reads on a card is checked again on a dialog. Inline{" "}
                            <code
                                style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.9em",
                                    background: "var(--muted)",
                                    borderRadius: "var(--radius-sm)",
                                    padding: "0.1em var(--space-1)",
                                }}
                            >
                                --muted
                            </code>{" "}
                            sits behind code so it reads on any surface.
                        </p>

                        <ul
                            style={{
                                ...typeRole("body"),
                                margin: "0 0 var(--space-6)",
                                paddingLeft: "var(--space-6)",
                                color: "var(--foreground)",
                            }}
                        >
                            {[
                                "The marker takes muted-foreground — tertiary is below the reading bar.",
                                "List items breathe at space-2, not at paragraph spacing.",
                                "Running text never leaves the prose measure.",
                            ].map((item) => (
                                <li key={item} style={{ margin: "var(--space-2) 0" }}>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <blockquote
                            style={{
                                ...typeRole("body-lg"),
                                margin: "var(--space-12) 0",
                                paddingLeft: "var(--space-6)",
                                borderLeft: "3px solid var(--border-strong)",
                                color: "var(--foreground)",
                            }}
                        >
                            A rule nobody has built against is a guess with better formatting.
                            <footer
                                style={{
                                    ...typeRole("body-sm"),
                                    color: "var(--muted-foreground)",
                                    marginTop: "var(--space-2)",
                                }}
                            >
                                Acceptance run 6
                            </footer>
                        </blockquote>

                        <pre
                            tabIndex={0}
                            style={{
                                ...typeRole("code"),
                                margin: "var(--space-8) 0",
                                background: "var(--muted)",
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-4)",
                                overflowX: "auto",
                                color: "var(--foreground)",
                            }}
                        >
{`.card {
    background: var(--surface);
    border: 1px solid var(--border);
}`}
                        </pre>

                        {/* A placeholder for media is --muted, never --surface-sunken:
                            sunken collapses into --background in dark mode and the
                            block disappears, leaving only its border. */}
                        <figure style={{ margin: "var(--space-8) 0" }}>
                            <div
                                style={{
                                    background: "var(--muted)",
                                    borderRadius: "var(--radius-md)",
                                    aspectRatio: "3 / 2",
                                    display: "grid",
                                    placeItems: "center",
                                    color: "var(--foreground-tertiary)",
                                    ...typeRole("label"),
                                }}
                            >
                                Media placeholder
                            </div>
                            <figcaption
                                style={{
                                    ...typeRole("body-sm"),
                                    color: "var(--muted-foreground)",
                                    marginTop: "var(--space-3)",
                                }}
                            >
                                A caption sits at body-sm in muted-foreground, space-3 below.
                            </figcaption>
                        </figure>
                    </div>
                </Section>

                {/* An inverse region with two text levels — the gap run 6 found,
                    when a footer had one colour for headings, links and fine print. */}
                <Section title="Footer band" lead="An inverse region needs more than one text colour.">
                    <div
                        style={{
                            background: "var(--inverse)",
                            color: "var(--inverse-foreground)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-8)",
                            display: "grid",
                            gap: "var(--space-6)",
                        }}
                    >
                        <div style={{ display: "flex", gap: "var(--space-12)", flexWrap: "wrap" }}>
                            {[
                                ["Product", ["Overview", "Tokens", "Export"]],
                                ["Company", ["About", "Writing", "Contact"]],
                            ].map(([heading, links]) => (
                                <div key={heading as string} style={{ display: "grid", gap: "var(--space-2)" }}>
                                    <span
                                        style={{
                                            ...typeRole("label"),
                                            textTransform: "uppercase",
                                            color: "var(--inverse-muted-foreground)",
                                        }}
                                    >
                                        {heading as string}
                                    </span>
                                    {(links as string[]).map((link) => (
                                        <a
                                            key={link}
                                            href="#"
                                            onClick={(event) => event.preventDefault()}
                                            style={{
                                                ...typeRole("body-sm"),
                                                color: "var(--link-inverse)",
                                                textDecoration: "none",
                                            }}
                                        >
                                            {link}
                                        </a>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <p
                            style={{
                                ...typeRole("body-lg"),
                                margin: 0,
                                color: "var(--inverse-muted-foreground)",
                                maxWidth: "var(--container-prose)",
                            }}
                        >
                            Supporting copy on an inverse region takes inverse-muted-foreground, held
                            to the large-text bar — so keep it at body-lg or larger.
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
