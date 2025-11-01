import Dexie, { type Table } from "dexie";
import type { Character } from "./types";

export class CharacterDatabase extends Dexie {
  characters!: Table<Character>;

  constructor() {
    super("CharacterDatabase");
    this.version(1).stores({
      characters: "id, name, level, createdAt, updatedAt",
    });
  }
}

export const db = new CharacterDatabase();

// Type-safe helper to get character
export async function getCharacter(id: string): Promise<Character | undefined> {
  return await db.characters.get(id);
}

// Type-safe helper to get all characters
export async function getAllCharacters(): Promise<Character[]> {
  return await db.characters.toArray();
}

// Type-safe helper to add character
export async function addCharacter(character: Character): Promise<string> {
  return await db.characters.add(character);
}

// Type-safe helper to update character
export async function updateCharacter(id: string, updates: Partial<Character>): Promise<number> {
  return await db.characters.update(id, updates);
}

// Type-safe helper to delete character
export async function deleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

// Type-safe helper to clear all characters
export async function clearAllCharacters(): Promise<void> {
  await db.characters.clear();
}
