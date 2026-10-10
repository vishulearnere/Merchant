import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    cors: true,
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:5000/v1"),
  },
});
