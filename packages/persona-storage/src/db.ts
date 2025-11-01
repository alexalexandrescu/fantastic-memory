import Dexie, { type Table } from "dexie";
import { SCHEMA_VERSION } from "./constants";
import type { MemoryEntry, Message, Persona, Quest } from "./types";

export class PersonaDatabase extends Dexie {
  personas!: Table<Persona>;

  constructor() {
    super("PersonaDatabase");
    this.version(1).stores({
      personas: "id, name, type, createdAt, updatedAt",
    });
  }
}

export const db = new PersonaDatabase();

// Type-safe helper to get persona
export async function getPersona(id: string): Promise<Persona | undefined> {
  return await db.personas.get(id);
}

// Type-safe helper to get all personas
export async function getAllPersonas(): Promise<Persona[]> {
  return await db.personas.toArray();
}

// Type-safe helper to add persona
export async function addPersona(persona: Persona): Promise<string> {
  return await db.personas.add(persona);
}

// Type-safe helper to update persona
export async function updatePersona(id: string, updates: Partial<Persona>): Promise<number> {
  return await db.personas.update(id, updates);
}

// Type-safe helper to delete persona
export async function deletePersona(id: string): Promise<void> {
  await db.personas.delete(id);
}

// Type-safe helper to clear all personas
export async function clearAllPersonas(): Promise<void> {
  await db.personas.clear();
}

// Helper to add message to conversation history
export async function addMessage(personaId: string, message: Message): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedHistory = [...persona.conversationHistory, message];
  await updatePersona(personaId, {
    conversationHistory: updatedHistory,
    schemaVersion: SCHEMA_VERSION,
  });
}

// Helper to clear conversation history
export async function clearHistory(personaId: string): Promise<void> {
  await updatePersona(personaId, { conversationHistory: [] });
}

// Helper to clear all conversation histories from all personas
export async function clearAllHistories(): Promise<void> {
  const allPersonas = await getAllPersonas();
  await Promise.all(allPersonas.map(persona => clearHistory(persona.id)));
}

// Helper to add memory entry
export async function addMemory(personaId: string, memory: MemoryEntry): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedMemory = [...persona.memory, memory];
  await updatePersona(personaId, { memory: updatedMemory });
}

// Helper to update memory entry
export async function updateMemory(
  personaId: string,
  memoryId: string,
  updates: Partial<MemoryEntry>
): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedMemory = persona.memory.map(m => (m.id === memoryId ? { ...m, ...updates } : m));
  await updatePersona(personaId, { memory: updatedMemory });
}

// Helper to delete memory entry
export async function deleteMemory(personaId: string, memoryId: string): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedMemory = persona.memory.filter(m => m.id !== memoryId);
  await updatePersona(personaId, { memory: updatedMemory });
}

// Helper to add quest
export async function addQuest(personaId: string, quest: Quest): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedQuests = [...persona.quests, quest];
  await updatePersona(personaId, { quests: updatedQuests });
}

// Helper to update quest
export async function updateQuest(
  personaId: string,
  questId: string,
  updates: Partial<Quest>
): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedQuests = persona.quests.map(q => (q.id === questId ? { ...q, ...updates } : q));
  await updatePersona(personaId, { quests: updatedQuests });
}

// Helper to delete quest
export async function deleteQuest(personaId: string, questId: string): Promise<void> {
  const persona = await getPersona(personaId);
  if (!persona) {
    throw new Error(`Persona ${personaId} not found`);
  }

  const updatedQuests = persona.quests.filter(q => q.id !== questId);
  await updatePersona(personaId, { quests: updatedQuests });
}
