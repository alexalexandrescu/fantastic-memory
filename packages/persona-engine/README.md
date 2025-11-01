# Persona Engine

Core NPC persona engine with web-llm integration for TTRPG personas, powered by LangGraph orchestration.

## Features

- ModelManager for handling web-llm model initialization and chat
- PersonaEngine for orchestrating persona interactions with LangGraph
- MemorySystem for retrieving and managing persona memories with importance decay/increase model
- Support for multiple local LLM models
- Quest generation based on conversation context
- Stateful memory flows with reflexive memory updates

## Usage

```typescript
import { PersonaEngine } from "persona-engine";

const engine = new PersonaEngine();

// Initialize model
await engine.initModel("Llama-3.1-8B-Instruct-q4f32_1");

// Chat with persona (uses LangGraph internally)
const response = await engine.chat({
  persona,
  message: "Hello!",
  context: {},
});

// Response includes message, narration, and optionally generated quests
console.log(response.message);
console.log(response.narration);
if (response.quests) {
  console.log("Generated quests:", response.quests);
}
```

## LangGraph Architecture

The PersonaEngine uses LangGraph to orchestrate conversational flows through a stateful graph:

1. **retrieve_memory** - Retrieves relevant memories based on query, updates access timestamps
2. **format_prompt** - Builds system prompt with memories and formats user message
3. **llm_call** - Streams LLM response and parses JSON
4. **extract_memory** - Extracts important facts from conversation
5. **update_importance** - Updates memory importance based on access patterns (decay/increase)
6. **store_memory** - Prepares memories for persistence
7. **generate_quest** - Conditionally generates quests based on conversation context
8. **handle_error** - Manages retry logic for LLM failures

The graph handles retries, memory importance updates, and quest generation automatically. All state persists via the persona storage layer.

## Memory Importance Model

Memories use a decay/increase model:
- **Boost**: Recently accessed memories gain importance (up to +2 points)
- **Decay**: Unused memories decay over time (faster after 7 days)
- **Aggressive decay**: Very old memories (>90 days) decay more quickly

This ensures frequently accessed information stays relevant while old information fades naturally.

## Quest Generation

Quests are automatically generated when:
- Conversation contains quest-related keywords (quest, mission, task, job, adventure, etc.)
- NPC type is quest-related
- User expresses interest in help/assistance

Generated quests include title, description, party size, level, and optional rewards.

