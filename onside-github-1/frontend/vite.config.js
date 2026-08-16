import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // GitHub Pages sert le site depuis /Onside/, pas la racine ; en dev on garde "/"
  // pour ne pas casser le serveur local.
  base: command === 'build' ? '/Onside/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
}))
