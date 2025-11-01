import { MemorySystem } from "../../MemorySystem";
import type { GraphState } from "../types";

export function formatPrompt(state: GraphState): Partial<GraphState> {
  let systemPrompt = state.persona.systemPrompt;

  // Add memory context to system prompt
  if (state.retrievedMemories.length > 0) {
    const memoryText = MemorySystem.formatMemoriesForPrompt(state.retrievedMemories);
    systemPrompt += memoryText;
  }

  // Build user prompt with template
  const userPrompt = state.persona.userPromptTemplate
    .replace("{message}", state.message)
    .replace("{context}", state.context ? JSON.stringify(state.context) : "");

  // Build messages array
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
    ...state.persona.conversationHistory.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userPrompt },
  ];

  return {
    formattedMessages: messages,
  };
}
