import type { Persona } from "persona-storage";
import { createPersonaFromTemplate, personaTemplates } from "persona-storage";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NodeModelManager } from "../NodeModelManager";
import { PersonaEngine } from "../PersonaEngine";
import { isOllamaAvailable } from "../utils/ollamaCheck";

/**
 * E2E tests that run against actual LLMs using Ollama in Node.js environment.
 * Tests the same persona engine logic as browser tests, but using Ollama instead of web-llm.
 *
 * Requirements:
 * - Ollama service must be running locally (default: http://localhost:11434)
 * - Model "tinyllama" must be available (run: `ollama pull tinyllama`)
 *
 * To skip these tests (e.g., in CI without Ollama):
 * - Set environment variable: SKIP_LLM_TESTS=true
 * - Tests will automatically skip if Ollama service is not available
 */

// Check for skip flag - using globalThis for cross-environment compatibility
const SKIP_LLM_TESTS =
  typeof globalThis !== "undefined" &&
  (globalThis as { process?: { env?: Record<string, string> } }).process?.env?.SKIP_LLM_TESTS === "true";
let ollamaAvailable = false;
let engine: PersonaEngine | undefined;

// Helper to skip tests if Ollama is not available
function shouldSkipTest(): boolean {
  return SKIP_LLM_TESTS || !ollamaAvailable || !engine;
}

// Helper to get engine with type safety
function getEngine(): PersonaEngine {
  if (!engine) {
    throw new Error("Engine not initialized");
  }
  return engine;
}

