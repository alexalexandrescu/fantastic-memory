import { MemorySystem } from "../../MemorySystem";
import type { GraphState } from "../types";

export function retrieveMemory(state: GraphState): Partial<GraphState> {
  const relevantMemories = MemorySystem.retrieveMemories({
    persona: state.persona,
    query: state.message,
    limit: 3,
  });

  return {
    retrievedMemories: relevantMemories,
  };
}
