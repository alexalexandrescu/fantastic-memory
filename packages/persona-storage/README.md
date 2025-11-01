# Persona Storage

IndexedDB persistence layer for TTRPG personas using Dexie.js.

## Features

- Full CRUD operations for personas
- Conversation history management
- Memory system for storing facts
- Quest tracking
- Export/import functionality
- Pre-built persona templates

## Usage

```typescript
import { db, addPersona, getAllPersonas } from "persona-storage";

// Add a new persona
await addPersona(myPersona);

// Get all personas
const personas = await getAllPersonas();
```

