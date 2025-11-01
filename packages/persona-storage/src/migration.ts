import { SCHEMA_VERSION } from "./constants";
import { db } from "./db";

/**
 * Migrate all personas to the current schema version
 * If a persona's schema version is older, clear its chat history
 */
export async function migratePersonas(): Promise<void> {
  const allPersonas = await db.personas.toArray();
  const outdatedPersonas = allPersonas.filter(
    p => !p.schemaVersion || p.schemaVersion !== SCHEMA_VERSION
  );

  if (outdatedPersonas.length === 0) {
    return;
  }

  console.log(
    `Migrating ${outdatedPersonas.length} persona(s) to schema version ${SCHEMA_VERSION}`
  );

  // Clear chat history for outdated personas
  for (const persona of outdatedPersonas) {
    await db.personas.update(persona.id, {
      conversationHistory: [],
      schemaVersion: SCHEMA_VERSION,
    });
    console.log(`Cleared chat history for persona: ${persona.name}`);
  }
}
