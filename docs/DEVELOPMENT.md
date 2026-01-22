# Development Guide

## Setup

```bash
# Clone repo
git clone git@github.com:michaelleemusic/chartForge.git
cd chartForge

# Install dependencies
npm install

# Install PHP (for local server with library management)
brew install php
```

## Running Locally

### Option 1: PHP Server (recommended - full features)
```bash
php -S localhost:3000 demo/index.php
```
Supports: viewing, editing, library management (save/update/delete), PDF export

### Option 2: Node.js Server
```bash
node demo/server.js
```
Same features as PHP server

### Option 3: Static Server (read-only)
```bash
npx http-server . -p 3000 -c-1
```
View and export only, no library management

Open http://localhost:3000 in browser.

## Project Structure

```
chartForge/
├── src/                    # TypeScript source
│   ├── index.ts            # Main exports
│   ├── types.ts            # Core type definitions
│   ├── parser.ts           # Format detection, parsing
│   ├── chordProParser.ts   # ChordPro format parser
│   ├── simpleTextParser.ts # Simple text parser
│   ├── chordUtils.ts       # Chord manipulation
│   └── renderer/           # Canvas rendering
├── demo/
│   ├── index.html          # Web interface
│   ├── index.php           # PHP backend (DreamHost compatible)
│   └── server.js           # Node.js backend
├── library/                # Song library (679 charts)
│   ├── *.txt               # Chart files
│   ├── index.json          # Searchable index
│   └── trash/              # Deleted songs
├── scripts/                # Build utilities
├── docs/                   # Documentation
└── REF/                    # Reference materials
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to dist/ |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `python3 scripts/build_index.py` | Rebuild library index |

## Workflow

1. Create feature branch from `main`
2. Make changes, write tests
3. Run lint and tests locally
4. Commit with descriptive message
5. Push and create PR

## Commit Messages

Format: `<type>: <description>`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Example: `feat: add chord parser for ChordPro format`
