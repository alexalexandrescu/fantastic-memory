import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { App } from "./components/App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>
);
