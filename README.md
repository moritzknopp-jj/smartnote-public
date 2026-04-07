# SMARTNOTE

AI-powered study system built with Next.js + Electron.

## Features
- Upload and process study material
- AI chat, analysis, quiz, and flashcard generation
- Mindmap and notes views
- Local/Cloud AI mode support (Ollama, Gemini)
- Desktop app packaging via Electron

## Tech Stack
- Next.js 16 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Electron + electron-builder

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and set your keys:
- `GEMINI_API_KEY` for cloud AI
- `OLLAMA_BASE_URL` for local Ollama
- `AI_MODE` to `local`, `cloud`, or `auto`

### 3. Run in development
```bash
npm run dev
```
This starts Next.js and Electron together.

## Build

### Production build
```bash
npm run build
```

### Windows installer
```bash
npm run dist
```
Installer output is generated in `dist/`.

## Online Validation (GitHub Actions)
This repository includes CI that runs on pushes and pull requests:
- Install dependencies
- Run production build
- Upload build log artifact

Workflow file: `.github/workflows/ci.yml`

## Notes
- The production Electron app starts the bundled Next standalone server.
- Build pipeline copies required `.next/static` and `public` assets into standalone output for packaged runtime.

## Project Scripts
- `npm run dev` - Start Next + Electron in development
- `npm run build` - Build Next and prepare standalone assets
- `npm run electron` - Launch Electron app
- `npm run dist` - Build and package Windows installer

## Troubleshooting
If the packaged app opens without styling, run:
```bash
npm run build
```
and ensure standalone assets were copied during build.
