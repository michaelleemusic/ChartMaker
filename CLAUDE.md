# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChartMaker is a web application for creating and editing Nashville Number System chord charts, styled after MultiTracks.com charts. The app parses, displays, and generates chord charts used by worship musicians.

## Reference Materials

- `REF/Charts/` - Sample PDF charts exported from MultiTracks ChartBuilder
- `REF/MT ChartBuilder/` - Extracted MultiTracks ChartBuilder iOS app (for reference only)

## Nashville Number System Chart Format

### Chart Structure
- **Header**: Song title, artist, page number, key, tempo, time signature
- **Roadmap**: Visual section indicators at top (e.g., `I V1 Pr C V2 Pr C B Tg E`) with repeat counts as superscripts
- **Sections**: Labeled blocks with:
  - Section code in circle
  - Section name with horizontal rule
  - Optional dynamics/instrumentation notes (right-aligned)

### Section Types (from MultiTracks)

| ID | Abbrev | Name | ID | Abbrev | Name |
|----|--------|------|----|--------|------|
| 11 | I | Intro | 8 | E | Ending |
| 19-79 | V1-V8 | Verse 1-8 | 12 | O | Outro |
| 13 | Pc | Pre Chorus | 5 | C | Chorus |
| 67-70 | Pr | Pre Chorus 1-4 | 64,6,71-77 | C1-C8 | Chorus 1-8 |
| 3 | B | Bridge | 16 | Tg | Tag |
| 65,58-60,80-83 | B1-B8 | Bridge 1-8 | 92-96 | T | Tag 1-5 |
| 2 | Bd | Breakdown | 14 | Rf | Refrain |
| 9 | Is | Instrumental | 17 | Vp | Vamp |
| 10 | It | Interlude | 62 | Ta | Turnaround |
| 1 | Ac | Acapella | 63 | Po | Post Chorus |
| 15 | S | Solo | 53 | Ex | Exhortation |

### Chord Display Modes
1. **Letter notation**: Actual chord names (e.g., `Eb`, `Bbsus4`, `Cm7`, `Ab2`, `Eb/G`)
2. **Number notation**: Nashville numbers (e.g., `1`, `5sus4`, `6m7`, `42`, `1/3`)

### Chord Formatting
- Root note/number in **bold**
- Chord quality as superscript (sus4, sus2, add4, m7, 2, etc.)
- Slash chords: `Cm7/Bb` or `6m7/5`
- Chords positioned above lyrics at syllable where chord changes

### Layout
- Two-column layout per page
- Lyrics with chords inline above text
- Bar lines implied by chord spacing

## Technical Reference (from ChartBuilder app)
- **Fonts**: Lato (Regular, Bold, Light), chartbuilder.ttf (icons), GoNotoKurrent
- **Rendering**: SkiaSharp-based
- **Chord parsing**: Supports ChordPro format input
