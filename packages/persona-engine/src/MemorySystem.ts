import type { MemoryEntry, Message, Persona } from "persona-storage";
import type { MemorySearchResult, RetrievalOptions } from "./types";

export class MemorySystem {
  /**
   * Add a new memory to the persona
   */
  static addMemory(persona: Persona, content: string, importance: number = 5): MemoryEntry {
    const memory: MemoryEntry = {
      id: crypto.randomUUID(),
      content,
      importance,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    persona.memory.push(memory);
    return memory;
  }

  /**
   * Retrieve relevant memories based on a query
   * Uses simple text matching for now (can be enhanced with embeddings)
   */
  static retrieveMemories(options: RetrievalOptions): MemoryEntry[] {
    const { persona, query, limit = 5, minScore = 0 } = options;

    if (persona.memory.length === 0) {
      return [];
    }

    // Simple keyword-based retrieval
    // In production, this would use embeddings and semantic search
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scoredMemories: MemorySearchResult[] = persona.memory.map(memory => {
      const memoryText = memory.content.toLowerCase();
      let score = 0;

      // Score based on keyword matches
      for (const term of queryTerms) {
        if (memoryText.includes(term)) {
          score += 1;
        }
      }

      // Boost score based on importance
      score += memory.importance / 10;

      // Recent memories slightly boosted
      const daysSinceCreation = (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      score += 1 / (daysSinceCreation + 1);

      return { memory, score };
    });

    // Filter and sort
    const relevantMemories = scoredMemories
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Update last accessed timestamps
    relevantMemories.forEach(item => {
      item.memory.lastAccessed = new Date();
    });

    return relevantMemories.map(item => item.memory);
  }

  /**
   * Extract important information from a conversation and add to memory
   */
  static extractAndStoreMemory(persona: Persona, messages: Message[], threshold: number = 7): void {
    // Look for declarative statements that might be important
    const recentMessages = messages.slice(-6); // Last 3 exchanges

    for (const message of recentMessages) {
      if (message.role === "user" || message.role === "assistant") {
        // Simple heuristics to identify important facts
        // In production, use LLM to extract key facts
        const content = message.content;

        // Check for patterns that indicate important information
        const importantPatterns = [
          /my name is (.+)/i,
          /i am (.+)/i,
          /i have (.+)/i,
          /i'm from (.+)/i,
          /remember that (.+)/i,
          /importantly, (.+)/i,
        ];

        for (const pattern of importantPatterns) {
          const match = content.match(pattern);
          if (match) {
            const importantFact = match[0];
            const importance = threshold;

            // Check if we already have this memory
            const existing = persona.memory.find(
              m =>
                m.content.toLowerCase().includes(importantFact.toLowerCase()) ||
                importantFact.toLowerCase().includes(m.content.toLowerCase())
            );

            if (!existing) {
              MemorySystem.addMemory(persona, importantFact, importance);
            }
            break;
          }
        }
      }
    }
  }

  /**
   * Update memory importance based on usage
   */
  static updateMemoryImportance(persona: Persona, memoryId: string, newImportance: number): void {
    const memory = persona.memory.find(m => m.id === memoryId);
    if (memory) {
      memory.importance = Math.max(0, Math.min(10, newImportance));
    }
  }

  /**
   * Update memory importance based on access patterns (decay/increase model)
   * Memories that are accessed frequently and recently get boosted
   * Memories that are not accessed decay over time
   */
  static updateImportanceFromAccess(persona: Persona, accessedMemoryIds: string[]): void {
    const now = Date.now();

    for (const memory of persona.memory) {
      const wasAccessed = accessedMemoryIds.includes(memory.id);
      const daysSinceLastAccess = (now - memory.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceCreation = (now - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      let newImportance = memory.importance;

      if (wasAccessed) {
        // Boost recently accessed memories
        // More recent access = bigger boost, up to +2 points
        const accessBoost = Math.min(2, 1 / (daysSinceLastAccess + 0.1));
        newImportance += accessBoost;
      } else {
        // Decay unused memories
        // Older memories decay faster, but slower for high-importance memories
        const decayRate = daysSinceLastAccess > 7 ? 0.5 : 0.1; // Faster decay after a week
        const decay = decayRate * Math.min(daysSinceLastAccess / 30, 1); // Cap decay at 30 days
        newImportance -= decay;

        // Very old memories (older than 90 days) decay more aggressively
        if (daysSinceCreation > 90 && daysSinceLastAccess > 30) {
          newImportance -= 0.2;
        }
      }

      // Clamp between 0 and 10
      newImportance = Math.max(0, Math.min(10, newImportance));

      // Only update if change is significant (> 0.1) to avoid noise
      if (Math.abs(newImportance - memory.importance) > 0.1) {
        memory.importance = newImportance;
      }
    }
  }

  /**
   * Delete a memory
   */
  static deleteMemory(persona: Persona, memoryId: string): void {
    persona.memory = persona.memory.filter(m => m.id !== memoryId);
  }

  /**
   * Format memories for injection into prompts
   */
  static formatMemoriesForPrompt(memories: MemoryEntry[]): string {
    if (memories.length === 0) {
      return "";
    }

    const memoryTexts = memories.map((m, idx) => `${idx + 1}. ${m.content}`);

    return `\n\n**Important Memories:**\n${memoryTexts.join("\n")}`;
  }
}
