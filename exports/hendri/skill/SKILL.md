---
name: hendri-brand
description: Build UI in the Hendri design system. Use whenever writing or reviewing components, pages, styles or markup for hendri.design — including colour, type, spacing, radius, elevation and motion decisions.
---

# Hendri — build in this system

You are writing UI for Hendri (hendri.design). Its tokens are already
defined. Your job is to compose them, never to invent values.

Full token tables, component recipes and wrong/right pairs live in
`references/DESIGN_SYSTEM.md`. Read it before writing anything non-trivial.

## Before you write a line

1. Check that `tokens.css` is imported and `<html>` can carry `data-theme="dark"`.
2. Work out which semantic tokens the thing you're building needs. If you cannot name them, you do
   not understand the component yet.
3. If no semantic token fits, **say so and stop**. Do not reach for a primitive or invent a hex.

## Hard rules

1. **Never write a colour literal.** No hex, `rgb()`, `hsl()` or `oklch()` in component code.
   Every colour is `var(--<semantic>)`.
2. **Never reference a primitive** (`--primary-600`, `--neutral-200`). Primitives are for tuning
   the ramp, not for building. Semantics only.
3. **Never write a dark-mode colour override.** Tokens re-point themselves under
   `[data-theme="dark"]`. A `dark:` colour variant means you used the wrong token.
4. **Surfaces:** `--background` is the page, `--surface` is a card, `--surface-raised` is a
   popover or dialog, `--muted` is a quiet fill. There is no `--card` or `--popover`.
5. **Text:** `--foreground` for body and headings, `--foreground-secondary` for supporting copy,
   `--muted-foreground` for captions and metadata. `--foreground-tertiary` is below the reading
   threshold — placeholders and watermarks only.
6. **On a solid fill, use its paired `-foreground`.** `--primary` takes
   `--primary-foreground`; `--danger` takes `--danger-foreground`. The polarity differs between
   fills on purpose — some are light, some dark. Do not unify them.
7. **Status is success, warning, danger, info** — not `destructive`. A banner is
   `--<status>-subtle` + `--<status>-subtle-foreground` + `--<status>-border`. The solid
   `--<status>` is for fills and badges, never for text on a page background.
8. **Interaction:** hover is `--primary-hover` / `--state-hover`, pressed is `--primary-active`
   / `--state-active`, current is `--state-selected`. Never compute a hover colour with
   `filter: brightness()` or an opacity overlay.
9. **Focus is never removed.** `outline: 2px solid var(--ring); outline-offset: 2px` on
   `:focus-visible`.
10. **Spacing comes from the blessed subset only:**
    4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px. Nothing between them.
11. **Radius:** `--radius-sm` 5px, `--radius-md` 10px,
    `--radius-lg` 15px, `--radius-xl` 20px. A rounded box
    inside another uses `inner = outer − padding`, floored at 0.
12. **Type is role-named.** Use `--text-body`, `--text-heading`, `--text-label` and friends.
    Heading *level* is about document outline; heading *size* is about the role token. Never size
    text with an arbitrary rem value.
13. **Motion:** `--duration-fast` 150ms,
    `--duration-base` 200ms, easing `--ease-out` for entrances.
    Exits are faster than entrances. Never `transition: all` — name the properties.

## Craft rules

1. **Concentric radius.** A rounded element inside another uses `inner = outer − padding`. Square it off at 0. Only applies when padding ≤ 24px.
2. **Optical alignment.** On a button with a leading icon, the icon-side padding is 2px tighter than the text side (e.g. `pl-14 pr-16`). Fix lopsided glyphs in the SVG viewBox, not with margins.
3. **Shadows elevate, borders structure.** Use `--shadow-*` for things that float above the page and `--border` for things that divide it. Never both for the same job. In dark mode elevation is a hairline ring plus a lighter surface, not a drop shadow.
4. **Interruptible animation.** State changes use CSS transitions so they can be interrupted mid-flight. Keyframes are only for one-shot sequences.
5. **Exits are faster than entrances.** Enter: `--duration-base`, opacity 0→1 with a 12px rise. Exit: `--duration-fast`, opacity→0 with a 12px fall. Leaving should never take as long as arriving.
6. **Press feedback.** Active state scales to 0.96 over `--duration-fast`. Never below 0.95.
7. **Never `transition: all`.** Name the properties you are animating. `transition: all` animates layout properties by accident and stutters.
8. **Tabular numbers.** Any number that changes in place (counters, timers, prices in a table) gets `font-variant-numeric: tabular-nums`. Not phone numbers or version strings.
9. **Text wrapping.** `text-wrap: balance` on headings up to ~6 lines; `text-wrap: pretty` on body copy.
10. **Hit areas.** 44×44px minimum on touch, 40×40px in dense desktop UI. Extend with a pseudo-element rather than padding that breaks the layout. Hit areas must not overlap.
11. **Icon stroke matches text weight.** 1.5px stroke next to 400-weight text, 2px next to 600. One stroke weight per icon set. Recolour with `currentColor`.
12. **Focus is always visible.** Keyboard focus draws a 2px `--ring` outline with a 2px offset. Never `outline: none` without a replacement.
13. **Honour reduced motion.** Under `prefers-reduced-motion: reduce`, drop transforms and cut durations to near zero. Motion is never the only signal that something changed — pair it with colour, icon or label.

## Reviewing existing code

Report findings in this shape, most severe first, and nothing else:

| Severity | Location | Now | Should be | Why |
|---|---|---|---|---|

Severity is **blocking** for a hardcoded value, a missing focus style or unreadable text;
**should-fix** for the wrong token with adequate contrast; **polish** for a craft rule.

Verify before you claim: a colour literal anywhere in component code is blocking, and
`grep -nE '#[0-9a-fA-F]{3,8}|rgb\(|hsl\(|oklch\(' <files>` finds them. If you changed anything,
say which rule each change served.
