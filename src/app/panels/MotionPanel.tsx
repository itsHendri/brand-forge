import { useState } from "react"
import type { BrandConfig } from "../../engine/types"
import { useStore } from "../store"
import { Field, NumberInput, Section, TextInput } from "./controls"

type DurationName = keyof BrandConfig["motion"]["durations"]
type EasingName = keyof BrandConfig["motion"]["easings"]

const DURATION_NOTES: Record<DurationName, string> = {
    instant: "State flips that shouldn't feel animated at all.",
    fast: "Exits, and hover-off. Leaving is always quicker than arriving.",
    base: "The default. Entrances, most state changes.",
    slow: "Page-level or large-travel movement only.",
}

const EASING_NOTES: Record<EasingName, string> = {
    out: "Entrances. Fast out of the gate, settling at the end.",
    in: "Exits, when something is leaving the screen entirely.",
    "in-out": "Movement between two on-screen positions.",
    spring: "Overshoots. Use sparingly — never on high-frequency interactions.",
}

/**
 * Timing is impossible to judge from a number, so every value here is playable.
 * The demo deliberately shows enter and exit together, because the rule that
 * matters — exits are faster — only exists in the relationship between them.
 */
export function MotionPanel() {
    const { config, patch } = useStore()
    const { durations, easings } = config.motion
    const [playing, setPlaying] = useState<string | null>(null)

    const play = (key: string) => {
        setPlaying(null)
        requestAnimationFrame(() => setPlaying(key))
    }

    return (
        <div className="grid gap-5">
            <Section title="Durations">
                {(Object.keys(durations) as DurationName[]).map((name) => (
                    <div key={name} className="grid gap-1">
                        <Field label={`--duration-${name}`} hint={DURATION_NOTES[name]}>
                            <NumberInput
                                value={durations[name]}
                                step={10}
                                min={0}
                                max={2000}
                                suffix="ms"
                                onChange={(ms) => patch((draft) => void (draft.motion.durations[name] = ms))}
                            />
                        </Field>
                    </div>
                ))}
            </Section>

            <Section
                title="Easings"
                hint="CSS timing functions. The exported docs pair --ease-out with entrances and --ease-in with exits."
            >
                {(Object.keys(easings) as EasingName[]).map((name) => (
                    <Field key={name} label={`--ease-${name}`} hint={EASING_NOTES[name]}>
                        <TextInput
                            mono
                            value={easings[name]}
                            onChange={(curve) => patch((draft) => void (draft.motion.easings[name] = curve))}
                        />
                    </Field>
                ))}
            </Section>

            <Section
                title="Play"
                hint="Enter uses base + ease-out; exit uses fast + ease-in. If the exit doesn't feel quicker, the durations are wrong."
            >
                <div className="rounded-md border border-[var(--app-border)] bg-white p-3">
                    <div className="relative h-10 overflow-hidden">
                        <span
                            key={playing ?? "idle"}
                            className="absolute top-1 left-0 block h-8 w-8 rounded bg-[var(--app-ink)]"
                            style={
                                playing
                                    ? {
                                          animationName: playing === "enter" ? "bf-enter" : "bf-exit",
                                          animationDuration: `${playing === "enter" ? durations.base : durations.fast}ms`,
                                          animationTimingFunction:
                                              playing === "enter" ? easings.out : easings.in,
                                          animationFillMode: "both",
                                      }
                                    : undefined
                            }
                        />
                    </div>
                    <div className="mt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={() => play("enter")}
                            className="rounded border border-[var(--app-border)] px-2 py-1 text-[11px]"
                        >
                            Enter · {durations.base}ms
                        </button>
                        <button
                            type="button"
                            onClick={() => play("exit")}
                            className="rounded border border-[var(--app-border)] px-2 py-1 text-[11px]"
                        >
                            Exit · {durations.fast}ms
                        </button>
                    </div>
                </div>
                <style>{`
                    @keyframes bf-enter {
                        from { opacity: 0; transform: translateX(0) translateY(12px); }
                        to   { opacity: 1; transform: translateX(240px) translateY(0); }
                    }
                    @keyframes bf-exit {
                        from { opacity: 1; transform: translateX(240px) translateY(0); }
                        to   { opacity: 0; transform: translateX(0) translateY(-12px); }
                    }
                `}</style>
            </Section>
        </div>
    )
}
