import { extractMemory } from "./nodes/extractMemory";
import { formatPrompt } from "./nodes/formatPrompt";
import { generateQuest } from "./nodes/generateQuest";
import { handleError } from "./nodes/handleError";
import { llmCall } from "./nodes/llmCall";
import { retrieveMemory } from "./nodes/retrieveMemory";
import { storeMemory } from "./nodes/storeMemory";
import { updateImportance } from "./nodes/updateImportance";
import type { GraphState } from "./types";

/**
 * Conditional edge to determine if LLM call should retry on error
 */
function shouldRetry(state: GraphState): string {
  if (state.error && state.retryCount < state.maxRetries) {
    return "retry";
  }
  if (state.error) {
    return "fail";
  }
  return "continue";
}

/**
 * Conditional edge to determine if quest should be generated
 */
function shouldGenerateQuestConditional(state: GraphState): string {
  // Check if quest generation is appropriate
  if (!state.parsedResponse) {
    return "end";
  }

  const conversation = state.parsedResponse.message.toLowerCase();
  const userMessage = state.message.toLowerCase();
  const questTriggers = [
    /(quest|mission|task|job|adventure)/,
    /(need|want|looking for|searching)/,
    /(help|assist|aid)/,
  ];

  const hasQuestKeywords = questTriggers.some(
    pattern => pattern.test(conversation) || pattern.test(userMessage)
  );
  const isQuestNPC =
    state.persona.type === "quest-npc" ||
    state.persona.systemPrompt.toLowerCase().includes("quest");

  if (hasQuestKeywords || isQuestNPC) {
    return "generate_quest";
  }

  return "end";
}

/**
 * Simple graph node type
 */
type GraphNode = (
  state: GraphState
) => GraphState | Partial<GraphState> | Promise<GraphState | Partial<GraphState>>;

/**
 * Simple graph with conditional edges and state management
 */
class SimpleGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, string> = new Map();
  private conditionalEdges: Map<
    string,
    { condition: (state: GraphState) => string; mapping: Record<string, string> }
  > = new Map();

  addNode(name: string, node: GraphNode): void {
    this.nodes.set(name, node);
  }

  addEdge(from: string, to: string): void {
    this.edges.set(from, to);
  }

  addConditionalEdges(
    from: string,
    condition: (state: GraphState) => string,
    mapping: Record<string, string>
  ): void {
    this.conditionalEdges.set(from, { condition, mapping });
  }

  /**
   * Execute the graph starting from a given node
   */
  async execute(startNode: string, initialState: GraphState): Promise<GraphState> {
    let currentNode = startNode;
    let state = initialState;
    let maxIterations = 100; // Safety limit for graph execution

    while (currentNode !== "__end__") {
      if (maxIterations-- <= 0) {
        throw new Error("Graph execution exceeded maximum iterations");
      }

      const node = this.nodes.get(currentNode);
      if (!node) {
        throw new Error(`Node ${currentNode} not found`);
      }

      // Execute node
      const result = await node(state);
      // Merge result into state
      state = { ...state, ...result };

      // Determine next node
      const conditionalEdge = this.conditionalEdges.get(currentNode);
      if (conditionalEdge) {
        const nextKey = conditionalEdge.condition(state);
        currentNode = conditionalEdge.mapping[nextKey] || "__end__";
      } else {
        currentNode = this.edges.get(currentNode) || "__end__";
      }
    }

    return state;
  }
}

/**
 * Create the persona chat graph
 */
export function createPersonaGraph() {
  const workflow = new SimpleGraph();

  // Add nodes
  workflow.addNode("retrieve_memory", retrieveMemory);
  workflow.addNode("format_prompt", formatPrompt);
  workflow.addNode("llm_call", llmCall);
  workflow.addNode("handle_error", handleError);
  workflow.addNode("extract_memory", extractMemory);
  workflow.addNode("update_importance", updateImportance);
  workflow.addNode("store_memory", storeMemory);
  workflow.addNode("generate_quest", generateQuest);

  // Define edges
  // Note: __start__ is a special marker, not a real node
  workflow.addEdge("retrieve_memory", "format_prompt");
  workflow.addEdge("format_prompt", "llm_call");

  // Conditional edge from llm_call
  workflow.addConditionalEdges("llm_call", shouldRetry, {
    retry: "handle_error",
    continue: "extract_memory",
    fail: "handle_error", // Will throw in handle_error
  });

  // Error handling retry loop
  workflow.addEdge("handle_error", "llm_call");

  // Memory processing flow
  workflow.addEdge("extract_memory", "update_importance");
  workflow.addEdge("update_importance", "store_memory");

  // Conditional quest generation
  workflow.addConditionalEdges("store_memory", shouldGenerateQuestConditional, {
    generate_quest: "generate_quest",
    end: "__end__",
  });

  workflow.addEdge("generate_quest", "__end__");

  return {
    invoke: async (initialState: GraphState) => {
      // Start from retrieve_memory as the first real node in the graph
      return await workflow.execute("retrieve_memory", initialState);
    },
  };
}
