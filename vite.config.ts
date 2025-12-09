import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify("https://tcriouzorxknubqqnvyj.supabase.co"),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcmlvdXpvcnhrbnVicXFudnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDEwNTIsImV4cCI6MjA4MDc3NzA1Mn0.XjR9THLRgKapRkJSlxJg_H82fmMuv4UNLww8k1PriL4"),
  },
}));
