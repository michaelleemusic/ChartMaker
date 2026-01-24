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

## Phase 5: Polish ✓
- [x] Key transposition
- [x] Number ↔ letter toggle
- [x] Auto-complete (numbers → [], { → {})
- [x] Leading space preservation for lyric alignment
- [x] Key in PDF filename
- [x] Page preservation during editing
- [x] Proper page 2+ header spacing
- [x] Display modes (Full/Chords/Lyrics)
- [x] Chord consolidation (rows of 4 in chords-only)
- [x] Full Set ZIP (27 PDFs: 13 keys × 2 modes + lyrics)
- [x] Library save/load (PHP/Node backend)
- [x] Mid-song key changes with {key_change: X}
- [x] Band notes in parentheses (italic/muted styling)
- [x] Right-click context menu (Copy/Strip Chords/Lyrics)
- [x] Tighter lyrics-only PDF spacing
- [x] Roboto as default font
- [ ] Print styles
- [ ] Mobile responsive

## Deployment ✓
- [x] PHP backend for DreamHost shared hosting
- [x] Node.js backend for local development
- [x] .htaccess for Apache routing

## Phase 6: Import Tools ✓
- [x] PDF import (MultiTracks format → ChordPro)
- [x] Font-based parsing (chords, lyrics, dynamics, sections)
- [x] Sharp/flat detection from vector graphics
- [x] Letter-to-Nashville number conversion button

## Future
- CCLI/SongSelect integration
- Team sharing
- Setlist builder

---

## Release History

### v1.6.0 (January 2026)
- PDF import: One-click MultiTracks PDF → ChordPro conversion
- "To Numbers" button: Convert letter chords to Nashville numbers
- Font-based PDF parsing with sharp detection from vector graphics
- Python `convert_pdf.py` script for batch conversion

### v1.5.0 (January 2026)
- Mid-song key changes with `{key_change: X}` directive
- Band notes in parentheses render as italic/muted
- Right-click context menu: Copy Chords, Copy Lyrics, Strip Chords, Strip Lyrics
- Tighter line spacing in lyrics-only PDF mode
- Roboto as default font (removed font selector)
- Key selector moved to preview panel
- Fixed page 2+ layout (uses full available space)
- Page preservation when editing (no reset to page 1)

### v1.3.0
- Initial public release
- Full ChordPro parser
- PDF export with Full Set (26 PDFs)
- Library management (680 songs locally)
