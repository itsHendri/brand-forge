/**
 * An app shell: sticky chrome, a sidebar that collapses, dense data.
 *
 * This is the context that exercises the things a marketing page never does —
 * selected states, table density, numbers in a column, and whether the surface
 * ladder still reads when there are twenty edges on screen instead of two.
 */

import { Badge, Button, Card, Grid, Row, STATUSES, typeRole } from "../kit"

const NAV = ["Overview", "Deployments", "Analytics", "Domains", "Settings"]

const DEPLOYS = [
    { id: "dpl_9f2", branch: "main", status: "success", time: "2m 14s", size: "12.4 kB" },
    { id: "dpl_8c1", branch: "mobile-nav", status: "warning", time: "3m 02s", size: "18.1 kB" },
    { id: "dpl_7b4", branch: "type-pass", status: "danger", time: "0m 41s", size: "—" },
    { id: "dpl_6a9", branch: "main", status: "success", time: "2m 08s", size: "12.1 kB" },
] as const

const STAT_LABEL: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--text-code)",
    color: "var(--muted-foreground)",
}

export function Dashboard() {
    return (
        <div style={{ minHeight: "100%" }}>
            {/* Full-bleed background, contained content — the chrome exception. */}
            <header
                style={{
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        maxWidth: "var(--container-wide)",
                        marginInline: "auto",
                        padding: "var(--space-3) var(--space-6)",
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-4)",
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ ...typeRole("heading-sm") }}>Hendri</strong>
                    <span style={{ ...typeRole("body-sm"), color: "var(--muted-foreground)" }}>
                        hendri.design
                    </span>
                    <div style={{ marginLeft: "auto" }}>
                        <Row>
                            <Button tone="outline">Docs</Button>
                            <Button>Deploy</Button>
                        </Row>
                    </div>
                </div>
            </header>

            <div
                style={{
                    maxWidth: "var(--container-wide)",
                    marginInline: "auto",
                    padding: "var(--space-8) var(--space-6)",
                    // Flex-wrap rather than auto-fit grid: a sidebar-plus-main
                    // shell is two tracks of different widths, and auto-fit only
                    // makes equal ones — it produced a phantom zero-width column
                    // when the main column asked to span three of them. Main's
                    // huge flex-grow takes the leftover space side by side, and
                    // its basis forces the wrap when there isn't room.
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--space-8)",
                    alignItems: "flex-start",
                }}
            >
                <nav style={{ display: "grid", gap: "var(--space-1)", flex: "1 1 180px" }}>
                    {NAV.map((item, index) => (
                        <a
                            key={item}
                            href="#"
                            style={{
                                ...typeRole("body-sm"),
                                textDecoration: "none",
                                padding: "var(--space-2) var(--space-3)",
                                borderRadius: "var(--radius-sm)",
                                background: index === 1 ? "var(--state-selected)" : "transparent",
                                color: "var(--foreground)",
                                fontWeight: index === 1 ? 500 : 400,
                            }}
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                <main style={{ display: "grid", gap: "var(--space-6)", flex: "999 1 420px", minWidth: 0 }}>
                    <Grid min="160px">
                        {[
                            ["Deploys", "1,284", "success"],
                            ["Avg build", "2m 11s", "info"],
                            ["Failed", "3", "danger"],
                            ["Bandwidth", "84.2 GB", "warning"],
                        ].map(([name, value, tone]) => (
                            <Card key={name} style={{ padding: "var(--space-4)" }}>
                                <div style={STAT_LABEL}>{name}</div>
                                <div
                                    style={{
                                        ...typeRole("heading"),
                                        fontVariantNumeric: "tabular-nums",
                                        margin: "var(--space-1) 0 var(--space-2)",
                                    }}
                                >
                                    {value}
                                </div>
                                <Badge tone={tone as (typeof STATUSES)[number]}>live</Badge>
                            </Card>
                        ))}
                    </Grid>

                    <Card style={{ padding: 0, overflow: "hidden" }}>
                        <div
                            style={{
                                padding: "var(--space-4) var(--space-6)",
                                borderBottom: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                            }}
                        >
                            <h2 style={{ ...typeRole("heading-sm"), margin: 0 }}>Recent deployments</h2>
                            <span style={{ marginLeft: "auto" }}>
                                <Badge tone="neutral">Last 24h</Badge>
                            </span>
                        </div>

                        <div style={{ overflowX: "auto" }} tabIndex={0}>
                            <table style={{ width: "100%", borderCollapse: "collapse", ...typeRole("body-sm") }}>
                                <thead>
                                    <tr style={{ background: "var(--muted)" }}>
                                        {["Deployment", "Branch", "Status", "Build", "Size"].map((heading) => (
                                            <th
                                                key={heading}
                                                style={{
                                                    ...typeRole("label"),
                                                    textAlign: "left",
                                                    padding: "var(--space-3) var(--space-4)",
                                                    color: "var(--muted-foreground)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DEPLOYS.map((row, index) => (
                                        <tr
                                            key={row.id}
                                            style={{
                                                background: index === 1 ? "var(--state-hover)" : "transparent",
                                                borderTop: "1px solid var(--border-subtle)",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "var(--space-3) var(--space-4)",
                                                    fontFamily: "var(--font-mono)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {row.id}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "var(--space-3) var(--space-4)",
                                                    color: "var(--foreground-secondary)",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {row.branch}
                                            </td>
                                            <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                                                <Badge tone={row.status}>{row.status}</Badge>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "var(--space-3) var(--space-4)",
                                                    fontVariantNumeric: "tabular-nums",
                                                    color: "var(--foreground-secondary)",
                                                }}
                                            >
                                                {row.time}
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
                    </Card>
                </main>
            </div>
        </div>
    )
}
