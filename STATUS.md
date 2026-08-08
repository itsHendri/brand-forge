# Status — 2026-08-08

**Phase 0 complete. Phase 1 in progress.**

## What works

The engine is real and tested. `resolveTokens(hendriPreset)` produces 7 primitive ramps × 11 steps ×
2 modes, 49 semantic tokens, and a full `declarations` array, with 0 warnings. 22 tests pass;
typecheck clean.

- **`generateScale`** — seed → OKLCH ramp. Shared lightness targets across hues, chroma bell, hue
  rotation centred on the anchor, per-step gamut clamping, and seed warping so the typed colour
  appears verbatim. Dark ramps generated from their own targets (floor ~L 0.245) with a global
  chroma trim.
- **`defaultSemanticMapping`** — seeds alone produce a complete working system: surfaces, text,
  neutral states, borders, brand actions (with hover/active/subtle), and four status families.
- **`resolveTokens`** — the single pipeline. Emits `declarations` per mode; semantics alias
  primitives (`--primary: var(--primary-700)`).
- **Vite fs plugin** — `/api/brands` read/write and `/api/export/:slug` tree write.
- **P0 UI** — a swatch dump of every ramp + every semantic, light/dark, verified in-browser at 5300.

## Verified

Ramps are visually coherent across hues (shared lightness targets holding), dark ramps read calmer
and floor correctly, `primary` resolves to `#574cff` exactly.

## Open findings for Hendri

1. **The secondary scale does no work.** Seeded provisionally from Foreground Secondary (`#40525e`),
   it renders nearly identically to the neutral ramp — same hue family, both low chroma. hendri.design
   has no declared secondary brand colour. Either pick a real one or drop the slot.
2. **Type families are placeholders** (Geist / Geist Mono) pending confirmation against the live site.

## Next

P1: colour editing (seed pickers, per-step override) + the live preview canvas consuming
`declarations`, starting with the ComponentsSheet context.
