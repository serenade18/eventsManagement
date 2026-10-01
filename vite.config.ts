import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  // The backend's SITE_URL and CORS settings default to http://localhost:8080.
  server: { port: 8080, strictPort: true },
  preview: { port: 8080 },
});
