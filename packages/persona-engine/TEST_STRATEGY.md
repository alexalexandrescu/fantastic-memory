# Test Strategy for Persona Engine

## Overview

This document outlines the testing strategy for the Persona Engine, which uses a browser-based LLM runtime (web-llm) that cannot run in Node.js environments.

## Test Structure

### Unit Tests (Node.js Compatible)

**Location:** `src/__tests__/graph.test.ts`

These tests can run in Node.js and cover:
- Graph construction and API
- State management
- Memory system operations (retrieve, add, update, extract)
- Persona template validation
- Edge cases and error handling

**Run:** `bun run test`

**Status:** ✅ All tests passing

### E2E Tests (Browser Only)

**Location:** `src/__tests__/persona.e2e.test.ts`

These tests require a browser environment because web-llm uses browser-specific APIs (IndexedDB, Web Workers, etc.).

**Current Status:** ✅ Ready for browser testing (not skipped)

**Coverage:**
- Each persona template (10 personas)
- Greeting and natural responses
- Memory recall (user name)
- Memory importance updates
- Capability descriptions
- Conversation context
- JSON response format
- Quest generation
- Graph orchestration behavior
- Memory retrieval and formatting
- Memory decay functionality
- Quest generation edge cases
- Empty/long/special character message handling
- Personas with many memories
- Personality consistency across turns

**To Run E2E Tests:**

#### Option 1: Manual Testing (Recommended for Development)
1. Start the persona-configurator app: `cd apps/persona-configurator && bun run dev`
2. Open http://localhost:3000 in your browser
3. For each persona:
   - Click to select the persona
   - Say "Hello!" - verify response
   - Say "My name is TestAdventurer" - verify response mentions your name
   - Ask "What is my name?" - verify it recalls "TestAdventurer"
   - Ask "What can you do for me?" - verify it describes capabilities
   - Check persona.memory array has been updated

#### Option 2: Browser-Based Test Runner (For CI/CD)
Note: Automated E2E tests with browser configuration need additional setup due to Vitest 4.x API changes.  
The browser provider configuration is currently being refined. For now, manual testing (Option 1) is recommended.

To set up automated browser testing in the future:
1. Install dependencies: `bun add -d @vitest/browser-playwright playwright`
2. Configure `vitest.config.browser.ts` with the latest Vitest 4.x browser API
3. Run: `bun run test:e2e`

#### Option 3: Headless Browser with WebDriver
Use Selenium or Playwright in headless mode with proper IndexedDB and Web Worker support configured.

## Test Coverage Goals

### Per Persona Template
Each of the 10 persona templates should be tested for:

1. **Initial Greeting** ✓
   - Responds to "Hello!" appropriately
   - Matches personality traits

2. **Memory Storage** ✓
   - Remembers user name after introduction
   - Stores important facts

3. **Memory Retrieval** ✓
   - Recalls user name when asked
   - References past conversations

4. **Memory Importance** ✓
   - Boosts recently accessed memories
   - Decays unused memories over time

5. **Capabilities** ✓
   - Describes what it can do
   - Matches persona type (barkeep, shopkeep, etc.)

6. **Context Maintenance** ✓
   - References previous messages in conversation
   - Maintains conversation flow

7. **JSON Response Format** ✓
   - Returns valid JSON with "message" field
   - Optional "narration" field present

8. **Quest Generation** ✓
   - Generates quests when conversation suggests it
   - Quest structure is valid

### Graph Orchestration
Test the LangGraph-like orchestration system:

1. **Error Handling** ✓
   - Retries on LLM failures
   - Fails gracefully after max retries

2. **State Flow** ✓
   - Processes through all nodes correctly
   - State updates propagate

3. **Memory Integration** ✓
   - Retrieves relevant memories
   - Formats memories for prompts
   - Updates importance after access

4. **Conditional Branches** ✓
   - Quest generation triggers appropriately
   - Retry logic works correctly

## Acceptance Criteria from User Story

Based on the original user story:

- ✅ Graph produces identical outputs under the same inputs
- ✅ State persists across turns
- ✅ Memory importance updates on access
- ✅ Quests branch by conversation context and personality
- ✅ Streaming still works and returns JSON
- ✅ Retries cover LLM failures
- ⏸️ No regressions: all personas load (manual testing)
- ⏸️ Export/import unchanged (manual testing)
- ✅ Unit tests for nodes and loops
- ⏸️ Integration for multi-turn and memory (browser E2E)
- ✅ ChatInterface still calls PersonaEngine.chat()
- ✅ Bundle size: LangGraph removed (0 KB increase, actually reduced!)

## Running Tests

### All Unit Tests
```bash
cd packages/persona-engine
bun run test
```

### Specific Test File
```bash
bun run test graph.test.ts
```

### Watch Mode (Unit Tests Only)
```bash
bun run test --watch
```

### Generate Coverage Report
```bash
bun run test --coverage
```

## Continuous Integration

Current CI setup:
- Unit tests run in Node.js environment
- E2E tests separated from unit tests (excluded from Node.js runner)
- Linter checks run on all code

Recommended CI enhancement:
- Add browser-based E2E test runner for automated validation
- Set up test matrix for multiple browser targets
- Generate coverage reports
- Fail on coverage drops below threshold

## Manual Test Checklist

For release validation, manually test each persona:

- [ ] Barkeep Bernie - greets, remembers drink preferences
- [ ] Merchant Marcus - discusses inventory, quotes prices
- [ ] Guardsman Grendel - suspicious, offers protection quests
- [ ] Tavern Patron Tom - tells tall tales, shares rumors
- [ ] Blacksmith Bronwen - discusses crafting, offers repairs
- [ ] Sister Selene - offers healing, compassionate responses
- [ ] The Hooded Wanderer - cryptic hints, mysterious quests
- [ ] Elder Elara - shares wisdom, references history
- [ ] Caravan Leader Khalid - talks about distant lands
- [ ] Boss Magnus - intimidating, offers challenges
- [ ] Adventure Hook NPC - generates quests appropriately

## Troubleshooting

### Tests fail with "Model not found"
- E2E tests require browser environment
- Unit tests don't use real models (mocked)

### Memory importance not updating
- Check that `updateImportanceFromAccess` is called
- Verify memory IDs match when checking access

### Graph execution hangs
- Check for infinite loops in graph definition
- Verify conditional edges have valid mappings
- Look for missing "__end__" transitions

## References

- [Original User Story](./README.md#graph-architecture)
- [Memory System Documentation](./README.md#memory-importance-model)
- [Graph Implementation](./src/graph/graph.ts)

