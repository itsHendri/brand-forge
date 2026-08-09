import { useRef, useState } from "react"
import { uploadAsset } from "../persistence"
import { useStore } from "../store"

/**
 * A file picker that writes into `brands/assets/<slug>/` and hands back the
 * file name. Deliberately dumb: what a file *means* — logo, sans 400 italic —
 * is decided by whichever panel called it, not here.
 */
export function AssetUpload({
    accept,
    label,
    onUploaded,
}: {
    accept: string
    label: string
    onUploaded: (fileName: string, file: File) => void
}) {
    const slug = useStore((state) => state.config.meta.slug)
    const input = useRef<HTMLInputElement>(null)
    const [status, setStatus] = useState<string | null>(null)

    const pick = async (file: File | undefined) => {
        if (!file) return
        setStatus("Uploading…")
        const name = await uploadAsset(slug, file)
        if (!name) {
            setStatus("Upload failed — check the file type.")
            return
        }
        setStatus(null)
        onUploaded(name, file)
        if (input.current) input.current.value = "" // let the same file be re-picked
    }

    return (
        <div className="grid gap-1">
            <input
                ref={input}
                type="file"
                accept={accept}
                onChange={(event) => void pick(event.target.files?.[0])}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => input.current?.click()}
                className="justify-self-start rounded border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-ink-soft)]"
            >
                {label}
            </button>
            {status && <span className="text-[11px] text-[var(--app-ink-soft)]">{status}</span>}
        </div>
    )
}
