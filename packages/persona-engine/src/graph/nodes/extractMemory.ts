import { MemorySystem } from "../../MemorySystem";
import type { GraphState } from "../types";

export function extractMemory(state: GraphState): Partial<GraphState> {
  if (!state.parsedResponse) {
    return {};
  }

  // Get recent conversation turn (last user message + assistant response)
  const recentMessages = [
    {
      role: "user" as const,
      content: state.message,
      timestamp: new Date(),
    },
    {
      role: "assistant" as const,
      content: state.parsedResponse.message,
      narration: state.parsedResponse.narration,
      timestamp: new Date(),
    },
  ];

  // Store current memory count before extraction
  const memoryCountBefore = state.persona.memory.length;

  // Extract memories from the conversation (modifies persona in place)
  MemorySystem.extractAndStoreMemory(state.persona, recentMessages);

  // Get newly added memories (those added in this extraction)
  const extractedMemories = state.persona.memory.slice(memoryCountBefore);

  // Return extracted memories and updated persona
  return {
    extractedMemories,
    persona: state.persona, // Ensure persona updates are reflected in state
  };
}
