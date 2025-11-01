import { Annotation } from "@langchain/langgraph";
import type { MemoryEntry, Quest } from "persona-storage";
import type { ChatResponse } from "../types";

// Define the state annotation for LangGraph
export const GraphStateAnnotation = Annotation.Root({
  persona: Annotation<import("persona-storage").Persona>(),
  message: Annotation<string>(),
  context: Annotation<Record<string, string>>({
    default: () => ({}),
    reducer: (x, y) => ({ ...x, ...y }),
  }),
  retrievedMemories: Annotation<MemoryEntry[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  formattedMessages: Annotation<Array<{ role: "system" | "user" | "assistant"; content: string }>>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  llmResponse: Annotation<string>({
    default: () => "",
    reducer: (x, y) => y || x,
  }),
  parsedResponse: Annotation<ChatResponse | undefined>({
    default: () => undefined,
    reducer: (x, y) => y || x,
  }),
  extractedMemories: Annotation<MemoryEntry[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  generatedQuests: Annotation<Quest[]>({
    default: () => [],
    reducer: (x, y) => [...x, ...y],
  }),
  error: Annotation<Error | undefined>({
    default: () => undefined,
    reducer: (x, y) => y || x,
  }),
  retryCount: Annotation<number>({
    default: () => 0,
    reducer: (x, y) => y ?? x,
  }),
  maxRetries: Annotation<number>({
    default: () => 3,
    reducer: (x, y) => y ?? x,
  }),
  modelManager: Annotation<import("../ModelManager").ModelManager>(),
});

export type GraphState = typeof GraphStateAnnotation.State;
