// chartForge - Music Theory Utilities

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
export const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb']);

// Properly spelled major scales (music theory requires unique letter names)
export const MAJOR_SCALES = {
  'C':  ['C',  'D',  'E',  'F',  'G',  'A',  'B'],
  'G':  ['G',  'A',  'B',  'C',  'D',  'E',  'F#'],
  'D':  ['D',  'E',  'F#', 'G',  'A',  'B',  'C#'],
  'A':  ['A',  'B',  'C#', 'D',  'E',  'F#', 'G#'],
  'E':  ['E',  'F#', 'G#', 'A',  'B',  'C#', 'D#'],
  'B':  ['B',  'C#', 'D#', 'E',  'F#', 'G#', 'A#'],
  'F#': ['F#', 'G#', 'A#', 'B',  'C#', 'D#', 'E#'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'F':  ['F',  'G',  'A',  'Bb', 'C',  'D',  'E'],
  'Bb': ['Bb', 'C',  'D',  'Eb', 'F',  'G',  'A'],
  'Eb': ['Eb', 'F',  'G',  'Ab', 'Bb', 'C',  'D'],
  'Ab': ['Ab', 'Bb', 'C',  'Db', 'Eb', 'F',  'G'],
  'Db': ['Db', 'Eb', 'F',  'Gb', 'Ab', 'Bb', 'C'],
  'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'Cb': ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
};

export function getNoteIndex(note) {
  let idx = CHROMATIC_SHARPS.indexOf(note);
  if (idx === -1) idx = CHROMATIC_FLATS.indexOf(note);
  // Handle Cb, Fb, E#, B#
  if (idx === -1) {
    if (note === 'Cb') idx = 11;
    else if (note === 'Fb') idx = 4;
    else if (note === 'E#') idx = 5;
    else if (note === 'B#') idx = 0;
  }
  return idx;
}

export function getNoteAtIndex(index, preferFlats) {
  const normalizedIndex = ((index % 12) + 12) % 12;
  return preferFlats ? CHROMATIC_FLATS[normalizedIndex] : CHROMATIC_SHARPS[normalizedIndex];
}

// Convert sharp keys to their flat equivalents for display
// A# -> Bb, C# -> Db, D# -> Eb, F# -> Gb, G# -> Ab
export function preferFlatKey(key) {
  const sharpToFlat = {
    'A#': 'Bb', 'A#m': 'Bbm',
    'C#': 'Db', 'C#m': 'Dbm',
    'D#': 'Eb', 'D#m': 'Ebm',
    'F#': 'Gb', 'F#m': 'Gbm',
    'G#': 'Ab', 'G#m': 'Abm'
  };
  return sharpToFlat[key] || key;
}

export function getMajorScale(keyRoot) {
  // Use properly spelled scales from lookup
  if (MAJOR_SCALES[keyRoot]) {
    return MAJOR_SCALES[keyRoot];
  }
  // Fallback
  const rootIndex = getNoteIndex(keyRoot);
  if (rootIndex === -1) return null;
  const preferFlats = FLAT_KEYS.has(keyRoot);
  return MAJOR_SCALE_INTERVALS.map(interval => getNoteAtIndex(rootIndex + interval, preferFlats));
}

export function letterToNumber(chordStr, key) {
  // Parse the chord: root, quality, optional bass
  const match = chordStr.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!match) return chordStr;

  const [, root, quality, bass] = match;
  const scale = getMajorScale(key);
  if (!scale) return chordStr;

  // Find scale degree for root
  const rootIndex = getNoteIndex(root);
  if (rootIndex === -1) return chordStr;

  // Find which scale degree this is
  let scaleDegree = null;
  let chromaticPrefix = '';

  for (let i = 0; i < 7; i++) {
    const scaleNoteIndex = getNoteIndex(scale[i]);
    if (scaleNoteIndex === rootIndex) {
      scaleDegree = i + 1;
      break;
    }
  }

  // If not in scale, check for chromatic alterations
  if (scaleDegree === null) {
    const keyIndex = getNoteIndex(key);
    const semitoneFromRoot = ((rootIndex - keyIndex) + 12) % 12;

    // Map semitones to scale degrees with alterations
    const preferFlats = FLAT_KEYS.has(key);
    const semitoneMap = preferFlats
      ? { 0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' }
      : { 0: '1', 1: '#1', 2: '2', 3: '#2', 4: '3', 5: '4', 6: '#4', 7: '5', 8: '#5', 9: '6', 10: '#6', 11: '7' };

    const degreeStr = semitoneMap[semitoneFromRoot] || '1';
    let result = degreeStr + quality;

    if (bass) {
      const bassNum = letterToNumberSingle(bass, key, scale);
      result += '/' + bassNum;
    }

    return result;
  }

  // Build the number chord
  let result = chromaticPrefix + scaleDegree + quality;

  // Handle bass note
  if (bass) {
    const bassNum = letterToNumberSingle(bass, key, scale);
    result += '/' + bassNum;
  }

  return result;
}

function letterToNumberSingle(note, key, scale) {
  const noteIndex = getNoteIndex(note);

  for (let i = 0; i < 7; i++) {
    const scaleNoteIndex = getNoteIndex(scale[i]);
    if (scaleNoteIndex === noteIndex) {
      return String(i + 1);
    }
  }

  // Not in scale - return with chromatic alteration
  const keyIndex = getNoteIndex(key);
  const semitoneFromRoot = ((noteIndex - keyIndex) + 12) % 12;

  const preferFlats = FLAT_KEYS.has(key);
  const semitoneMap = preferFlats
    ? { 0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' }
    : { 0: '1', 1: '#1', 2: '2', 3: '#2', 4: '3', 5: '4', 6: '#4', 7: '5', 8: '#5', 9: '6', 10: '#6', 11: '7' };

  return semitoneMap[semitoneFromRoot] || '1';
}

export function numberToLetter(chordStr, key) {
  // Handle chromatic prefix (b7, #4, etc.)
  const chromaticMatch = chordStr.match(/^([#b])([1-7])(.*)$/);
  if (chromaticMatch) {
    const [, alteration, degreeStr, rest] = chromaticMatch;
    const degree = parseInt(degreeStr, 10);
    const scale = getMajorScale(key);
    if (!scale) return chordStr;

    const baseNote = scale[degree - 1];
    const baseIndex = getNoteIndex(baseNote);
    let targetIndex = baseIndex;
    if (alteration === '#') targetIndex = (baseIndex + 1) % 12;
    else if (alteration === 'b') targetIndex = (baseIndex + 11) % 12;

    const root = getNoteAtIndex(targetIndex, FLAT_KEYS.has(key));
    return root + rest;
  }

  // Parse regular number chord
  const match = chordStr.match(/^([1-7])(.*)$/);
  if (!match) return chordStr;

  const [, degreeStr, quality] = match;
  const degree = parseInt(degreeStr, 10);
  const scale = getMajorScale(key);
  if (!scale) return chordStr;

  const root = scale[degree - 1];

  // Handle slash chord bass note
  const slashMatch = quality.match(/^([^/]*)\/([#b]?[1-7])$/);
  if (slashMatch) {
    const [, chordQuality, bassNum] = slashMatch;
    const bassDegree = parseInt(bassNum.replace(/[#b]/, ''), 10);
    let bassNote = scale[bassDegree - 1];

    // Handle chromatic bass
    if (bassNum.startsWith('#')) {
      const idx = getNoteIndex(bassNote);
      bassNote = getNoteAtIndex((idx + 1) % 12, FLAT_KEYS.has(key));
    } else if (bassNum.startsWith('b')) {
      const idx = getNoteIndex(bassNote);
      bassNote = getNoteAtIndex((idx + 11) % 12, FLAT_KEYS.has(key));
    }

    return root + chordQuality + '/' + bassNote;
  }

  return root + quality;
}

export function convertChordToLetter(chord, key) {
  if (!chord.isNumber) return chord;

  const fullChord = chord.root + (chord.quality || '') + (chord.bass ? '/' + chord.bass : '');
  const converted = numberToLetter(fullChord, key);

  // Re-parse the converted chord
  const letterMatch = converted.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!letterMatch) return chord;

  const [, root, quality, bass] = letterMatch;
  return {
    root,
    quality: quality || undefined,
    bass: bass || undefined,
    isNumber: false
  };
}

export function convertSongToLetters(song, targetKey) {
  // Calculate transposition amount from original key to target key
  const originalKeyRoot = song.key.replace(/m$/, '');
  const targetKeyRoot = targetKey.replace(/m$/, '');
  const originalIndex = getNoteIndex(originalKeyRoot);
  const targetIndex = getNoteIndex(targetKeyRoot);
  const transposeSemitones = ((targetIndex - originalIndex) + 12) % 12;

  // Track current key through the song (for key changes)
  let currentKey = targetKey;

  return {
    ...song,
    sections: song.sections.map(section => {
      // Handle key_change sections - transpose the keys
      if (section.type === 'key_change') {
        // Calculate the new key by transposing the original new key
        const newKeyRoot = section.newKey.replace(/m$/, '');
        const isMinor = section.newKey.endsWith('m');
        const newKeyIndex = getNoteIndex(newKeyRoot);
        const transposedIndex = (newKeyIndex + transposeSemitones) % 12;
        // Always prefer flats for key display (Bb not A#)
        const transposedKeyRoot = getNoteAtIndex(transposedIndex, true);
        const transposedNewKey = preferFlatKey(transposedKeyRoot + (isMinor ? 'm' : ''));

        // Similarly transpose the previous key
        const prevKeyRoot = section.previousKey.replace(/m$/, '');
        const prevIsMinor = section.previousKey.endsWith('m');
        const prevKeyIndex = getNoteIndex(prevKeyRoot);
        const transposedPrevIndex = (prevKeyIndex + transposeSemitones) % 12;
        const transposedPrevKeyRoot = getNoteAtIndex(transposedPrevIndex, true);
        const transposedPrevKey = preferFlatKey(transposedPrevKeyRoot + (prevIsMinor ? 'm' : ''));

        // Update current key for subsequent sections
        currentKey = transposedNewKey;

        return {
          ...section,
          newKey: transposedNewKey,
          previousKey: transposedPrevKey
        };
      }

      // Regular section - convert chords
      return {
        ...section,
        lines: section.lines.map(line => {
          // Skip dynamics lines (no chords to convert)
          if (line.type === 'dynamics') return line;

          return {
            ...line,
            chords: (line.chords || []).map(cp => ({
              ...cp,
              chord: convertChordToLetter(cp.chord, currentKey)
            }))
          };
        })
      };
    })
  };
}
