# Brand Forge — working notes (auto-loaded)

A brand/design-system builder. Read `STATUS.md` then `FUTURE.md` before starting work; don't
re-derive what's already documented. `DECISIONS.md` holds the rationale — check it before changing
anything that looks arbitrary, because most of it isn't.

## The one rule

`resolveTokens()` produces `declarations` — an ordered `[--var, value][]` per mode. The live preview
injects that array; every exporter prints that array. **There is exactly one serialization of the
system.** If you find yourself writing a second path from config to CSS, stop: that's how the
preview and the export drift apart, and the whole point of this tool is that they can't.

## How to work here

```bash
npm run dev                   # localhost:5300
npm test                      # 54 engine + export tests
npm run typecheck
npm run lint:preview-colors   # no colour literals in preview contexts
```

Verify in the browser via `preview_start` with the `brand-forge` config, not by reasoning about it.
Colour maths is taste as much as maths — look at the ramps.

## Things that will catch you out

- **Saved brands don't inherit improved defaults.** `brands/*.json` stores the resolved semantic
  mapping. If you improve `defaultSemanticMapping`, existing files keep the old wiring — delete
  `brands/hendri.json` to see your change. (Proper fix is in `FUTURE.md`.)
- **The preset is contrast-aware at construction time.** `defaultSemanticMapping` generates real
  ramps and measures APCA to choose foregrounds. It is not a lookup table; changing a step number
  by hand there usually means you've misread what it's doing.
- **A test asserting the dark chroma trim must use a seed inside sRGB.** At the saturated end both
  ramps hit the gamut ceiling, so clamping decides the value and the trim is invisible.
- **Don't validate dark mode with WCAG 2.** It gives false passes among dark colours — there's a
  test pinning a pair that scores 6.9:1 and is unreadable. APCA judges; WCAG is reported alongside
  for compliance only.
- **Preview components use `var(--token)` exclusively.** The lint enforces it. If the preview needs
  a value the system doesn't define, that's a finding about the system, not a reason for a literal.

## The acceptance test is the real quality gate

The exported docs are the product. To check them, hand `exports/<brand>/skill/` to a subagent that
has never seen this repo, ask it to build something realistic, and — this is the important part —
ask it to critique the documentation: what it had to invent, what was ambiguous, what saved it from
a mistake. Session 1 did this and got nine real defects back, including an invalid CSS shorthand
that made every component recipe fail silently. Expect to rewrite doc templates 2–3 times; that's
the process working.
