import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  // The backend's SITE_URL and CORS settings default to http://localhost:8080.
  server: { port: 8080, strictPort: true },
  preview: { port: 8080 },
  optimizeDeps: {
    // Dependencies reached only through lazy routes (console pages, the demo backend).
    // Pre-bundling them at startup avoids "504 Outdated Optimize Dep" when Vite would
    // otherwise discover them mid-session and invalidate modules the page already loaded.
    include: [
      "recharts",
      "qrcode",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
    ],
  },
});
