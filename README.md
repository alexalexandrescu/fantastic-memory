# TTRPG Persona Configurator

A fully client-side LLM-based TTRPG NPC Persona Configurator built with web-llm, React, Turborepo, and Bun. Create, customize, and interact with AI-powered NPCs with customizable personalities, memory, and quest-giving capabilities.

## Features

- **Tri-Pane Interface**: Manage personas, chat with NPCs, and tweak settings in one view
- **AI-Powered NPCs**: Powered by @mlc-ai/web-llm running models locally in the browser
- **Customizable Personas**: Adjust system prompts, user prompts, model parameters, and personality traits
- **Persistent Memory**: Each NPC remembers past conversations and important facts
- **Quest System**: NPCs can generate and track quests based on party size and level
- **Multiple Templates**: Pre-built templates for Barkeep, Shopkeep, Guards, Healers, and more
- **Export/Import**: Share personas or backup your configuration
- **Fully Client-Side**: No server required, runs entirely in the browser

## Tech Stack

- **Runtime**: Bun
- **Build**: Vite
- **Framework**: React 18 + TypeScript
- **LLM**: @mlc-ai/web-llm
- **State**: Zustand
- **Storage**: Dexie.js (IndexedDB)
- **UI**: shadcn/ui + Tailwind CSS
- **Linting**: Biome
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions + Vercel

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed

### Installation

```bash
bun install
```

### Development

```bash
bun dev
```

This starts the development server for the main application.

### Build

```bash
bun build
```

Builds all packages and applications.

### Lint

```bash
bun lint
```

Runs linting on all packages.

### Test

```bash
bun test
```

Runs tests across all packages.

## Monorepo Structure

```
apps/
  └── persona-configurator/    # Main React application

packages/
  ├── persona-engine/          # Web-LLM integration and persona logic
  ├── persona-storage/         # IndexedDB persistence layer
  └── tooling-config/          # Shared Biome, TypeScript, Tailwind config
```

## Deployment

This project is configured for deployment on Vercel with automatic CI/CD via GitHub Actions.

## License

MIT
