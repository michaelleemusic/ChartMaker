# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

chartForge - Chart builder web-app for worship-style music.

**Primary Repository**: https://github.com/michaelleemusic/chartForge
**Auth Method**: SSH keys (all local dev computers have SSH key access)

## Commands

- `npm run build` - Compile TypeScript to dist/
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `php -S localhost:3000 web/index.php` - Run local dev server (PHP)
- `node web/server.js` - Run local dev server (Node.js)

## Deployment - Production Server

**Live URL**: https://proflee.me/chartforge/
**Server**: DreamHost (pdx1-shared-a1-17.dreamhost.com)
**SSH User**: proflee_me
**Web Root**: ~/proflee.me/chartforge/

### Deploy to Production

```bash
# Sync project to production (excludes dev files)
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.wav' \
  --exclude='REF' \
  --exclude='library/trash' \
  ./ proflee_me@pdx1-shared-a1-17.dreamhost.com:~/proflee.me/chartforge/

# Fix permissions (required after deploy)
ssh proflee_me@pdx1-shared-a1-17.dreamhost.com "chmod -R 755 ~/proflee.me/chartforge/ && find ~/proflee.me/chartforge/ -type f -exec chmod 644 {} \;"
```

### URL Structure

- **App URL**: https://proflee.me/chartforge/ (served via .htaccess rewrite to web/index.html)
- **API Endpoints**: /api/library/* routed to web/index.php

## Project Structure

```
chartForge/
├── web/                    # Web application (main deliverable)
│   ├── index.html          # Main interface with renderer
│   ├── index.php           # PHP backend (DreamHost)
│   └── server.js           # Node.js backend (local dev)
├── src/                    # TypeScript utilities
│   ├── types.ts            # Core type definitions
│   ├── parser.ts           # Format detection, parsing
│   ├── chordUtils.ts       # Chord manipulation
│   └── *.test.ts           # Unit tests (94 tests)
├── library/                # Song library (677 charts)
│   ├── *.txt               # Chart files in ChordPro format
│   └── index.json          # Searchable index
├── scripts/                # Build utilities
│   ├── build_index.py      # Rebuild library/index.json
│   ├── convert_onsong.py   # Convert OnSong files
│   └── convert_to_numbers.py
├── docs/                   # Documentation
└── .htaccess               # Apache routing for production
```

## Key Features

- **Side-by-side editor**: Live preview as you type
- **Library search**: 677 searchable charts
- **Display modes**: Full, Chords-only, Lyrics-only
- **Key transposition**: Render in any key or Nashville Numbers
- **PDF export**: Single PDF or Full Set (26 PDFs: 13 keys × 2 modes)
- **Unicode accidentals**: ♭ and ♯ display

## Documentation

- `docs/ARCHITECTURE.md` - Data model, tech stack
- `docs/CHART_FORMAT.md` - Page layout, chord notation
- `docs/CHORD_THEORY.md` - Semitone-based chord building
- `docs/SECTION_TYPES.md` - Section ID reference
- `docs/DEVELOPMENT.md` - Setup, commands, workflow
- `docs/ROADMAP.md` - Feature phases and planning

## Key Fonts

Lato (Bold/Regular/Light) for text, loaded from Google Fonts.
