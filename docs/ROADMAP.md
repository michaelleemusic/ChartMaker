# Roadmap

## Phase 1: Core Parser ✓
- [x] Define TypeScript data model (Song, Section, Chord)
- [x] Parse simple text format (chords above lyrics)
- [x] Parse ChordPro format
- [x] Convert between letter/number notation
- [x] Unit tests for parser

## Phase 2: Renderer ✓
- [x] Canvas-based preview rendering
- [x] Two-column page layout
- [x] Section headers with badges
- [x] Section boxes with rounded corners
- [x] Chord positioning above lyrics
- [x] Roadmap bar generation
- [x] Page break calculation
- [x] Unicode accidentals (♭ and ♯)

## Phase 3: PDF Export ✓
- [x] PDF generation matching MultiTracks style
- [x] Multi-page support
- [x] Download functionality
- [x] Full Set export (all keys as ZIP)

## Phase 4: Editor UI ✓
- [x] Side-by-side editor with live preview
- [x] Library search (677 charts)
- [x] Library management (new, update, delete)
- [x] Random song button
- [x] Key selector dropdown

## Phase 5: Polish (In Progress)
- [x] Key transposition
- [x] Number ↔ letter toggle
- [ ] Print styles
- [ ] Mobile responsive
- [x] Library save/load (PHP/Node backend)

## Deployment ✓
- [x] PHP backend for DreamHost shared hosting
- [x] Node.js backend for local development
- [x] .htaccess for Apache routing

## Future
- Import from PDF (OCR)
- CCLI/SongSelect integration
- Team sharing
- Setlist builder
