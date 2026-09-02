import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* ============================================================================
 * Regional Admin Dashboard — build config
 *
 * Yeh dashboard Krashi Mitra ki MAIN PUBLIC SITE ke andar, ek alag folder me
 * chalta hai:  https://krashi-mitrasih.vercel.app/regional-admin
 *
 *   base      -> saare asset links '/regional-admin/...' se shuru honge
 *   outDir    -> build seedha ../regional-admin/ me girta hai, jise Vercel
 *                baaki static files ki tarah serve kar deta hai
 *
 * MAIN SITE (index.html, js/script.js, sw.js) ko yeh build CHHUTA BHI NAHI —
 * sirf regional-admin/ folder likha jata hai.
 *
 * Dobara build karne ke liye:  cd admin && npm run build
 * ========================================================================= */
export default defineConfig({
  base: '/regional-admin/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../regional-admin',
    emptyOutDir: true,
    // Chunk bade hain (leaflet + recharts + framer-motion) — warning ka shor kam
    chunkSizeWarningLimit: 1200,
  },
})
