import type { Message, Persona } from "persona-storage";
import { createPersonaGraph } from "./graph/graph";
import { MemorySystem } from "./MemorySystem";
import { ModelManager } from "./ModelManager";
import type { ChatOptions, ChatResponse } from "./types";

export class PersonaEngine {
  private modelManager: ModelManager;
  private graph = createPersonaGraph();

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
   * Chat with a persona using LangGraph orchestration
   */
  async chat(options: ChatOptions): Promise<ChatResponse> {
    const { persona, message, context, maxRetries = 3 } = options;

    if (!this.modelManager.isReady()) {
      throw new Error("Model not initialized");
    }

    // Initialize graph state
    const initialState = {
      persona,
      message,
      context: context || {},
      retrievedMemories: [],
      formattedMessages: [],
      llmResponse: "",
      parsedResponse: undefined,
      extractedMemories: [],
      generatedQuests: [],
      error: undefined,
      retryCount: 0,
      maxRetries,
      modelManager: this.modelManager,
    };

    // Invoke graph
    const finalState = await this.graph.invoke(initialState as any);

    if (!finalState.parsedResponse) {
      throw finalState.error || new Error("Failed to get response from model");
    }

    // Build response with quests if generated
    const response: ChatResponse = {
      message: finalState.parsedResponse.message,
      narration: finalState.parsedResponse.narration,
      quests: finalState.generatedQuests.length > 0 ? finalState.generatedQuests : undefined,
    };

    return response;
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
