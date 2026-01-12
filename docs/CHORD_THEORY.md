# Chord Theory Reference

Based on "Standard Chord Symbol Notation" by Carl Brandt and Clinton Roemer.

## Core Concept

Chords are defined as **semitone intervals from root**. This makes transposition simple arithmetic.

```
Semitones: 0  1  2  3  4  5  6  7  8  9  10 11
Notes:     C  C# D  Eb E  F  F# G  Ab A  Bb B
Intervals: 1  b2 2  b3 3  4  b5 5  #5 6  b7 7
```

## Data Source

`src/data/chord_schema.json` contains:
- `noteToSemitone` - Note name → semitone (0-11)
- `intervalToSemitone` - Interval → semitone (extensions use 12+)
- `chords` - Each chord type with semitones array and aliases

## Building a Chord

**Bbmaj7** = Bb + [0, 4, 7, 11]

```
Bb = 10
10 + 0  = 10 → Bb
10 + 4  = 14 % 12 = 2 → D
10 + 7  = 17 % 12 = 5 → F
10 + 11 = 21 % 12 = 9 → A
```

Result: **Bb D F A**

## Identifying a Chord

Given notes **F A C D**:

1. Convert to semitones: [5, 9, 0, 2]
2. Try F as root (5): intervals = [0, 4, 7, 9]
3. Match: `"6".semitones = [0, 4, 7, 9]`
4. Result: **F6**

## Common Formulas

| Type | Semitones | Formula |
|------|-----------|---------|
| Major | [0,4,7] | 1 3 5 |
| Minor | [0,3,7] | 1 b3 5 |
| 7 | [0,4,7,10] | 1 3 5 b7 |
| maj7 | [0,4,7,11] | 1 3 5 7 |
| m7 | [0,3,7,10] | 1 b3 5 b7 |
| m7b5 | [0,3,6,10] | 1 b3 b5 b7 |
| dim7 | [0,3,6,9] | 1 b3 b5 bb7 |
| sus4 | [0,5,7] | 1 4 5 |
| sus2 | [0,2,7] | 1 2 5 |
| add9 | [0,4,7,14] | 1 3 5 9 |

## Slash Chords

`Dm7/G` = Dm7 chord with G in bass (independent of voicing)

## Enharmonic Equivalents

Some chords share notes:
- F6 = Dm7 (different root)
- dim7 has 4 possible roots (symmetric)

Context (especially bass note) determines the name.
