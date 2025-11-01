import type { ChatResponse } from "../../types";
import type { GraphState } from "../types";

export async function llmCall(state: GraphState): Promise<Partial<GraphState>> {
  try {
    const response = await state.modelManager.chat(state.formattedMessages, {
      temperature: state.persona.modelParams.temperature,
      top_p: state.persona.modelParams.topP,
    });

    // Process streaming response
    let fullResponse = "";
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
    }

    // Parse JSON response
    let parsedResponse: { narration?: string; message: string };
    try {
      parsedResponse = JSON.parse(fullResponse);
    } catch {
      parsedResponse = { message: fullResponse };
    }

    const chatResponse: ChatResponse = {
      message: parsedResponse.message || fullResponse,
      narration: parsedResponse.narration,
    };

    return {
      llmResponse: fullResponse,
      parsedResponse: chatResponse,
      error: undefined,
    };
  } catch (error) {
    return {
      error: error as Error,
    };
  }
}