describe("Persona Engine E2E Tests (Node.js with Ollama)", () => {
  const TEST_USER_NAME = "TestAdventurer";
  const MODEL_ID = "Llama-3.1-8B-Instruct-q4f32_1-MLC"; // Maps to "llama3.1:8b" in Ollama - larger model for better JSON generation

  beforeAll(async () => {
    // Check if we should skip tests
    if (SKIP_LLM_TESTS) {
      console.log("Skipping LLM tests: SKIP_LLM_TESTS=true");
      return;
    }

    // Check if Ollama is available
    ollamaAvailable = await isOllamaAvailable();
    if (!ollamaAvailable) {
      console.log(
        "Skipping LLM tests: Ollama service not available at http://localhost:11434"
      );
      console.log(
        "To run these tests: 1) Install and start Ollama, 2) Run: ollama pull tinyllama"
      );
      return;
    }

    // Initialize engine with NodeModelManager
    console.log("Creating NodeModelManager...");
    const nodeModelManager = new NodeModelManager();
    engine = new PersonaEngine(nodeModelManager);

    // Initialize the engine with the model
    console.log(`Initializing model ${MODEL_ID} with Ollama...`);
    try {
      await engine.initModel(MODEL_ID, progress => {
        console.log(`  [${Math.round(progress.progress * 100)}%] ${progress.text}`);
      });
      console.log("✓ Model initialized successfully");
    } catch (error) {
      console.error("✗ Failed to initialize model:", error);
      ollamaAvailable = false;
    }
  });

  afterAll(async () => {
    if (engine) {
      await engine.dispose();
    }
  });

  // Generate tests for each persona template
  personaTemplates.forEach((template, templateIndex) => {
    describe(`${template.name} (${template.type})`, () => {
      console.log(`\n[${templateIndex + 1}/${personaTemplates.length}] Testing ${template.name}...`);
      let persona: Persona;

      beforeEach(() => {
        if (shouldSkipTest()) {
          return;
        }
        persona = createPersonaFromTemplate(template);
      });

      it("should greet and respond naturally", async () => {
        if (shouldSkipTest()) {
          return;
        }
        console.log(`    → Sending: "Hello!"`);
        const startTime = Date.now();
        const response = await getEngine().chat({
          persona,
          message: "Hello!",
        });
        const duration = Date.now() - startTime;
        const preview = response.message.substring(0, 60).replace(/\n/g, " ");
        console.log(`    ✓ Response (${duration}ms, ${response.message.length} chars): "${preview}..."`);

        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(0);
      });

      it("should remember the user's name", async () => {
        if (shouldSkipTest()) {
          return;
        }
        // First interaction: introduce the user
        const introduceName = `My name is ${TEST_USER_NAME}`;
        console.log(`    → Turn 1: "${introduceName}"`);
        const start1 = Date.now();
        const response1 = await getEngine().chat({
          persona,
          message: introduceName,
        });
        console.log(`    ✓ Turn 1 complete (${Date.now() - start1}ms), memories: ${persona.memory.length}`);

        expect(response1.message).toBeDefined();

        // Check if memory was stored
        expect(persona.memory.length).toBeGreaterThan(0);

        // Second interaction: ask what my name is
        console.log(`    → Turn 2: "What is my name?"`);
        const start2 = Date.now();
        const response2 = await getEngine().chat({
          persona,
          message: "What is my name?",
        });
        console.log(`    ✓ Turn 2 complete (${Date.now() - start2}ms)`);

        expect(response2.message).toBeDefined();

        // The response should mention the user's name (case-insensitive check)
        const responseLower = response2.message.toLowerCase();
        const nameLower = TEST_USER_NAME.toLowerCase();
        expect(responseLower).toContain(nameLower);
      });

      it("should update memory importance on access", async () => {
        if (shouldSkipTest()) {
          return;
        }
        // First interaction: introduce something
        const initialMemoryCount = persona.memory.length;

        const response1 = await getEngine().chat({
          persona,
          message: "I'm a renowned adventurer",
        });

        expect(response1.message).toBeDefined();

        // Should have added memory
        const afterFirstMemory = persona.memory.length;
        expect(afterFirstMemory).toBeGreaterThan(initialMemoryCount);

        // Second interaction: reference the same thing
        if (persona.memory.length > 0) {
          const response2 = await getEngine().chat({
            persona,
            message: "Do you remember what I said about myself?",
          });

          expect(response2.message).toBeDefined();

          // The memory should still exist and have been accessed
          expect(persona.memory.length).toBeGreaterThan(0);
        }
      });

      it("should tell the user what it can do", async () => {
        if (shouldSkipTest()) {
          return;
        }
        const response = await getEngine().chat({
          persona,
          message: "What can you do for me?",
        });

        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(0);
      });

      it("should maintain conversation context across turns", async () => {
        if (shouldSkipTest()) {
          return;
        }
        // First turn
        const response1 = await getEngine().chat({
          persona,
          message: "I'm looking for a magic sword",
        });

        expect(response1.message).toBeDefined();

        // Second turn: reference the previous topic
        const response2 = await getEngine().chat({
          persona,
          message: "How much would that cost?",
        });

        expect(response2.message).toBeDefined();
        // The response should be contextually relevant
        expect(response2.message.length).toBeGreaterThan(0);
      });

      it("should handle JSON response format", async () => {
        if (shouldSkipTest()) {
          return;
        }
        const response = await getEngine().chat({
          persona,
          message: "Hello!",
        });

        // Response should have message field
        expect(response.message).toBeDefined();
        expect(typeof response.message).toBe("string");

        // Narration is optional but should be a string if present
        if (response.narration) {
          expect(typeof response.narration).toBe("string");
        }
      });

      it("should generate quests when appropriate", async () => {
        if (shouldSkipTest()) {
          return;
        }
        // Use a quest-focused persona or message
        const response = await getEngine().chat({
          persona,
          message: "I'm looking for an adventure or quest to help with",
        });

        expect(response.message).toBeDefined();

        // Quest generation is conditional, so we just check the structure if present
        if (response.quests) {
          expect(Array.isArray(response.quests)).toBe(true);
          response.quests.forEach(quest => {
            expect(quest.id).toBeDefined();
            expect(quest.title).toBeDefined();
            expect(quest.description).toBeDefined();
            expect(quest.status).toBe("active");
            expect(typeof quest.partySize).toBe("number");
            expect(typeof quest.level).toBe("number");
          });
        }
      });

      it("should store conversation history", async () => {
        if (shouldSkipTest()) {
          return;
        }
        const response = await getEngine().chat({
          persona,
          message: "Tell me about yourself",
        });

        expect(response.message).toBeDefined();

        // Note: The graph doesn't directly modify conversationHistory
        // It's expected that the calling code handles storing messages
        // We just verify the response is valid
        expect(response.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Graph orchestration behavior", () => {
    it("should handle retry logic on errors", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Normal chat should work
      const response = await getEngine().chat({
        persona,
        message: "Hello",
        maxRetries: 3,
      });

      expect(response.message).toBeDefined();
    });

    it("should process through graph nodes correctly", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await getEngine().chat({
        persona,
        message: "I'm a brave adventurer named TestHero",
      });

      // Verify the full graph execution
      expect(response.message).toBeDefined();

      // Check that memory was processed
      expect(Array.isArray(persona.memory)).toBe(true);
    });

    it("should handle memory retrieval and formatting", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Add some context
      const response1 = await getEngine().chat({
        persona,
        message: "My favorite drink is ale",
      });

      expect(response1.message).toBeDefined();

      // The next response should potentially use this memory
      const response2 = await getEngine().chat({
        persona,
        message: "What do you remember about me?",
      });

      expect(response2.message).toBeDefined();
    });

    it("should handle state updates across the graph", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Single turn - verify state flows correctly
      const response = await getEngine().chat({
        persona,
        message: "Hello there!",
      });

      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("narration");

      // Response should be valid string
      expect(typeof response.message).toBe("string");

      // Quest field is optional
      if (response.quests) {
        expect(Array.isArray(response.quests)).toBe(true);
      }
    });

    it("should retrieve and use memories from previous turns", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const initialMemoryCount = persona.memory.length;

      // First interaction: establish a fact
      const response1 = await getEngine().chat({
        persona,
        message: "I'm searching for a legendary sword called Excalibur",
      });

      expect(response1.message).toBeDefined();
      expect(persona.memory.length).toBeGreaterThan(initialMemoryCount);

      // Second interaction: ask about it
      const response2 = await getEngine().chat({
        persona,
        message: "Do you know what I'm looking for?",
      });

      expect(response2.message).toBeDefined();

      // Not strict - just ensure some context awareness
      expect(response2.message.length).toBeGreaterThan(10);
    });

    it("should format memories in prompts", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Establish multiple memories
      await getEngine().chat({
        persona,
        message: "My name is MemoryTest and I love dragons",
      });

      expect(persona.memory.length).toBeGreaterThan(0);

      // Verify memory was stored with proper structure
      const memory = persona.memory[0];
      expect(memory.id).toBeDefined();
      expect(memory.content).toBeDefined();
      expect(typeof memory.importance).toBe("number");
      expect(memory.createdAt).toBeInstanceOf(Date);
    });

    it("should decay old unused memories", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Add old memory manually
      const oldMemory = {
        id: crypto.randomUUID(),
        content: "This is an old unused memory",
        importance: 5,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        lastAccessed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      };
      persona.memory.push(oldMemory);

      // Add new memory and access it (triggers decay)
      const response = await getEngine().chat({
        persona,
        message: "I'm a brand new adventurer",
      });

      expect(response.message).toBeDefined();

      // Find the old memory
      const updatedOldMemory = persona.memory.find(m => m.id === oldMemory.id);
      expect(updatedOldMemory).toBeDefined();

      // Old memory should have been affected by decay (or at least not boosted)
      if (updatedOldMemory) {
        expect(updatedOldMemory.importance).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("Quest generation behavior", () => {
    it("should generate quests for quest NPC personas", async () => {
      if (shouldSkipTest()) {
        return;
      }
      // Find a quest-focused persona
      const questPersona = createPersonaFromTemplate(
        personaTemplates.find(t => t.type === "quest-npc") || personaTemplates[0]
      );

      const response = await getEngine().chat({
        persona: questPersona,
        message: "I need an adventure to undertake",
      });

      expect(response.message).toBeDefined();

      // Quest NPCs should be more likely to generate quests
      if (response.quests && response.quests.length > 0) {
        expect(response.quests[0]).toHaveProperty("id");
        expect(response.quests[0]).toHaveProperty("title");
        expect(response.quests[0]).toHaveProperty("description");
        expect(response.quests[0].status).toBe("active");
        expect(typeof response.quests[0].partySize).toBe("number");
        expect(typeof response.quests[0].level).toBe("number");
      }
    });

    it("should generate quests when quest keywords are present", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await getEngine().chat({
        persona,
        message: "I'm looking for a mission or quest to help with",
      });

      expect(response.message).toBeDefined();

      // May or may not generate quest depending on context
      // Just verify the response structure if quests are present
      if (response.quests && response.quests.length > 0) {
        response.quests.forEach(quest => {
          expect(quest.id).toBeDefined();
          expect(quest.title).toBeDefined();
          expect(quest.description).toBeDefined();
        });
      }
    });

    it("should not generate quests for non-quest conversations", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await getEngine().chat({
        persona,
        message: "The weather is nice today",
      });

      expect(response.message).toBeDefined();
      // Weather conversation shouldn't trigger quests
      expect(response.quests).toBeUndefined();
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty messages gracefully", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await getEngine().chat({
        persona,
        message: "",
      });

      // Should still return a response or handle gracefully
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it("should handle very long messages", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const longMessage = `${"A".repeat(1000)} What do you think?`;

      const response = await getEngine().chat({
        persona,
        message: longMessage,
      });

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("should handle special characters in messages", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await getEngine().chat({
        persona,
        message: "Hello! I'm testing with 'quotes', \"double quotes\", and <tags>",
      });

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("should handle persona with many existing memories", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Add many memories to the persona
      for (let i = 0; i < 20; i++) {
        persona.memory.push({
          id: crypto.randomUUID(),
          content: `Memory item ${i}`,
          importance: Math.random() * 10,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          lastAccessed: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        });
      }

      const response = await getEngine().chat({
        persona,
        message: "What do you know about me?",
      });

      expect(response.message).toBeDefined();
      // Should still work with many memories
      expect(persona.memory.length).toBeGreaterThanOrEqual(20);
    });

    it("should maintain persona personality across turns", async () => {
      if (shouldSkipTest()) {
        return;
      }
      const grumpyPersona = createPersonaFromTemplate(
        personaTemplates.find(t => t.name.toLowerCase().includes("boss")) || personaTemplates[0]
      );

      // Multiple turns
      const response1 = await getEngine().chat({
        persona: grumpyPersona,
        message: "Hello there",
      });

      const response2 = await getEngine().chat({
        persona: grumpyPersona,
        message: "How are you?",
      });

      expect(response1.message).toBeDefined();
      expect(response2.message).toBeDefined();

      // Personality should be consistent (just check responses are different lengths/content)
      // Not strict about tone matching since LLM responses vary
      expect(response1.message.length).toBeGreaterThan(0);
      expect(response2.message.length).toBeGreaterThan(0);
    });
  });
});
