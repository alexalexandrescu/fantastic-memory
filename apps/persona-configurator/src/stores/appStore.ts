import type { Persona } from "persona-storage";
import { create } from "zustand";

interface AppState {
  // Current persona
  currentPersona: Persona | null;
  setCurrentPersona: (persona: Persona | null) => void;

  // Model state
  selectedModel: string | null;
  setSelectedModel: (model: string) => void;
  isModelLoading: boolean;
  setIsModelLoading: (loading: boolean) => void;
  modelProgress: string;
  setModelProgress: (progress: string) => void;

  // UI state
  activePane: "personas" | "chat" | "tweaking";
  setActivePane: (pane: "personas" | "chat" | "tweaking") => void;
}

export const useAppStore = create<AppState>(set => ({
  // Current persona
  currentPersona: null,
  setCurrentPersona: persona => set({ currentPersona: persona }),

  // Model state
  selectedModel: null,
  setSelectedModel: model => set({ selectedModel: model }),
  isModelLoading: false,
  setIsModelLoading: loading => set({ isModelLoading: loading }),
  modelProgress: "",
  setModelProgress: progress => set({ modelProgress: progress }),

  // UI state
  activePane: "personas",
  setActivePane: pane => set({ activePane: pane }),
}));
