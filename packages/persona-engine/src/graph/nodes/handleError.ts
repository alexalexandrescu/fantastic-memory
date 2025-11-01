import type { GraphState } from "../types";

export async function handleError(state: GraphState): Promise<Partial<GraphState>> {
  const newRetryCount = state.retryCount + 1;

  if (newRetryCount >= state.maxRetries) {
    // Exhausted retries, throw error
    throw state.error || new Error("Failed to get response from model after retries");
  }

  // Wait before retrying (exponential backoff)
  const delay = 1000 * newRetryCount;
  await new Promise(resolve => setTimeout(resolve, delay));

  return {
    retryCount: newRetryCount,
    error: undefined,
  };
}
