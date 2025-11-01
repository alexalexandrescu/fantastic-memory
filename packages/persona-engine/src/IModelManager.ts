import type { InitProgressCallback, ModelConfig } from "./types";

/**
 * Chat completion message parameter compatible with web-llm format
 */
export interface ChatCompletionMessageParam {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Chat completion chunk compatible with web-llm streaming format
 */
export interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

/**
 * Interface for model managers that can be used with PersonaEngine
 * Abstracts the implementation details between browser (web-llm) and Node.js (Ollama) backends
 */
export interface IModelManager {
  /**
   * Initialize the model engine with a specific model
   */
  init(
    modelConfig: ModelConfig,
    progressCallback?: InitProgressCallback
  ): Promise<void>;

  /**
   * Get chat completions using the current engine
   * Returns a streaming async iterable of chat completion chunks
   */
  chat(
    messages: Array<ChatCompletionMessageParam>,
    options?: { temperature?: number; top_p?: number; max_tokens?: number }
  ): Promise<AsyncIterable<ChatCompletionChunk>>;

  /**
   * Check if the engine is initialized and ready
   */
  isReady(): boolean;

  /**
   * Get the current model ID
   */
  getCurrentModel(): string | null;

  /**
   * Dispose of the current engine and clean up resources
   */
  dispose(): Promise<void>;
}

