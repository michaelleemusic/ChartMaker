/**
 * Layout Module Tests
 */

import {
  calculateLineHeight,
  calculateSectionHeight,
  calculateContentArea,
  generateRoadmap,
  getSectionDisplayName,
  getSectionAbbreviation,
  calculateLayout,
  getSectionsForPage,
  estimateChordWidth,
  distributeChords
} from './layout';
import { DEFAULT_CONFIG } from './types';
import { Song, Section, Line, SectionType } from '../types';

describe('calculateLineHeight', () => {
  it('should calculate height for chord-only line', () => {
    const line: Line = {
      chords: [{ chord: { root: 'C' }, position: 0 }]
    };
    const height = calculateLineHeight(line);
    expect(height).toBeGreaterThan(0);
  });

  it('should calculate height for lyric-only line', () => {
    const line: Line = {
      lyrics: 'Hello world',
      chords: []
    };
    const height = calculateLineHeight(line);
    expect(height).toBeGreaterThan(0);
  });

  it('should calculate height for chord + lyric line', () => {
    const line: Line = {
      lyrics: 'Hello world',
      chords: [{ chord: { root: 'C' }, position: 0 }]
    };
    const height = calculateLineHeight(line);
    // Should be larger than either alone
    expect(height).toBeGreaterThan(calculateLineHeight({ chords: [], lyrics: 'test' }));
  });

  it('should return minimal height for empty line', () => {
    const line: Line = { chords: [] };
    const height = calculateLineHeight(line);
    expect(height).toBe(DEFAULT_CONFIG.spacing.betweenLines);
  });
});

describe('calculateSectionHeight', () => {
  it('should include header height', () => {
    const section: Section = {
      type: 'verse',
      lines: []
    };
    const height = calculateSectionHeight(section);
    expect(height).toBe(DEFAULT_CONFIG.spacing.sectionHeaderHeight);
  });

  it('should add dynamics height when present', () => {
    const sectionWithDynamics: Section = {
      type: 'verse',
      dynamics: 'Full band',
      lines: []
    };
    const sectionWithout: Section = {
      type: 'verse',
      lines: []
    };
    expect(calculateSectionHeight(sectionWithDynamics)).toBeGreaterThan(
      calculateSectionHeight(sectionWithout)
    );
  });

  it('should add height for each line', () => {
    const section: Section = {
      type: 'verse',
      lines: [
        { lyrics: 'Line 1', chords: [] },
        { lyrics: 'Line 2', chords: [] }
      ]
    };
    const height = calculateSectionHeight(section);
    expect(height).toBeGreaterThan(DEFAULT_CONFIG.spacing.sectionHeaderHeight);
  });
});

describe('generateRoadmap', () => {
  it('should generate entries for each unique section', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'intro', lines: [] },
        { type: 'verse', number: 1, lines: [] },
        { type: 'chorus', lines: [] }
      ]
    };
    const roadmap = generateRoadmap(song);
    expect(roadmap).toHaveLength(3);
    expect(roadmap[0].abbreviation).toBe('I');
    expect(roadmap[1].abbreviation).toBe('V1');
    expect(roadmap[2].abbreviation).toBe('C');
  });

  it('should count consecutive identical sections', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'chorus', lines: [] },
        { type: 'chorus', lines: [] },
        { type: 'chorus', lines: [] }
      ]
    };
    const roadmap = generateRoadmap(song);
    expect(roadmap).toHaveLength(1);
    expect(roadmap[0].abbreviation).toBe('C');
    expect(roadmap[0].repeatCount).toBe(3);
  });

  it('should not add repeat count for single occurrences', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'intro', lines: [] }
      ]
    };
    const roadmap = generateRoadmap(song);
    expect(roadmap[0].repeatCount).toBeUndefined();
  });
});

describe('getSectionDisplayName', () => {
  it('should return custom label if present', () => {
    const section: Section = {
      type: 'verse',
      label: 'VERSE 1 (SOFT)',
      lines: []
    };
    expect(getSectionDisplayName(section)).toBe('VERSE 1 (SOFT)');
  });

  it('should return type name with number', () => {
    const section: Section = {
      type: 'verse',
      number: 2,
      lines: []
    };
    expect(getSectionDisplayName(section)).toBe('VERSE 2');
  });

  it('should return type name without number', () => {
    const section: Section = {
      type: 'chorus',
      lines: []
    };
    expect(getSectionDisplayName(section)).toBe('CHORUS');
  });
});

