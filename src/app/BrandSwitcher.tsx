import { useState } from "react"
import { useStore } from "./store"

/**
 * Multi-brand is just multiple files, so this is a file picker with three verbs.
 * "Duplicate" is the one that matters in practice: a client brand starts as a
 * copy of one that already works, not from an empty form.
 */
export function BrandSwitcher() {
    const { config, brands, activeSlug, switchBrand, createBrand, removeBrand } = useStore()
    const [open, setOpen] = useState(false)

    const create = async (from?: typeof config) => {
        const name = window.prompt(from ? `Duplicate "${config.meta.name}" as:` : "New brand name:")
        if (!name?.trim()) return
        await createBrand(name.trim(), from)
        setOpen(false)
    }

    const remove = async () => {
        if (brands.length <= 1) {
            window.alert("This is the only brand. Create another before deleting this one.")
            return
        }
        const confirmed = window.confirm(
            `Delete "${config.meta.name}"?\n\nA copy is kept in brands/.backup/ — this is recoverable.`,
        )
        if (!confirmed) return
        await removeBrand(activeSlug)
        setOpen(false)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-[var(--app-panel)]"
            >
                {config.meta.name}
                <span className="text-[10px] text-[var(--app-ink-soft)]">▾</span>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-md border border-[var(--app-border)] bg-white py-1 shadow-lg">
                        {brands.map((slug) => (
                            <button
                                key={slug}
                                type="button"
                                onClick={async () => {
                                    await switchBrand(slug)
                                    setOpen(false)
                                }}
                                className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--app-panel)] ${
                                    slug === activeSlug ? "font-medium" : ""
                                }`}
                            >
                                {slug === activeSlug && "✓ "}
                                {slug}
                            </button>
                        ))}

                        <div className="my-1 border-t border-[var(--app-border)]" />

                        <button
                            type="button"
                            onClick={() => create(config)}
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--app-panel)]"
                        >
                            Duplicate this brand
                        </button>
                        <button
                            type="button"
                            onClick={() => create()}
                            className="block w-full px-3 py-1.5 text-left text-sm hover:bg-[var(--app-panel)]"
                        >
                            New from template
                        </button>
                        <button
                            type="button"
                            onClick={remove}
                            className="block w-full px-3 py-1.5 text-left text-sm text-red-700 hover:bg-[var(--app-panel)]"
                        >
                            Delete this brand
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
