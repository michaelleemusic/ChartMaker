/**
 * Renderer Components
 *
 * Individual rendering functions for chart elements.
 */

export { renderHeader, calculateHeaderHeight } from './HeaderRenderer';
export type { HeaderRenderOptions } from './HeaderRenderer';

export { renderRoadmap, calculateRoadmapWidth } from './RoadmapRenderer';
export type { RoadmapRenderOptions } from './RoadmapRenderer';

export {
  renderChord,
  measureChordWidth,
  renderChordRow,
  renderChordsAboveLyrics,
  calculateEvenChordPositions
} from './ChordRenderer';

export {
  renderSection,
  calculateSectionHeight
} from './SectionRenderer';
export type { SectionRenderOptions } from './SectionRenderer';
