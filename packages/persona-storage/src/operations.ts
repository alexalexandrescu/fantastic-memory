import { addPersona, getAllPersonas, getPersona, updatePersona } from "./db";
import type { ExportBundle, ExportPersona, Persona } from "./types";

/**
 * Export a single persona to JSON format
 */
export function exportPersona(persona: Persona): ExportPersona {
  return {
    ...persona,
    createdAt: persona.createdAt.toISOString(),
    updatedAt: persona.updatedAt.toISOString(),
  };
}

/**
 * Export all personas to a bundle
 */
export async function exportAllPersonas(): Promise<ExportBundle> {
  const personas = await getAllPersonas();
  const exportPersonas: ExportPersona[] = personas.map(exportPersona);

  return {
    version: "1.0.0",
    personas: exportPersonas,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import a single persona from JSON format
 */
export async function importPersona(
  exportPersona: ExportPersona,
  overwrite: boolean = false
): Promise<string> {
  const persona: Persona = {
    ...exportPersona,
    createdAt: new Date(exportPersona.createdAt),
    updatedAt: new Date(exportPersona.updatedAt),
  };

  const existing = await getPersona(persona.id);
  if (existing && !overwrite) {
    throw new Error(
      `Persona with id ${persona.id} already exists. Use overwrite option to replace it.`
    );
  }

  if (existing && overwrite) {
    await updatePersona(persona.id, persona);
    return persona.id;
  }

  await addPersona(persona);
  return persona.id;
}

/**
 * Import multiple personas from a bundle
 */
export async function importPersonas(
  bundle: ExportBundle,
  overwrite: boolean = false
): Promise<string[]> {
  const importedIds: string[] = [];

  for (const persona of bundle.personas) {
    try {
      const id = await importPersona(persona, overwrite);
      importedIds.push(id);
    } catch (error) {
      console.error(`Failed to import persona ${persona.id}:`, error);
      // Continue with other personas
    }
  }

  return importedIds;
}

/**
 * Download personas as JSON file
 */
export async function downloadPersonas(): Promise<void> {
  const bundle = await exportAllPersonas();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `personas-export-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Load personas from a JSON file
 */
export async function loadPersonasFromFile(
  file: File,
  overwrite: boolean = false
): Promise<string[]> {
  const text = await file.text();
  const bundle: ExportBundle = JSON.parse(text);

  if (!bundle.version || !bundle.personas) {
    throw new Error("Invalid persona bundle format");
  }

  return await importPersonas(bundle, overwrite);
}
