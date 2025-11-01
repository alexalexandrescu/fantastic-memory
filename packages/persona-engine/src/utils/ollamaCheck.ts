/**
 * Check if Ollama service is available
 * @returns Promise that resolves to true if Ollama is available, false otherwise
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    // Try to ping Ollama API
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

