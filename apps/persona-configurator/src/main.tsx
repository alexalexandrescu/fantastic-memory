import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { App } from "./components/App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>
);
