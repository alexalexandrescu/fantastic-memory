// Setup file for browser e2e tests
// This file runs before tests to ensure WebGPU is available

// Try to initialize WebGPU early
if (typeof navigator !== "undefined") {
  try {
    // Request WebGPU adapter to ensure it's available
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        console.log("WebGPU adapter available:", adapter);
        // Request device to fully initialize WebGPU
        const device = await adapter.requestDevice();
        console.log("WebGPU device initialized");
        device.destroy(); // Clean up
      } else {
        console.warn("WebGPU adapter not available");
      }
    } else {
      console.warn("navigator.gpu not available");
    }
  } catch (error) {
    console.warn("Failed to initialize WebGPU:", error);
  }
}

// Add a small delay to ensure browser is fully initialized
await new Promise(resolve => setTimeout(resolve, 200));