describe('getSectionAbbreviation', () => {
  it('should return standard abbreviation', () => {
    expect(getSectionAbbreviation({ type: 'intro', lines: [] })).toBe('I');
    expect(getSectionAbbreviation({ type: 'verse', lines: [] })).toBe('V');
    expect(getSectionAbbreviation({ type: 'chorus', lines: [] })).toBe('C');
    expect(getSectionAbbreviation({ type: 'bridge', lines: [] })).toBe('B');
  });

  it('should include number suffix', () => {
    expect(getSectionAbbreviation({ type: 'verse', number: 1, lines: [] })).toBe('V1');
    expect(getSectionAbbreviation({ type: 'verse', number: 2, lines: [] })).toBe('V2');
  });

  it('should handle custom sections', () => {
    expect(getSectionAbbreviation({ type: 'custom', label: 'Refrain', lines: [] })).toBe('RE');
  });
});

describe('calculateLayout', () => {
  it('should return page count of 1 for small song', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'verse', lines: [{ lyrics: 'Hello', chords: [] }] }
      ]
    };
    const layout = calculateLayout(song);
    expect(layout.pageCount).toBe(1);
  });

  it('should position sections in columns', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'verse', number: 1, lines: [{ lyrics: 'Line 1', chords: [] }] },
        { type: 'verse', number: 2, lines: [{ lyrics: 'Line 2', chords: [] }] }
      ]
    };
    const layout = calculateLayout(song);
    // First section in column 0
    expect(layout.sections[0].column).toBe(0);
  });

  it('should calculate column dimensions', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: []
    };
    const layout = calculateLayout(song);
    expect(layout.columnWidth).toBeGreaterThan(0);
    expect(layout.columnHeight).toBeGreaterThan(0);
    expect(layout.column1X).toBe(DEFAULT_CONFIG.margins.left);
    expect(layout.column2X).toBeGreaterThan(layout.column1X);
  });
});

describe('getSectionsForPage', () => {
  it('should filter sections by page', () => {
    const song: Song = {
      title: 'Test',
      artist: 'Test',
      key: 'C',
      sections: [
        { type: 'verse', number: 1, lines: [] },
        { type: 'verse', number: 2, lines: [] }
      ]
    };
    const layout = calculateLayout(song);
    const page0Sections = getSectionsForPage(layout, 0);
    expect(page0Sections.length).toBeGreaterThan(0);
    page0Sections.forEach(s => expect(s.page).toBe(0));
  });
});

describe('calculateContentArea', () => {
  it('should calculate content area dimensions', () => {
    const area = calculateContentArea();
    expect(area.width).toBeGreaterThan(0);
    expect(area.height).toBeGreaterThan(0);
    expect(area.columnWidth).toBeGreaterThan(0);
    expect(area.startY).toBeGreaterThan(DEFAULT_CONFIG.margins.top);
  });
});

describe('estimateChordWidth', () => {
  it('should estimate width for simple chord', () => {
    const width = estimateChordWidth({ root: 'C' });
    expect(width).toBeGreaterThan(0);
  });

  it('should add width for quality', () => {
    const simpleWidth = estimateChordWidth({ root: 'C' });
    const qualityWidth = estimateChordWidth({ root: 'C', quality: 'm7' });
    expect(qualityWidth).toBeGreaterThan(simpleWidth);
  });

  it('should add width for bass note', () => {
    const simpleWidth = estimateChordWidth({ root: 'C' });
    const bassWidth = estimateChordWidth({ root: 'C', bass: 'G' });
    expect(bassWidth).toBeGreaterThan(simpleWidth);
  });
});

describe('distributeChords', () => {
  it('should return empty array for zero chords', () => {
    expect(distributeChords(0, 100)).toEqual([]);
  });

  it('should return [0] for single chord', () => {
    expect(distributeChords(1, 100)).toEqual([0]);
  });

  it('should distribute chords evenly', () => {
    const positions = distributeChords(4, 400);
    expect(positions).toHaveLength(4);
    expect(positions[0]).toBe(0);
    expect(positions[1]).toBe(100);
    expect(positions[2]).toBe(200);
    expect(positions[3]).toBe(300);
  });
});
