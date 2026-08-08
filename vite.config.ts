import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { brandForgeFs } from "./vite-plugin-brandforge-fs"

export default defineConfig({
    plugins: [react(), tailwindcss(), brandForgeFs()],
    server: { port: 5300, strictPort: true },
})
