// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    host: '0.0.0.0', // Macht den Server im lokalen Netzwerk verfügbar
    port: 3000, // Standard-Port, kann nach Bedarf geändert werden
  }
});
