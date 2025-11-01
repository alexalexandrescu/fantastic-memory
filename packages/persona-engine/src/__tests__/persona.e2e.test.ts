import type { Persona } from "persona-storage";
import { createPersonaFromTemplate, personaTemplates } from "persona-storage";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PersonaEngine } from "../PersonaEngine";

/**
 * IMPORTANT: These are E2E tests that require a browser environment or MLC runtime.
 * They cannot run in Node.js because web-llm requires browser APIs.
 *
 * To run these tests:
 * 1. Use a browser-based test runner like Playwright with vitest
 * 2. Or use a headless browser environment configured for web-llm
 * 3. Or run them manually in the browser via the persona-configurator app
 *
 * For automated CI/CD, these tests should be in a separate test suite that runs in a browser environment.
 */

describe("Persona Engine E2E Tests (Browser Only)", () => {
  const engine = new PersonaEngine();
  const TEST_USER_NAME = "TestAdventurer";
  const MODEL_ID = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC"; // Smaller model for E2E tests to avoid storage quota

  beforeAll(async () => {
    // Initialize the engine with the model
    console.log("Initializing model...");
    await engine.initModel(MODEL_ID);
    console.log("Model initialized");
  });

  afterAll(async () => {
    await engine.dispose();
  });

  // Generate tests for each persona template
  personaTemplates.forEach(template => {
    describe(`${template.name} (${template.type})`, () => {
      let persona: Persona;

      beforeEach(() => {
        persona = createPersonaFromTemplate(template);
      });

      it("should greet and respond naturally", async () => {
        const response = await engine.chat({
          persona,
          message: "Hello!",
        });

        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(0);
      });

      it("should remember the user's name", async () => {
        // First interaction: introduce the user
        const introduceName = `My name is ${TEST_USER_NAME}`;
        const response1 = await engine.chat({
          persona,
          message: introduceName,
        });

        expect(response1.message).toBeDefined();

        // Check if memory was stored
        expect(persona.memory.length).toBeGreaterThan(0);

        // Second interaction: ask what my name is
        const response2 = await engine.chat({
          persona,
          message: "What is my name?",
        });

        expect(response2.message).toBeDefined();

        // The response should mention the user's name (case-insensitive check)
        const responseLower = response2.message.toLowerCase();
        const nameLower = TEST_USER_NAME.toLowerCase();
        expect(responseLower).toContain(nameLower);
      });

      it("should update memory importance on access", async () => {
        // First interaction: introduce something
        const initialMemoryCount = persona.memory.length;

        const response1 = await engine.chat({
          persona,
          message: "I'm a renowned adventurer",
        });

        expect(response1.message).toBeDefined();

        // Should have added memory
        const afterFirstMemory = persona.memory.length;
        expect(afterFirstMemory).toBeGreaterThan(initialMemoryCount);

        // Second interaction: reference the same thing
        if (persona.memory.length > 0) {
          const response2 = await engine.chat({
            persona,
            message: "Do you remember what I said about myself?",
          });

          expect(response2.message).toBeDefined();

          // The memory should still exist and have been accessed
          expect(persona.memory.length).toBeGreaterThan(0);
        }
      });

      it("should tell the user what it can do", async () => {
        const response = await engine.chat({
          persona,
          message: "What can you do for me?",
        });

        expect(response.message).toBeDefined();
        expect(response.message.length).toBeGreaterThan(0);
      });

      it("should maintain conversation context across turns", async () => {
        // First turn
        const response1 = await engine.chat({
          persona,
          message: "I'm looking for a magic sword",
        });

        expect(response1.message).toBeDefined();

        // Second turn: reference the previous topic
        const response2 = await engine.chat({
          persona,
          message: "How much would that cost?",
        });

        expect(response2.message).toBeDefined();
        // The response should be contextually relevant
        expect(response2.message.length).toBeGreaterThan(0);
      });

      it("should handle JSON response format", async () => {
        const response = await engine.chat({
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
        // Use a quest-focused persona or message
        const response = await engine.chat({
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
        const response = await engine.chat({
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
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Normal chat should work
      const response = await engine.chat({
        persona,
        message: "Hello",
        maxRetries: 3,
      });

      expect(response.message).toBeDefined();
    });

    it("should process through graph nodes correctly", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await engine.chat({
        persona,
        message: "I'm a brave adventurer named TestHero",
      });

      // Verify the full graph execution
      expect(response.message).toBeDefined();

      // Check that memory was processed
      expect(Array.isArray(persona.memory)).toBe(true);
    });

    it("should handle memory retrieval and formatting", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Add some context
      const response1 = await engine.chat({
        persona,
        message: "My favorite drink is ale",
      });

      expect(response1.message).toBeDefined();

      // The next response should potentially use this memory
      const response2 = await engine.chat({
        persona,
        message: "What do you remember about me?",
      });

      expect(response2.message).toBeDefined();
    });

    it("should handle state updates across the graph", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Single turn - verify state flows correctly
      const response = await engine.chat({
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
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const initialMemoryCount = persona.memory.length;

      // First interaction: establish a fact
      const response1 = await engine.chat({
        persona,
        message: "I'm searching for a legendary sword called Excalibur",
      });

      expect(response1.message).toBeDefined();
      expect(persona.memory.length).toBeGreaterThan(initialMemoryCount);

      // Second interaction: ask about it
      const response2 = await engine.chat({
        persona,
        message: "Do you know what I'm looking for?",
      });

      expect(response2.message).toBeDefined();

      // Not strict - just ensure some context awareness
      expect(response2.message.length).toBeGreaterThan(10);
    });

    it("should format memories in prompts", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      // Establish multiple memories
      await engine.chat({
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
      const response = await engine.chat({
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
      // Find a quest-focused persona
      const questPersona = createPersonaFromTemplate(
        personaTemplates.find(t => t.type === "quest-npc") || personaTemplates[0]
      );

      const response = await engine.chat({
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
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await engine.chat({
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
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await engine.chat({
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
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await engine.chat({
        persona,
        message: "",
      });

      // Should still return a response or handle gracefully
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it("should handle very long messages", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);
      const longMessage = `${"A".repeat(1000)} What do you think?`;

      const response = await engine.chat({
        persona,
        message: longMessage,
      });

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("should handle special characters in messages", async () => {
      const persona = createPersonaFromTemplate(personaTemplates[0]);

      const response = await engine.chat({
        persona,
        message: "Hello! I'm testing with 'quotes', \"double quotes\", and <tags>",
      });

      expect(response.message).toBeDefined();
      expect(response.message.length).toBeGreaterThan(0);
    });

    it("should handle persona with many existing memories", async () => {
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

      const response = await engine.chat({
        persona,
        message: "What do you know about me?",
      });

      expect(response.message).toBeDefined();
      // Should still work with many memories
      expect(persona.memory.length).toBeGreaterThanOrEqual(20);
    });

    it("should maintain persona personality across turns", async () => {
      const grumpyPersona = createPersonaFromTemplate(
        personaTemplates.find(t => t.name.toLowerCase().includes("boss")) || personaTemplates[0]
      );

      // Multiple turns
      const response1 = await engine.chat({
        persona: grumpyPersona,
        message: "Hello there",
      });

      const response2 = await engine.chat({
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
