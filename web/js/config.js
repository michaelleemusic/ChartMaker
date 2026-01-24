// chartForge - Configuration Constants

// Section abbreviations for roadmap display
export const SECTION_ABBREVIATIONS = {
  intro: 'I',
  verse: 'V',
  prechorus: 'Pr',
  halfchorus: 'HC',
  chorus: 'C',
  bridge: 'B',
  breakdown: 'Bd',
  outro: 'O',
  tag: 'Tg',
  instrumental: 'Inst',
  interlude: 'It',
  vamp: 'Vp',
  turnaround: 'T',
  ending: 'E',
  custom: ''
};

export const SECTION_NAMES = {
  intro: 'INTRO',
  verse: 'VERSE',
  prechorus: 'PRE CHORUS',
  halfchorus: 'HALF-CHORUS',
  chorus: 'CHORUS',
  bridge: 'BRIDGE',
  breakdown: 'BREAKDOWN',
  outro: 'OUTRO',
  tag: 'TAG',
  instrumental: 'INSTRUMENTAL',
  interlude: 'INTERLUDE',
  vamp: 'VAMP',
  turnaround: 'TURNAROUND',
  ending: 'ENDING',
  custom: ''
};

// Default render configuration (Letter, 2-column)
export const DEFAULT_CONFIG = {
  displayMode: 'full', // 'full', 'chords', or 'lyrics'
  pageFormat: 'letter', // 'letter' or 'ipad'
  singleColumn: false,
  page: { width: 816, height: 1056 },
  margins: { top: 40, right: 40, bottom: 60, left: 40 },
  columnGap: 30,
  fonts: {
    title: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 28, weight: 'bold', lineHeight: 1.2 },
    artist: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 14, weight: 'normal', lineHeight: 1.4 },
    metadata: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 12, weight: 'normal', lineHeight: 1.4 },
    sectionName: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 13, weight: 'bold', lineHeight: 1.4 },
    chordRoot: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 14, weight: 'bold', lineHeight: 1.3 },
    chordQuality: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 10, weight: 'normal', lineHeight: 1.3 },
    lyrics: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 13, weight: 'normal', lineHeight: 1.4 },
    dynamics: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 11, weight: '300', lineHeight: 1.4 },
    roadmapBadge: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 10, weight: 'normal', lineHeight: 1 },
    pageNumber: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 12, weight: 'normal', lineHeight: 1.4 }
  },
  colors: {
    background: '#ffffff',
    text: '#000000',
    textSecondary: '#222222',
    textMuted: '#666666',
    badgeFill: '#4a4a4a',
    badgeText: '#ffffff',
    rule: '#cccccc',
    roadmapInactive: '#666666'
  },
  badgeRadius: 11,
  roadmapBadgeRadius: 12,
  spacing: {
    afterHeader: 15,
    afterRoadmap: 20,
    betweenSections: 18,
    betweenLines: 4,
    chordToLyric: 2,
    sectionHeaderHeight: 28,
    roadmapHeight: 36
  }
};

// iPad config (single column for full/lyrics, 2-col for chords-only)
export const IPAD_CONFIG = {
  displayMode: 'full',
  pageFormat: 'ipad',
  singleColumn: true,
  page: { width: 816, height: 1056 },  // Same page size
  margins: { top: 50, right: 50, bottom: 70, left: 50 },
  columnGap: 30,  // Used when chords-only switches to 2-column
  fonts: {
    title: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 32, weight: 'bold', lineHeight: 1.2 },
    artist: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 16, weight: 'normal', lineHeight: 1.4 },
    metadata: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 14, weight: 'normal', lineHeight: 1.4 },
    sectionName: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 15, weight: 'bold', lineHeight: 1.4 },
    chordRoot: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 17, weight: 'bold', lineHeight: 1.3 },
    chordQuality: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 12, weight: 'normal', lineHeight: 1.3 },
    lyrics: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 16, weight: 'normal', lineHeight: 1.4 },
    dynamics: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 13, weight: '300', lineHeight: 1.4 },
    roadmapBadge: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 11, weight: 'normal', lineHeight: 1 },
    pageNumber: { family: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif', size: 14, weight: 'normal', lineHeight: 1.4 }
  },
  colors: {
    background: '#ffffff',
    text: '#000000',
    textSecondary: '#222222',
    textMuted: '#666666',
    badgeFill: '#4a4a4a',
    badgeText: '#ffffff',
    rule: '#cccccc',
    roadmapInactive: '#666666'
  },
  badgeRadius: 13,
  roadmapBadgeRadius: 14,
  spacing: {
    afterHeader: 18,
    afterRoadmap: 24,
    betweenSections: 22,
    betweenLines: 5,
    chordToLyric: 3,
    sectionHeaderHeight: 32,
    roadmapHeight: 40
  }
};

// All keys for PDF export
export const ALL_KEYS = ['numbers', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Display modes for PDF export
export const ALL_MODES = [
  { value: 'full', label: '' },        // Full chart (no suffix)
  { value: 'chords', label: 'Chords' }  // Chords only
];
