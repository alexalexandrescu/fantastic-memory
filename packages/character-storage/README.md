# Character Storage

IndexedDB persistence layer for TTRPG characters using Dexie.js.

## Features

- Full CRUD operations for characters
- Ability score and modifier calculations
- Export/import functionality
- System-agnostic design with extensible custom fields

## Usage

```typescript
import { db, addCharacter, getAllCharacters, calculateAbilityModifiers } from "character-storage";

// Add a new character
await addCharacter(myCharacter);

// Get all characters
const characters = await getAllCharacters();

// Calculate ability modifiers
const modifiers = calculateAbilityModifiers(abilities);
```

