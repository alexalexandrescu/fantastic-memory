import { MemorySystem } from "../../MemorySystem";
import type { GraphState } from "../types";

export function updateImportance(state: GraphState): Partial<GraphState> {
  // Get IDs of memories that were accessed in this turn
  const accessedMemoryIds = state.retrievedMemories.map(m => m.id);

  // Update importance based on access patterns
  MemorySystem.updateImportanceFromAccess(state.persona, accessedMemoryIds);

  return {};
}
