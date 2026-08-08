import { create } from "zustand"
import { resolveTokens } from "../engine/resolve"
import type { BrandConfig, Mode, ScaleRole, SemanticRef, Step } from "../engine/types"
import { hendriPreset } from "../presets/hendri"
import { loadBrand, saveBrand } from "./persistence"

export type PanelId = "brand" | "color" | "semantics" | "type" | "shape" | "motion" | "rules"
export type PreviewContextId = "components" | "dashboard" | "marketing" | "mobile"

interface BrandForgeState {
    config: BrandConfig
    mode: Mode
    panel: PanelId
    context: PreviewContextId
    /** Which scale the colour panel is focused on. */
    editingScale: ScaleRole
    /** A semantic token to scroll to and flash — set by warning "jump to" links. */
    highlighted: string | null
    saving: boolean

    setMode: (mode: Mode) => void
    setPanel: (panel: PanelId) => void
    setContext: (context: PreviewContextId) => void
    setEditingScale: (role: ScaleRole) => void
    highlight: (token: string | null) => void

    setSeed: (role: ScaleRole, seed: string) => void
    setScaleName: (role: ScaleRole, name: string) => void
    setStepOverride: (role: ScaleRole, mode: Mode, step: Step, hex: string | null) => void
    setSemanticRef: (token: string, mode: Mode, ref: SemanticRef) => void
    patch: (update: (draft: BrandConfig) => void) => void
    hydrate: () => Promise<void>
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

export const useStore = create<BrandForgeState>((set, get) => {
    /** Every mutation funnels through here so autosave can never be forgotten. */
    const commit = (update: (draft: BrandConfig) => void) => {
        const draft = structuredClone(get().config)
        update(draft)
        set({ config: draft })

        clearTimeout(saveTimer)
        set({ saving: true })
        saveTimer = setTimeout(async () => {
            await saveBrand(draft)
            set({ saving: false })
        }, 600)
    }

    return {
        config: hendriPreset,
        mode: "light",
        panel: "color",
        context: "components",
        editingScale: "primary",
        highlighted: null,
        saving: false,

        setMode: (mode) => set({ mode }),
        setPanel: (panel) => set({ panel }),
        setContext: (context) => set({ context }),
        setEditingScale: (editingScale) => set({ editingScale }),
        highlight: (highlighted) => set({ highlighted }),

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
            const saved = await loadBrand(hendriPreset.meta.slug)
            if (saved) set({ config: saved })
            else await saveBrand(hendriPreset) // first run: write the preset to disk
        },
    }
})

/** Derived, never stored. Recomputed on any config change. */
export const useResolved = () => resolveTokens(useStore((s) => s.config))
