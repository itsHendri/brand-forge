import { create } from "zustand"
import { resolveTokens } from "../engine/resolve"
import type { BrandConfig, Mode, ScaleRole, SemanticRef, Step } from "../engine/types"
import { hendriPreset } from "../presets/hendri"
import { deleteBrand, listBrands, loadBrand, saveBrand } from "./persistence"

/** How many steps back you can go. Generous — snapshots are small JSON. */
const HISTORY_LIMIT = 100

export type PanelId =
    | "brand"
    | "color"
    | "semantics"
    | "type"
    | "layout"
    | "shape"
    | "motion"
    | "rules"
export type PreviewContextId = "components" | "surfaces" | "marketing" | "dashboard"

interface BrandForgeState {
    config: BrandConfig
    mode: Mode
    panel: PanelId
    context: PreviewContextId
    /** Which scale the colour panel is focused on. */
    editingScale: ScaleRole
    /** A semantic token to scroll to and flash — set by warning "jump to" links. */
    highlighted: string | null
    /** Width the preview is pinned to, in px. null = fill the canvas. */
    previewWidth: number | null
    saving: boolean

    /** Every brand file on disk, and which one is open. */
    brands: string[]
    activeSlug: string
    /**
     * Undo history. Autosave is instant and unconditional, so without this a
     * stray interaction with a colour swatch is permanent — which is exactly
     * how a brand seed silently became #000000 during this project.
     */
    past: BrandConfig[]
    future: BrandConfig[]

    setMode: (mode: Mode) => void
    setPanel: (panel: PanelId) => void
    setContext: (context: PreviewContextId) => void
    setEditingScale: (role: ScaleRole) => void
    highlight: (token: string | null) => void
    setPreviewWidth: (width: number | null) => void

    setSeed: (role: ScaleRole, seed: string) => void
    setScaleName: (role: ScaleRole, name: string) => void
    setStepOverride: (role: ScaleRole, mode: Mode, step: Step, hex: string | null) => void
    setSemanticRef: (token: string, mode: Mode, ref: SemanticRef) => void
    patch: (update: (draft: BrandConfig) => void) => void
    hydrate: () => Promise<void>

    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean

    refreshBrands: () => Promise<void>
    switchBrand: (slug: string) => Promise<void>
    createBrand: (name: string, from?: BrandConfig) => Promise<void>
    removeBrand: (slug: string) => Promise<void>
}

const slugify = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "brand"

let saveTimer: ReturnType<typeof setTimeout> | undefined

export const useStore = create<BrandForgeState>((set, get) => {
    /** Debounced write. Shared by every path that changes the active brand. */
    const persist = (config: BrandConfig) => {
        clearTimeout(saveTimer)
        set({ saving: true })
        saveTimer = setTimeout(async () => {
            await saveBrand(config)
            set({ saving: false })
        }, 600)
    }

    /**
     * Every mutation funnels through here, so autosave and undo can never be
     * forgotten. The previous state is pushed before the change lands — that
     * snapshot is the only thing standing between a mis-click and lost work.
     */
    const commit = (update: (draft: BrandConfig) => void) => {
        const previous = get().config
        const draft = structuredClone(previous)
        update(draft)
        if (JSON.stringify(draft) === JSON.stringify(previous)) return // no-op, don't pollute history

        set({
            config: draft,
            past: [...get().past, previous].slice(-HISTORY_LIMIT),
            future: [], // a new edit forks the timeline
        })
        persist(draft)
    }

    return {
        config: hendriPreset,
        mode: "light",
        panel: "color",
        context: "components",
        editingScale: "primary",
        highlighted: null,
        previewWidth: null,
        saving: false,
        brands: [],
        activeSlug: hendriPreset.meta.slug,
        past: [],
        future: [],

        setMode: (mode) => set({ mode }),
        setPanel: (panel) => set({ panel }),
        setContext: (context) => set({ context }),
        setEditingScale: (editingScale) => set({ editingScale }),
        highlight: (highlighted) => set({ highlighted }),
        setPreviewWidth: (previewWidth) => set({ previewWidth }),

        setSeed: (role, seed) =>
            commit((draft) => {
                const scale = draft.color.scales.find((s) => s.role === role)
                if (scale) scale.seed = seed
            }),

        setScaleName: (role, name) =>
            commit((draft) => {
                const scale = draft.color.scales.find((s) => s.role === role)
                if (scale) scale.name = name
            }),

        setStepOverride: (role, mode, step, hex) =>
            commit((draft) => {
                const scale = draft.color.scales.find((s) => s.role === role)
                if (!scale) return
                scale.overrides ??= {}
                scale.overrides[mode] ??= {}
                if (hex) scale.overrides[mode]![step] = hex
                else delete scale.overrides[mode]![step]
            }),

        setSemanticRef: (token, mode, ref) =>
            commit((draft) => {
                const semantic = draft.color.semantics.find((s) => s.name === token)
                if (semantic) semantic[mode] = ref
            }),

        patch: (update) => commit(update),

        hydrate: async () => {
            const saved = await loadBrand(hendriPreset.meta.slug, hendriPreset)
            if (saved) set({ config: saved })
            else await saveBrand(hendriPreset) // first run: write the preset to disk
            await get().refreshBrands()
        },

        // ── History ─────────────────────────────────────────────────────────
        undo: () => {
            const { past, config, future } = get()
            const previous = past[past.length - 1]
            if (!previous) return
            set({ config: previous, past: past.slice(0, -1), future: [config, ...future] })
            persist(previous)
        },

        redo: () => {
            const { past, config, future } = get()
            const next = future[0]
            if (!next) return
            set({ config: next, past: [...past, config], future: future.slice(1) })
            persist(next)
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        // ── Brands ──────────────────────────────────────────────────────────
        refreshBrands: async () => set({ brands: await listBrands() }),

        switchBrand: async (slug) => {
            const loaded = await loadBrand(slug, hendriPreset)
            if (!loaded) return
            // History belongs to a document, not to the app.
            set({ config: loaded, activeSlug: slug, past: [], future: [] })
        },

        createBrand: async (name, from) => {
            const slug = slugify(name)
            const base = structuredClone(from ?? hendriPreset)
            base.meta = { ...base.meta, id: slug, slug, name, domain: from ? undefined : base.meta.domain }
            await saveBrand(base)
            set({ config: base, activeSlug: slug, past: [], future: [] })
            await get().refreshBrands()
        },

        removeBrand: async (slug) => {
            await deleteBrand(slug)
            await get().refreshBrands()
            const remaining = get().brands.filter((entry) => entry !== slug)
            const next = remaining[0]
            if (get().activeSlug === slug && next) await get().switchBrand(next)
        },
    }
})

/** Derived, never stored. Recomputed on any config change. */
export const useResolved = () => resolveTokens(useStore((s) => s.config))

// Dev-only handle, so the store can be inspected from the console (and by the
// browser automation that verifies undo actually records history).
if (import.meta.env.DEV) {
    ;(window as unknown as { __brandForge?: unknown }).__brandForge = useStore
}
