import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initPwaInstall, registerServiceWorker } from "./lib/pwa-install";
import { TRPCProvider } from "./providers";
import "./styles/globals.css";

// Attach before first render: beforeinstallprompt can fire before React mounts.
initPwaInstall();
registerServiceWorker();

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found");
}

createRoot(container).render(
  <StrictMode>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </StrictMode>,
);
