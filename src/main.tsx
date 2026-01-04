import { createRoot } from "react-dom/client";
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import App from "./App.tsx";
import "./index.css";
import { capacitorStorage, migrateSessionToNativeStorage } from "@/lib/capacitorStorage";

// Reconfigure Supabase client for native platforms with persistent storage
async function initializeApp() {
  // On native platforms, migrate any existing localStorage session to native storage
  if (Capacitor.isNativePlatform()) {
    await migrateSessionToNativeStorage();
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

initializeApp();
