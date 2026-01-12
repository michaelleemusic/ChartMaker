/**
 * Chord Renderer Component
 *
 * Renders chords with proper formatting:
 * - Root note in bold
 * - Quality (sus4, m7, etc.) as smaller superscript-style text
 * - Slash chords with bass note
 */

import { Chord } from '../../types';
import { RenderConfig, DEFAULT_CONFIG } from '../types';

/**
 * Render a single chord at the specified position.
 * Returns the total width of the rendered chord.
 */
export function renderChord(
  ctx: CanvasRenderingContext2D,
  chord: Chord,
  x: number,
  y: number,
  config: RenderConfig = DEFAULT_CONFIG
): number {
  let currentX = x;

  // Render root note (bold, larger)
  ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
  ctx.fillStyle = config.colors.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillText(chord.root, currentX, y);
  currentX += ctx.measureText(chord.root).width;

  // Render quality (smaller, positioned slightly higher like superscript)
  if (chord.quality) {
    ctx.font = `${config.fonts.chordQuality.weight} ${config.fonts.chordQuality.size}px ${config.fonts.chordQuality.family}`;

    // Offset Y to create superscript effect
    const qualityY = y - (config.fonts.chordRoot.size * 0.25);

    ctx.fillText(chord.quality, currentX, qualityY);
    currentX += ctx.measureText(chord.quality).width;
  }

  // Render slash and bass note
  if (chord.bass) {
    // Slash in root font
    ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
    ctx.fillText('/', currentX, y);
    currentX += ctx.measureText('/').width;

    // Bass note
    ctx.fillText(chord.bass, currentX, y);
    currentX += ctx.measureText(chord.bass).width;
  }

  return currentX - x;
}

/**
 * Calculate the width of a chord without rendering.
 */
export function measureChordWidth(
  ctx: CanvasRenderingContext2D,
  chord: Chord,
  config: RenderConfig = DEFAULT_CONFIG
): number {
  let width = 0;

  // Root width
  ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
  width += ctx.measureText(chord.root).width;

  // Quality width
  if (chord.quality) {
    ctx.font = `${config.fonts.chordQuality.weight} ${config.fonts.chordQuality.size}px ${config.fonts.chordQuality.family}`;
    width += ctx.measureText(chord.quality).width;
  }

  // Bass width
  if (chord.bass) {
    ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
    width += ctx.measureText('/' + chord.bass).width;
  }

  return width;
}

/**
 * Render a row of chords (for chord-only lines).
 * Distributes chords evenly across the available width.
 */
export function renderChordRow(
  ctx: CanvasRenderingContext2D,
  chords: Chord[],
  x: number,
  y: number,
  availableWidth: number,
  config: RenderConfig = DEFAULT_CONFIG
): void {
  if (chords.length === 0) return;

  if (chords.length === 1) {
    // Single chord, render at start
    renderChord(ctx, chords[0], x, y, config);
    return;
  }

  // Calculate total chord widths
  const chordWidths = chords.map(c => measureChordWidth(ctx, c, config));
  const totalChordWidth = chordWidths.reduce((a, b) => a + b, 0);

  // Calculate spacing between chords
  const remainingSpace = availableWidth - totalChordWidth;
  const spacing = remainingSpace / (chords.length);

  // Render each chord
  let currentX = x;
  for (let i = 0; i < chords.length; i++) {
    renderChord(ctx, chords[i], currentX, y, config);
    currentX += chordWidths[i] + spacing;
  }
}

/**
 * Render chords above a lyric line at their respective positions.
 */
export function renderChordsAboveLyrics(
  ctx: CanvasRenderingContext2D,
  chords: { chord: Chord; position: number }[],
  lyrics: string,
  x: number,
  chordY: number,
  config: RenderConfig = DEFAULT_CONFIG
): void {
  if (chords.length === 0) return;

  // We need to calculate where each character position maps to in pixels
  ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;

  for (const cp of chords) {
    // Get the substring up to the chord position
    const prefix = lyrics.substring(0, cp.position);
    const prefixWidth = ctx.measureText(prefix).width;

    // Render the chord at this position
    renderChord(ctx, cp.chord, x + prefixWidth, chordY, config);
  }
}

/**
 * Calculate positions for chords that don't have explicit lyric positions.
 * Used for instrumental sections where chords are evenly distributed.
 */
export function calculateEvenChordPositions(
  chordCount: number,
  availableWidth: number
): number[] {
  if (chordCount <= 0) return [];
  if (chordCount === 1) return [0];

  const positions: number[] = [];
  const segmentWidth = availableWidth / chordCount;

  for (let i = 0; i < chordCount; i++) {
    positions.push(i * segmentWidth);
  }

  return positions;
}
