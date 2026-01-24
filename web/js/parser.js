// chartForge - ChordPro Parser

export function parseChordPro(input) {
  const song = {
    title: 'Untitled',
    artist: 'Unknown',
    version: '',
    key: 'C',
    tempo: null,
    timeSignature: '4/4',
    sections: []
  };

  const lines = input.split(/\r?\n/);
  let currentSection = null;
  let pendingDynamics = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse directives (allow empty values)
    const directiveMatch = trimmed.match(/^\{(\w+):\s*(.*?)\s*\}$/);
    if (directiveMatch) {
      const [, directive, rawValue] = directiveMatch;
      const value = rawValue ? rawValue.trim() : '';
      switch (directive.toLowerCase()) {
        case 'title':
        case 't':
          song.title = value;
          break;
        case 'artist':
        case 'a':
          song.artist = value;
          break;
        case 'key':
        case 'k':
          song.key = value;
          break;
        case 'tempo':
          song.tempo = parseInt(value, 10);
          break;
        case 'time':
          song.timeSignature = value;
          break;
        case 'version':
        case 'v':
          song.version = value;
          break;
        case 'section':
          // Start new section
          const sectionInfo = parseSectionName(value);
          currentSection = {
            type: sectionInfo.type,
            number: sectionInfo.number,
            repeatCount: sectionInfo.repeatCount,
            hasVamp: sectionInfo.hasVamp,
            label: sectionInfo.label,
            dynamics: pendingDynamics,
            lines: []
          };
          pendingDynamics = null;
          song.sections.push(currentSection);
          break;
        case 'dynamics':
          if (currentSection) {
            if (currentSection.lines.length === 0) {
              // Section header dynamics
              currentSection.dynamics = value;
            } else {
              // Mid-section dynamics - add as inline line
              currentSection.lines.push({ type: 'dynamics', text: value });
            }
          } else {
            pendingDynamics = value;
          }
          break;
        case 'key_change':
        case 'keychange':
          // Mid-song key change directive - create as standalone section
          // Save current section if it has content
          if (currentSection && currentSection.lines.length > 0) {
            // Section already in array, just clear reference
            currentSection = null;
          }
          // Track current key for key changes (separate from song.key which stays as original)
          const currentKeyForChange = song._currentKey || song.key;
          // Create key_change as its own section
          const keyChangeSection = {
            type: 'key_change',
            newKey: value.trim(),
            previousKey: currentKeyForChange,
            lines: []
          };
          song.sections.push(keyChangeSection);
          // Track current key internally but don't change song.key (original key)
          song._currentKey = value.trim();
          currentSection = null;
          break;
      }
      continue;
    }

    // Parse chord/lyric lines (preserve leading spaces for alignment)
    if (currentSection && trimmed.includes('[')) {
      const parsedLine = parseChordLine(line.trimEnd());
      currentSection.lines.push(parsedLine);
    } else if (currentSection && !trimmed.startsWith('{')) {
      // Plain lyrics without chords
      currentSection.lines.push({ lyrics: line.trimEnd(), chords: [] });
    }
  }

  return song;
}

export function parseSectionName(value) {
  // Check for vamp indicator [Vamp] or [V]
  const vampMatch = value.match(/\s*\[(vamp|v)\]\s*$/i);
  const hasVamp = !!vampMatch;
  let valueWithoutModifier = value.replace(/\s*\[(vamp|v)\]\s*$/i, '').trim();

  // Check for repeat indicator [2x], [3x], etc.
  const repeatMatch = valueWithoutModifier.match(/\s*\[(\d+)x\]\s*$/i);
  const repeatCount = repeatMatch ? parseInt(repeatMatch[1], 10) : undefined;
  const valueWithoutRepeat = valueWithoutModifier.replace(/\s*\[\d+x\]\s*$/i, '').trim();

  // Check for numbered sections (Verse 1, Bridge 2, etc.)
  const numberMatch = valueWithoutRepeat.match(/(\d+)$/);
  const number = numberMatch ? parseInt(numberMatch[1], 10) : undefined;
  const baseName = valueWithoutRepeat.replace(/\s*\d+$/, '').toLowerCase().replace(/\s+/g, '');

  const typeMap = {
    'intro': 'intro',
    'verse': 'verse',
    'prechorus': 'prechorus',
    'pre-chorus': 'prechorus',
    'halfchorus': 'halfchorus',
    'half-chorus': 'halfchorus',
    'chorus': 'chorus',
    'bridge': 'bridge',
    'breakdown': 'breakdown',
    'outro': 'outro',
    'tag': 'tag',
    'instrumental': 'instrumental',
    'interlude': 'interlude',
    'vamp': 'vamp',
    'turnaround': 'turnaround',
    'ending': 'ending'
  };

  return {
    type: typeMap[baseName] || 'custom',
    number,
    repeatCount,
    hasVamp,
    label: typeMap[baseName] ? null : valueWithoutRepeat
  };
}

export function parseChordLine(line) {
  const chords = [];
  let lyrics = '';
  let position = 0;
  let i = 0;

  while (i < line.length) {
    if (line[i] === '[') {
      const end = line.indexOf(']', i);
      if (end > i) {
        const chordStr = line.substring(i + 1, end);
        const chord = parseChordString(chordStr);
        chords.push({ chord, position });
        i = end + 1;
        continue;
      }
    }
    lyrics += line[i];
    position++;
    i++;
  }

  return { lyrics: lyrics.trimEnd() || undefined, chords };
}

export function parseChordString(str) {
  // First check for number chords (Nashville notation): 1, 2, 42, 6m7, 1/3, etc.
  const numberMatch = str.match(/^([#b]?[1-7])(.*?)(?:\/([#b]?[1-7]))?$/);
  if (numberMatch) {
    const [, root, quality, bass] = numberMatch;
    return {
      root,
      quality: quality || undefined,
      bass: bass || undefined,
      isNumber: true
    };
  }

  // Match letter chords: root, quality, and optional bass note
  const match = str.match(/^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/);
  if (!match) return { root: str };

  const [, root, quality, bass] = match;
  return {
    root,
    quality: quality || undefined,
    bass: bass || undefined,
    isNumber: false
  };
}

// Extract title from chart content
export function extractTitle(content) {
  const match = content.match(/\{title:\s*(.+?)\}/i);
  return match ? match[1].trim() : 'Untitled';
}

// Extract version from chart content
export function extractVersion(content) {
  const match = content.match(/\{version:\s*(.+?)\}/i);
  return match ? match[1].trim() : '';
}
