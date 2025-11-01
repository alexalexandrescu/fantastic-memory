import type { MemoryEntry, Persona, Quest } from "persona-storage";
import type { IModelManager } from "../IModelManager";
import type { ChatResponse } from "../types";

// Define the graph state interface
export interface GraphState {
  persona: Persona;
  message: string;
  context: Record<string, string>;
  retrievedMemories: MemoryEntry[];
  formattedMessages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  llmResponse: string;
  parsedResponse?: ChatResponse;
  extractedMemories: MemoryEntry[];
  generatedQuests: Quest[];
  error?: Error;
  retryCount: number;
  maxRetries: number;
  modelManager: IModelManager;
}
