import type { MemoryEntry, Persona } from "persona-storage";

export interface ModelConfig {
  id: string;
  name: string;
  size: string;
  description: string;
}

export interface ChatResponse {
  message: string;
  narration?: string;
  quests?: import("persona-storage").Quest[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelProgress {
  text: string;
  progress: number;
}

export type InitProgressCallback = (progress: ModelProgress) => void;

export interface PersonaEngineConfig {
  modelConfig: ModelConfig;
  progressCallback?: InitProgressCallback;
}

export interface ChatOptions {
  persona: Persona;
  message: string;
  context?: Record<string, string>;
  maxRetries?: number;
}

export interface MemorySearchResult {
  memory: MemoryEntry;
  score: number;
}

export interface RetrievalOptions {
  persona: Persona;
  query: string;
  limit?: number;
  minScore?: number;
}
