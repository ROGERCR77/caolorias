import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import "./index.css";

async function bootstrap() {
  if (Capacitor.isNativePlatform()) {
    const { migrateSessionToNativeStorage } = await import("./lib/capacitorStorage");
    await migrateSessionToNativeStorage();
  }

  const { default: App } = await import("./App.tsx");

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
