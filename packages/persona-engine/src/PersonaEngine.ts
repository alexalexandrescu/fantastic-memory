import type { Message, Persona } from "persona-storage";
import { MemorySystem } from "./MemorySystem";
import { ModelManager } from "./ModelManager";
import type { ChatOptions, ChatResponse } from "./types";

export class PersonaEngine {
  private modelManager: ModelManager;

  constructor() {
    this.modelManager = new ModelManager();
  }

  /**
   * Initialize the engine with a model
   */
  async initModel(
    modelId: string,
    progressCallback?: (progress: { text: string; progress: number }) => void
  ): Promise<void> {
    const models = ModelManager.getAvailableModels();
    const modelConfig = models.find(m => m.id === modelId);

    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }

    await this.modelManager.init(modelConfig, progressCallback);
  }

  /**
   * Chat with a persona
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const { persona, message, context, maxRetries = 3 } = options;

    if (!this.modelManager.isReady()) {
      throw new Error("Model not initialized");
    }

    // Retrieve relevant memories
    const relevantMemories = MemorySystem.retrieveMemories({
      persona,
      query: message,
      limit: 3,
    });

    // Build the system prompt with personality and memories
    let systemPrompt = persona.systemPrompt;

    // Add memory context to system prompt
    if (relevantMemories.length > 0) {
      const memoryText = MemorySystem.formatMemoriesForPrompt(relevantMemories);
      systemPrompt += memoryText;
    }

    // Build user prompt with template
    const userPrompt = persona.userPromptTemplate
      .replace("{message}", message)
      .replace("{context}", context ? JSON.stringify(context) : "");

    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...persona.conversationHistory.map(msg => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userPrompt },
    ];

    // Get response from model
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.modelManager.chat(messages, {
          temperature: persona.modelParams.temperature,
          top_p: persona.modelParams.topP,
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
          // Try to parse as JSON
          parsedResponse = JSON.parse(fullResponse);
        } catch {
          // Fallback: treat entire response as message if not JSON
          parsedResponse = { message: fullResponse };
        }

        const chatResponse: ChatResponse = {
          message: parsedResponse.message || fullResponse,
          narration: parsedResponse.narration,
        };

        return chatResponse;
      } catch (error) {
        lastError = error as Error;
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw lastError || new Error("Failed to get response from model");
  }

  /**
   * Extract and store memories from conversation
   */
  extractMemories(persona: Persona, messages: Message[]): void {
    MemorySystem.extractAndStoreMemory(persona, messages);
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.modelManager.isReady();
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    await this.modelManager.dispose();
  }
}
