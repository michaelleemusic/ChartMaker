# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChartMaker is a web application for creating and editing Nashville Number System chord charts, styled after MultiTracks.com charts. The app parses, displays, and generates chord charts used by worship musicians.

## Nashville Number System Chart Format

The reference charts in `REF/` demonstrate the target output format from MultiTracks.com:

### Chart Structure
- **Header**: Song title, artist, page number, key, tempo, time signature
- **Roadmap**: Visual section indicators at top (e.g., `I V1 Pr C V2 Pr C B Tg E`) with repeat counts shown as superscripts
- **Sections**: Labeled blocks (INTRO, VERSE 1, CHORUS, BRIDGE, TAG, ENDING, etc.) with:
  - Section code in circle (I, V1, V2, Pr, C, B, Bd, Tg, Vp, Rf, It, Is, E)
  - Section name with horizontal rule
  - Optional dynamics/instrumentation notes (right-aligned, e.g., "Add Bass & soft Drum groove")

### Section Codes
- `I` = Intro
- `V1/V2/V3/V4` = Verse 1/2/3/4
- `Pr` = Pre-Chorus
- `C` = Chorus
- `B/B1/B2/B3` = Bridge variants
- `Bd` = Breakdown
- `Tg` = Tag
- `Vp` = Vamp
- `Rf` = Refrain
- `It` = Interlude
- `Is` = Instrumental
- `Ta` = Turnaround
- `E` = Ending

### Chord Notation
Two display modes exist (same song available in both):
1. **Letter notation**: Actual chord names (e.g., `Eb`, `Bbsus4`, `Cm7`, `Ab2`, `Eb/G`)
2. **Number notation**: Nashville numbers (e.g., `1`, `5sus4`, `6m7`, `42`, `1/3`)

### Chord Formatting
- Root note/number in **bold**
- Chord quality as superscript (sus4, sus2, add4, m7, 2, etc.)
- Slash chords: `Cm7/Bb` or `6m7/5`
- Chords positioned above lyrics at the syllable where chord changes occur

### Layout
- Two-column layout on each page
- Lyrics with chords inline above text
- Bar lines implied by chord spacing, not explicitly drawn
