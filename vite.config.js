import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    sourcemap: true,
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    port: 5003, // Frontend running on port 5003
    proxy: {
      "/translate": {
        target: "http://localhost:5000", // Proxy requests to the backend on port 5000
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
