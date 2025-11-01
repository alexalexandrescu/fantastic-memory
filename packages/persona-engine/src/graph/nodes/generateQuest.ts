import type { Quest } from "persona-storage";
import type { GraphState } from "../types";

/**
 * Analyze conversation context to determine if a quest should be generated
 */
function shouldGenerateQuest(state: GraphState): boolean {
  if (!state.parsedResponse) {
    return false;
  }

  const conversation = state.parsedResponse.message.toLowerCase();
  const userMessage = state.message.toLowerCase();

  // Quest trigger patterns
  const questTriggers = [
    /(quest|mission|task|job|adventure)/,
    /(need|want|looking for|searching)/,
    /(help|assist|aid)/,
    /(reward|payment|gold|coins)/,
  ];

  // Check if conversation mentions quest-like content
  const hasQuestKeywords = questTriggers.some(
    pattern => pattern.test(conversation) || pattern.test(userMessage)
  );

  // Also check if persona type is quest-related
  const isQuestNPC =
    state.persona.type === "quest-npc" ||
    state.persona.systemPrompt.toLowerCase().includes("quest");

  return hasQuestKeywords || isQuestNPC;
}

/**
 * Generate a quest based on conversation context using LLM
 */
export async function generateQuest(state: GraphState): Promise<Partial<GraphState>> {
  if (!shouldGenerateQuest(state) || !state.parsedResponse) {
    return { generatedQuests: [] };
  }

  try {
    // Build quest generation prompt
    const questPrompt = `Based on this conversation, generate an appropriate quest for the party.

Persona: ${state.persona.name}
Personality: ${JSON.stringify(state.persona.personality)}
Last user message: ${state.message}
NPC response: ${state.parsedResponse.message}

Generate a quest as JSON with these exact fields:
{
  "title": "Quest title",
  "description": "Detailed quest description",
  "partySize": 4,
  "level": 5,
  "rewards": "Optional reward description"
}

Respond only with valid JSON, no other text.`;

    const questMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content:
          "You are a quest generation assistant. Generate quests that match the NPC's personality and the conversation context.",
      },
      { role: "user", content: questPrompt },
    ];

    const response = await state.modelManager.chat(questMessages, {
      temperature: 0.7,
      top_p: 0.9,
    });

    // Aggregate streaming response
    let fullResponse = "";
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
    }

    // Parse quest JSON
    try {
      const questData = JSON.parse(fullResponse);
      const quest: Quest = {
        id: crypto.randomUUID(),
        title: questData.title || "Untitled Quest",
        description: questData.description || "",
        status: "active",
        partySize: questData.partySize || 4,
        level: questData.level || 5,
        rewards: questData.rewards,
        createdAt: new Date(),
      };

      return {
        generatedQuests: [quest],
      };
    } catch (parseError) {
      // If JSON parsing fails, return empty quests
      console.warn("Failed to parse quest JSON:", parseError);
      return { generatedQuests: [] };
    }
  } catch (error) {
    console.warn("Quest generation failed:", error);
    return { generatedQuests: [] };
  }
}
