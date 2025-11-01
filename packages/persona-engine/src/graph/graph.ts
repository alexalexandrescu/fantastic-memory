import { StateGraph } from "@langchain/langgraph";
import { extractMemory } from "./nodes/extractMemory";
import { formatPrompt } from "./nodes/formatPrompt";
import { generateQuest } from "./nodes/generateQuest";
import { handleError } from "./nodes/handleError";
import { llmCall } from "./nodes/llmCall";
import { retrieveMemory } from "./nodes/retrieveMemory";
import { storeMemory } from "./nodes/storeMemory";
import { updateImportance } from "./nodes/updateImportance";
import { type GraphState, GraphStateAnnotation } from "./types";

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
 * Create the persona chat graph
 */
export function createPersonaGraph() {
  const workflow = new StateGraph(GraphStateAnnotation);

  // Add nodes (using type assertions to work around strict LangGraph typing)
  workflow.addNode("retrieve_memory", retrieveMemory as any);
  workflow.addNode("format_prompt", formatPrompt as any);
  workflow.addNode("llm_call", llmCall as any);
  workflow.addNode("handle_error", handleError as any);
  workflow.addNode("extract_memory", extractMemory as any);
  workflow.addNode("update_importance", updateImportance as any);
  workflow.addNode("store_memory", storeMemory as any);
  workflow.addNode("generate_quest", generateQuest as any);

  // Define edges (using type assertions for LangGraph strict typing)
  (workflow as any).addEdge("__start__", "retrieve_memory");
  (workflow as any).addEdge("retrieve_memory", "format_prompt");
  (workflow as any).addEdge("format_prompt", "llm_call");

  // Conditional edge from llm_call
  (workflow as any).addConditionalEdges("llm_call", shouldRetry, {
    retry: "handle_error",
    continue: "extract_memory",
    fail: "handle_error", // Will throw in handle_error
  });

  // Error handling retry loop
  (workflow as any).addEdge("handle_error", "llm_call");

  // Memory processing flow
  (workflow as any).addEdge("extract_memory", "update_importance");
  (workflow as any).addEdge("update_importance", "store_memory");

  // Conditional quest generation
  (workflow as any).addConditionalEdges("store_memory", shouldGenerateQuestConditional, {
    generate_quest: "generate_quest",
    end: "__end__",
  });

  (workflow as any).addEdge("generate_quest", "__end__");

  return workflow.compile();
}
