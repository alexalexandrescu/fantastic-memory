import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  IModelManager,
} from "./IModelManager";
import type { InitProgressCallback, ModelConfig } from "./types";

/**
 * Maps web-llm model IDs to Ollama model names
 */
const MODEL_ID_TO_OLLAMA: Record<string, string> = {
  "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC": "tinyllama",
  "Llama-3.1-8B-Instruct-q4f32_1-MLC": "llama3.1:8b",
  "Phi-3.5-mini-instruct-q4f32_1-MLC": "phi3",
  "Mistral-7B-Instruct-v0.2-q4f32_1-MLC": "mistral:7b",
};

/**
 * Node.js model manager using Ollama API
 * Implements IModelManager interface for testing in Node.js environments
 */
export class NodeModelManager implements IModelManager {
  private currentModel: string | null = null;
  private isInitialized: boolean = false;
  private ollamaBaseUrl: string;

  constructor(ollamaBaseUrl: string = "http://localhost:11434") {
    this.ollamaBaseUrl = ollamaBaseUrl;
  }

  /**
   * Initialize the model engine with a specific model
   * For Ollama, this checks if the model is available and pulls it if needed
   */
  async init(
    modelConfig: ModelConfig,
    progressCallback?: InitProgressCallback
  ): Promise<void> {
    // If already initialized with this model, skip
    if (this.isInitialized && this.currentModel === modelConfig.id) {
      return;
    }

    const ollamaModelName = MODEL_ID_TO_OLLAMA[modelConfig.id];
    if (!ollamaModelName) {
      throw new Error(
        `Model ${modelConfig.id} not supported. Available mappings: ${Object.keys(MODEL_ID_TO_OLLAMA).join(", ")}`
      );
    }

    if (progressCallback) {
      progressCallback({
        text: `Checking Ollama model: ${ollamaModelName}`,
        progress: 0.1,
      });
    }

    // Check if Ollama service is available (with timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for service check
      try {
        const response = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error("Ollama service not available");
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          throw new Error("Ollama service check timeout");
        }
        throw fetchError;
      }
    } catch (error) {
      throw new Error(
        `Ollama service not available at ${this.ollamaBaseUrl}. Make sure Ollama is running.`
      );
    }

    // Check if model exists, pull if not
    if (progressCallback) {
      progressCallback({
        text: `Ensuring model ${ollamaModelName} is available...`,
        progress: 0.3,
      });
    }

    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 10000); // 10 second timeout for model list
    let modelsData;
    try {
      const modelsResponse = await fetch(`${this.ollamaBaseUrl}/api/tags`, {
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);
      modelsData = await modelsResponse.json();
    } catch (fetchError) {
      clearTimeout(timeoutId2);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("Failed to list Ollama models: timeout");
      }
      throw fetchError;
    }

    const modelExists = modelsData.models?.some(
      (m: { name: string }) => m.name === ollamaModelName || m.name.startsWith(`${ollamaModelName}:`)
    );

    if (!modelExists) {
      if (progressCallback) {
        progressCallback({
          text: `Pulling model ${ollamaModelName}...`,
          progress: 0.5,
        });
      }

      // Pull the model (with timeout - model pulls can take a long time)
      const pullController = new AbortController();
      const pullTimeoutId = setTimeout(() => pullController.abort(), 600000); // 10 minute timeout for model pull

      try {
        const pullResponse = await fetch(`${this.ollamaBaseUrl}/api/pull`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: ollamaModelName, stream: false }),
          signal: pullController.signal,
        });

        clearTimeout(pullTimeoutId);

        if (!pullResponse.ok) {
          throw new Error(
            `Failed to pull model ${ollamaModelName}: ${pullResponse.statusText}`
          );
        }

        await pullResponse.json(); // Wait for pull to complete
      } catch (pullError) {
        clearTimeout(pullTimeoutId);
        if (pullError instanceof Error && pullError.name === "AbortError") {
          throw new Error(`Model pull timeout after 10 minutes`);
        }
        throw pullError;
      }
    }

    if (progressCallback) {
      progressCallback({
        text: `Model ${ollamaModelName} ready`,
        progress: 1.0,
      });
    }

    this.currentModel = modelConfig.id;
    this.isInitialized = true;
  }

  /**
   * Get chat completions using Ollama API
   */
  async chat(
    messages: Array<ChatCompletionMessageParam>,
    options?: { temperature?: number; top_p?: number; max_tokens?: number }
  ): Promise<AsyncIterable<ChatCompletionChunk>> {
    if (!this.isInitialized || !this.currentModel) {
      throw new Error("Model engine not initialized. Call init() first.");
    }

    const ollamaModelName = MODEL_ID_TO_OLLAMA[this.currentModel];
    if (!ollamaModelName) {
      throw new Error(`Model ${this.currentModel} not mapped to Ollama model`);
    }

    // Convert messages to Ollama format
    const ollamaMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call Ollama API with streaming (add timeout to prevent hanging)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModelName,
          messages: ollamaMessages,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            top_p: options?.top_p,
            num_predict: options?.max_tokens,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`
        );
      }

      // Return async iterable that yields ChatCompletionChunk format
      return this.streamOllamaResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Ollama request timeout after 60 seconds");
      }
      throw error;
    }
  }

  /**
   * Convert Ollama streaming response to ChatCompletionChunk format
   */
  private async *streamOllamaResponse(
    response: Response
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Process any remaining buffer content before breaking
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.trim());
              if (data.message?.content) {
                yield {
                  choices: [
                    {
                      delta: {
                        content: data.message.content,
                      },
                    },
                  ],
                };
              }
            } catch {
              // Ignore parsing errors on final buffer
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue;

          try {
            const data = JSON.parse(line);
            // Yield content if available
            if (data.message?.content) {
              yield {
                choices: [
                  {
                    delta: {
                      content: data.message.content,
                    },
                  },
                ],
              };
            }
            // Check for done flag - Ollama sends this when stream completes
            // Also check if done is explicitly true (not just truthy)
            if (data.done === true || data.done === "true") {
              // Process any remaining content in this message if done
              return;
            }
          } catch (parseError) {
            // Skip invalid JSON lines (but log in development)
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to parse Ollama stream line:", line);
            }
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Check if the engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the current model ID
   */
  getCurrentModel(): string | null {
    return this.currentModel;
  }

  /**
   * Dispose of the current engine
   */
  async dispose(): Promise<void> {
    this.isInitialized = false;
    this.currentModel = null;
  }
}

