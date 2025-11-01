import { addCharacter, getAllCharacters, getCharacter, updateCharacter } from "./db";
import type { Character, ExportBundle, ExportCharacter } from "./types";

/**
 * Calculate ability modifier from score
 */
export function calculateAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate ability modifiers for all abilities
 */
export function calculateAbilityModifiers(abilities: {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}): {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
} {
  return {
    strength: calculateAbilityModifier(abilities.strength),
    dexterity: calculateAbilityModifier(abilities.dexterity),
    constitution: calculateAbilityModifier(abilities.constitution),
    intelligence: calculateAbilityModifier(abilities.intelligence),
    wisdom: calculateAbilityModifier(abilities.wisdom),
    charisma: calculateAbilityModifier(abilities.charisma),
  };
}

/**
 * Export a single character to JSON format
 */
export function exportCharacter(character: Character): ExportCharacter {
  return {
    ...character,
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
  };
}

/**
 * Export all characters to a bundle
 */
export async function exportAllCharacters(): Promise<ExportBundle> {
  const characters = await getAllCharacters();
  const exportCharacters: ExportCharacter[] = characters.map(exportCharacter);

  return {
    version: "1.0.0",
    characters: exportCharacters,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import a single character from JSON format
 */
export async function importCharacter(
  exportCharacter: ExportCharacter,
  overwrite: boolean = false
): Promise<string> {
  const character: Character = {
    ...exportCharacter,
    createdAt: new Date(exportCharacter.createdAt),
    updatedAt: new Date(exportCharacter.updatedAt),
  };

  const existing = await getCharacter(character.id);
  if (existing && !overwrite) {
    throw new Error(
      `Character with id ${character.id} already exists. Use overwrite option to replace it.`
    );
  }

  if (existing && overwrite) {
    await updateCharacter(character.id, character);
    return character.id;
  }

  await addCharacter(character);
  return character.id;
}

/**
 * Import multiple characters from a bundle
 */
export async function importCharacters(
  bundle: ExportBundle,
  overwrite: boolean = false
): Promise<string[]> {
  const importedIds: string[] = [];

  for (const character of bundle.characters) {
    try {
      const id = await importCharacter(character, overwrite);
      importedIds.push(id);
    } catch (error) {
      console.error(`Failed to import character ${character.id}:`, error);
      // Continue with other characters
    }
  }

  return importedIds;
}

/**
 * Download characters as JSON file
 */
export async function downloadCharacters(): Promise<void> {
  const bundle = await exportAllCharacters();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `characters-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load characters from a JSON file
 */
export async function loadCharactersFromFile(
  file: File,
  overwrite: boolean = false
): Promise<string[]> {
  const text = await file.text();
  const bundle: ExportBundle = JSON.parse(text);

  if (!bundle.version || !bundle.characters) {
    throw new Error("Invalid character bundle format");
  }

  return await importCharacters(bundle, overwrite);
}
