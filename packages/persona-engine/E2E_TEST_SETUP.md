# E2E Test Setup Guide

## Overview

The Persona Engine E2E tests require WebGPU support because `web-llm` uses WebGPU for LLM inference. This document explains how to run the tests and handle WebGPU requirements.

## WebGPU Requirements

- **Browser**: Chrome 113+ or Edge 113+ with WebGPU support
- **Environment**: 
  - Local development: Run in headed mode (browser with display)
  - CI/Headless: Requires GPU-enabled runner or proper WebGPU configuration
  - Headless with xvfb: May work but WebGPU availability depends on browser configuration

## Current Status

? **Test Infrastructure**: Configured with Vitest + Playwright  
? **WebGPU Detection**: Tests gracefully skip when WebGPU is unavailable  
? **Configuration**: Browser args configured for WebGPU with software rendering (Swiftshader)  
?? **WebGPU in Headless**: WebGPU may not be available in headless environments

## Running Tests

### Local Development (Headed Mode)

```bash
cd packages/persona-engine
HEADED=true npm run test:e2e:headed
```

### Headless Mode (CI/Remote)

```bash
cd packages/persona-engine
npm run test:e2e  # Uses xvfb-run automatically
```

### Notes

- Tests will automatically skip if WebGPU is not available
- Some tests may fail if they don't check `webgpuAvailable` before using the engine
- All tests that use `engine.chat()` should check `webgpuAvailable` first

## Custom Graph Implementation

The Persona Engine uses a **custom graph implementation** instead of LangGraph because:
- LangGraph requires Node.js-specific dependencies that don't work in browsers
- Our custom `SimpleGraph` provides the same functionality
- Fully browser-compatible and tested

The graph implementation is in `src/graph/graph.ts` and provides:
- Stateful graph execution
- Conditional edges
- Retry logic
- Memory management
- Quest generation

## Troubleshooting

### "WebGPU adapter not available"

This means WebGPU isn't accessible in the current environment. Solutions:
1. Run in headed mode with a display
2. Use a GPU-enabled CI runner
3. Ensure Chrome/Chromium has WebGPU enabled (Chrome 113+)
4. Tests will skip gracefully if WebGPU isn't available

### Tests fail with "Model not initialized"

This happens when tests run without WebGPU. The `beforeAll` hook sets `webgpuAvailable = false` if WebGPU isn't available, and tests should check this before using the engine.

### Browser crashes or hangs

- Check that Playwright browsers are installed: `npx playwright install chromium`
- Verify xvfb is available: `which xvfb-run`
- Check browser args in `vitest.config.browser.ts`

## Future Improvements

1. Add `webgpuAvailable` check to all tests that use `engine.chat()`
2. Consider using a GPU-enabled CI runner for automated testing
3. Document WebGPU requirements more prominently
4. Add test helper functions to simplify WebGPU checks
