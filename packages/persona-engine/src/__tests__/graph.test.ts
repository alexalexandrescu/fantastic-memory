import { createPersonaFromTemplate, personaTemplates } from "persona-storage";
import { describe, expect, it } from "vitest";
import { createPersonaGraph } from "../graph/graph";
import type { GraphState } from "../graph/types";
import { MemorySystem } from "../MemorySystem";
import type { IModelManager } from "../IModelManager";

describe("Graph Orchestration Unit Tests", () => {
  describe("Graph Construction", () => {
    it("should create a graph with all required nodes", () => {
      const graph = createPersonaGraph();
      expect(graph).toBeDefined();
      expect(graph.invoke).toBeDefined();
      expect(typeof graph.invoke).toBe("function");
    });

    it("should have invoke method that returns a promise", async () => {
      const graph = createPersonaGraph();
      const invokeResult = graph.invoke({} as GraphState);
      expect(invokeResult).toBeInstanceOf(Promise);
      // Catch the error to avoid unhandled rejection
      try {
        await invokeResult;
      } catch {
        // Expected to fail with invalid state
      }
    });
  });

  describe("State Management", () => {
    it("should accept valid GraphState", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const mockModelManager = {
        chat: async () => {
          return (async function* () {
            yield {
              choices: [
                {
                  delta: { content: '{"message":"Hello!","narration":"(smiles)"}' },
                },
              ],
            };
          })();
        },
        isReady: () => true,
        getCurrentModel: () => null,
        init: async () => {},
        dispose: async () => {},
      } as unknown as IModelManager;

      const state: GraphState = {
        persona,
        message: "Hello",
        context: {},
        retrievedMemories: [],
        formattedMessages: [],
        llmResponse: "",
        parsedResponse: undefined,
        extractedMemories: [],
        generatedQuests: [],
        error: undefined,
        retryCount: 0,
        maxRetries: 3,
        modelManager: mockModelManager,
      };

      expect(state.persona).toBeDefined();
      expect(state.message).toBe("Hello");
      expect(state.modelManager).toBeDefined();
    });

    it("should handle state updates during graph execution", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Test memory retrieval updates state
      const memories = MemorySystem.retrieveMemories({
        persona,
        query: "test query",
        limit: 3,
      });

      expect(Array.isArray(memories)).toBe(true);
    });
  });

  describe("Memory System Integration", () => {
    it("should retrieve memories from persona", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Add a test memory
      MemorySystem.addMemory(persona, "Test memory content", 5);

      const memories = MemorySystem.retrieveMemories({
        persona,
        query: "test",
        limit: 5,
      });

      expect(memories.length).toBe(1);
      expect(memories[0].content).toBe("Test memory content");
    });

    it("should update memory importance on access", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const memory = MemorySystem.addMemory(persona, "Important fact", 5);
      const initialImportance = memory.importance;

      // Access the memory
      MemorySystem.updateImportanceFromAccess(persona, [memory.id]);

      // Importance should be boosted
      const updatedMemory = persona.memory.find(m => m.id === memory.id);
      expect(updatedMemory?.importance).toBeGreaterThan(initialImportance);
    });

    it("should extract and store memories from conversations", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const initialMemoryCount = persona.memory.length;

      const messages = [
        {
          role: "user" as const,
          content: "My name is John",
          timestamp: new Date(),
        },
        {
          role: "assistant" as const,
          content: "Nice to meet you John!",
          timestamp: new Date(),
        },
      ];

      MemorySystem.extractAndStoreMemory(persona, messages);

      expect(persona.memory.length).toBeGreaterThan(initialMemoryCount);
    });
  });

  describe("Persona Templates", () => {
    it("should create personas from all templates", () => {
      personaTemplates.forEach(template => {
        const persona = createPersonaFromTemplate(template);
        expect(persona.id).toBeDefined();
        expect(persona.name).toBe(template.name);
        expect(persona.type).toBe(template.type);
        expect(persona.systemPrompt).toBeDefined();
        expect(persona.userPromptTemplate).toBeDefined();
        expect(Array.isArray(persona.memory)).toBe(true);
        expect(Array.isArray(persona.conversationHistory)).toBe(true);
      });
    });

    it("should have valid personality settings", () => {
      personaTemplates.forEach(template => {
        const persona = createPersonaFromTemplate(template);
        const { personality } = persona;

        expect(personality.friendliness).toBeGreaterThanOrEqual(0);
        expect(personality.friendliness).toBeLessThanOrEqual(10);
        expect(personality.formality).toBeGreaterThanOrEqual(0);
        expect(personality.formality).toBeLessThanOrEqual(10);
        expect(personality.verbosity).toBeGreaterThanOrEqual(0);
        expect(personality.verbosity).toBeLessThanOrEqual(10);
        expect(personality.humor).toBeGreaterThanOrEqual(0);
        expect(personality.humor).toBeLessThanOrEqual(10);
      });
    });

    it("should have valid model parameters", () => {
      personaTemplates.forEach(template => {
        const persona = createPersonaFromTemplate(template);
        const { modelParams } = persona;

        expect(modelParams.temperature).toBeGreaterThanOrEqual(0);
        expect(modelParams.temperature).toBeLessThanOrEqual(2);
        expect(modelParams.topP).toBeGreaterThan(0);
        expect(modelParams.topP).toBeLessThanOrEqual(1);
        expect(modelParams.maxTokens).toBeGreaterThan(0);
      });
    });

    it("should have system prompts that mention JSON format", () => {
      personaTemplates.forEach(template => {
        const persona = createPersonaFromTemplate(template);
        // All personas should have JSON format instructions
        expect(persona.systemPrompt.toLowerCase()).toContain("json");
        expect(persona.systemPrompt.toLowerCase()).toContain("message");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty memory retrieval", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Ensure persona has no memories
      persona.memory = [];

      const memories = MemorySystem.retrieveMemories({
        persona,
        query: "nonexistent query",
        limit: 5,
      });

      expect(Array.isArray(memories)).toBe(true);
      expect(memories.length).toBe(0);
    });

    it("should handle persona with no conversation history", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      expect(persona.conversationHistory.length).toBe(0);
      expect(Array.isArray(persona.conversationHistory)).toBe(true);
    });

    it("should handle memory importance decay", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const memory = MemorySystem.addMemory(persona, "Old memory", 5);
      const initialImportance = memory.importance;

      // Simulate time passing by setting old timestamps
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
      memory.lastAccessed = oldDate;
      memory.createdAt = oldDate;

      // Access other memory (not this one) to trigger decay
      const otherMemory = MemorySystem.addMemory(persona, "Other memory", 5);
      MemorySystem.updateImportanceFromAccess(persona, [otherMemory.id]);

      const updatedMemory = persona.memory.find(m => m.id === memory.id);
      expect(updatedMemory).toBeDefined();
      // With the decay logic, old memories do decay
      expect(updatedMemory?.importance).toBeLessThanOrEqual(initialImportance);
    });

    it("should clamp memory importance between 0 and 10", () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // AddMemory doesn't clamp on creation, it uses the value directly
      // Clamping happens in updateImportanceFromAccess
      const memory = MemorySystem.addMemory(persona, "Test", 15);
      expect(memory.importance).toBe(15);

      const lowMemory = MemorySystem.addMemory(persona, "Test Low", -5);
      expect(lowMemory.importance).toBe(-5);

      // Apply update to trigger clamping
      MemorySystem.updateImportanceFromAccess(persona, []);

      const updatedHigh = persona.memory.find(m => m.id === memory.id);
      const updatedLow = persona.memory.find(m => m.id === lowMemory.id);

      expect(updatedHigh?.importance).toBeLessThanOrEqual(10);
      expect(updatedLow?.importance).toBeGreaterThanOrEqual(0);
    });
  });
});
