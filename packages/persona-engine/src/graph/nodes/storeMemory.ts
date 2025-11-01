import type { GraphState } from "../types";

export function storeMemory(_state: GraphState): Partial<GraphState> {
  // Memories are already stored in persona.memory by extractMemory
  // This node is a placeholder for any additional storage logic
  // The actual persistence happens in ChatInterface
  return {};
}
