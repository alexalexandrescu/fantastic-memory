# Persona Engine

Core NPC persona engine with web-llm integration for TTRPG personas.

## Features

- ModelManager for handling web-llm model initialization and chat
- PersonaEngine for orchestrating persona interactions
- MemorySystem for retrieving and managing persona memories
- Support for multiple local LLM models

## Usage

```typescript
import { PersonaEngine } from "persona-engine";

const engine = new PersonaEngine();

// Initialize model
await engine.initModel("Llama-3.1-8B-Instruct-q4f32_1");

// Chat with persona
const response = await engine.chat({
  persona,
  message: "Hello!",
  context: {},
});
```

