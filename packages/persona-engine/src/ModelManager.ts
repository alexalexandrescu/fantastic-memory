import * as webllm from "@mlc-ai/web-llm";
import type { InitProgressCallback, ModelConfig } from "./types";

export class ModelManager {
  private engine: webllm.MLCEngineInterface | null = null;
  private currentModel: string | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the model engine with a specific model
   */
  async init(modelConfig: ModelConfig, progressCallback?: InitProgressCallback): Promise<void> {
    // If already initialized with this model, skip
    if (this.isInitialized && this.currentModel === modelConfig.id) {
      return;
    }

    // Unload existing engine if switching models
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
    }

    const initProgressCallback = (report: webllm.InitProgressReport): void => {
      if (progressCallback) {
        progressCallback({
          text: report.text,
          progress: report.progress,
        });
      }
    };

    const engineConfig: webllm.MLCEngineConfig = {
      initProgressCallback,
    };

    this.engine = await webllm.CreateMLCEngine(modelConfig.id, engineConfig);
    this.currentModel = modelConfig.id;
    this.isInitialized = true;
  }

  /**
   * Get chat completions using the current engine
   */
  async chat(
    messages: Array<webllm.ChatCompletionMessageParam>,
    options?: { temperature?: number; top_p?: number; max_tokens?: number }
  ): Promise<AsyncIterable<webllm.ChatCompletionChunk>> {
    if (!this.engine || !this.isInitialized) {
      throw new Error("Model engine not initialized. Call init() first.");
    }

    const response = await this.engine.chat.completions.create({
      messages,
      stream: true,
      ...options,
    });
    return response as AsyncIterable<webllm.ChatCompletionChunk>;
  }

  /**
   * Check if the engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.engine !== null;
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
    if (this.engine) {
      await this.engine.unload();
      this.engine = null;
    }
    this.isInitialized = false;
    this.currentModel = null;
  }

  /**
   * Get available models
   */
  static getAvailableModels(): ModelConfig[] {
    return [
      {
        id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
        name: "Llama 3.1 8B",
        size: "4.7GB",
        description: "Fast and capable instruction-tuned model",
      },
      {
        id: "Phi-3.5-mini-instruct-q4f32_1-MLC",
        name: "Phi 3.5 Mini",
        size: "2.4GB",
        description: "Lightweight and efficient model",
      },
      {
        id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC",
        name: "TinyLlama 1.1B",
        size: "741MB",
        description: "Ultra-lightweight for quick responses",
      },
      {
        id: "Mistral-7B-Instruct-v0.2-q4f32_1-MLC",
        name: "Mistral 7B",
        size: "4.1GB",
        description: "High-quality instruction following",
      },
    ];
  }
}
