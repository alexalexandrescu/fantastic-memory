import type { ChatResponse } from "../../types";
import type { GraphState } from "../types";

export async function llmCall(state: GraphState): Promise<Partial<GraphState>> {
  try {
    const startTime = Date.now();
    const response = await state.modelManager.chat(state.formattedMessages, {
      temperature: state.persona.modelParams.temperature,
      top_p: state.persona.modelParams.topP,
    });

    // Process streaming response with progress indication
    let fullResponse = "";
    let chunkCount = 0;
    const progressInterval = setInterval(() => {
      if (chunkCount > 0) {
        process.stdout.write(`\r    [Streaming... ${chunkCount} chunks, ${fullResponse.length} chars]`);
      }
    }, 500); // Update every 500ms

    try {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullResponse += content;
        chunkCount++;
      }
    } finally {
      clearInterval(progressInterval);
      process.stdout.write("\r"); // Clear progress line
    }

    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== "test" || process.env.VERBOSE_TESTS === "true") {
      console.log(`    [LLM call completed: ${fullResponse.length} chars in ${duration}ms]`);
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
