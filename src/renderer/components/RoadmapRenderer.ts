/**
 * Roadmap Renderer Component
 *
 * Renders the horizontal roadmap bar showing section sequence.
 */

import { RenderConfig, RoadmapEntry, DEFAULT_CONFIG } from '../types';

export interface RoadmapRenderOptions {
  /** Starting Y position */
  y: number;
  /** Currently active section index (for highlighting) */
  activeIndex?: number;
}

/**
 * Render a single roadmap badge (circle with abbreviation).
 */
function renderBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  entry: RoadmapEntry,
  isActive: boolean,
  config: RenderConfig
): number {
  const radius = config.roadmapBadgeRadius;
  const centerY = y + radius;

  // Draw circle
  ctx.beginPath();
  ctx.arc(x + radius, centerY, radius, 0, Math.PI * 2);

  if (isActive) {
    ctx.fillStyle = config.colors.badgeFill;
    ctx.fill();
  } else {
    ctx.strokeStyle = config.colors.roadmapInactive;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw abbreviation text
  ctx.font = `${config.fonts.roadmapBadge.weight} ${config.fonts.roadmapBadge.size}px ${config.fonts.roadmapBadge.family}`;
  ctx.fillStyle = isActive ? config.colors.badgeText : config.colors.roadmapInactive;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(entry.abbreviation, x + radius, centerY);

  // Calculate badge width including repeat count
  let totalWidth = radius * 2;

  // Draw superscript repeat count if > 1
  if (entry.repeatCount && entry.repeatCount > 1) {
    const superscriptSize = config.fonts.roadmapBadge.size * 0.75;
    ctx.font = `${config.fonts.roadmapBadge.weight} ${superscriptSize}px ${config.fonts.roadmapBadge.family}`;
    ctx.fillStyle = config.colors.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const repeatText = entry.repeatCount.toString();
    const repeatX = x + radius * 2 - 2;
    const repeatY = y - 2;

    ctx.fillText(repeatText, repeatX, repeatY);

    // Add width of superscript
    totalWidth += ctx.measureText(repeatText).width;
  }

  return totalWidth;
}

/**
 * Render the complete roadmap bar.
 */
export function renderRoadmap(
  ctx: CanvasRenderingContext2D,
  entries: RoadmapEntry[],
  options: RoadmapRenderOptions,
  config: RenderConfig = DEFAULT_CONFIG
): number {
  if (entries.length === 0) {
    return options.y;
  }

  const badgeSpacing = 8;
  let x = config.margins.left;
  const y = options.y;

  // First pass: calculate total width to potentially center
  // For now, left-align like the reference

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isActive = options.activeIndex !== undefined && options.activeIndex === i;

    const badgeWidth = renderBadge(ctx, x, y, entry, isActive, config);
    x += badgeWidth + badgeSpacing;
  }

  return y + config.spacing.roadmapHeight;
}

/**
 * Calculate the width needed for the roadmap.
 */
export function calculateRoadmapWidth(
  entries: RoadmapEntry[],
  config: RenderConfig = DEFAULT_CONFIG
): number {
  if (entries.length === 0) return 0;

  const badgeSpacing = 8;
  let totalWidth = 0;

  for (const entry of entries) {
    // Badge circle
    totalWidth += config.roadmapBadgeRadius * 2;

    // Superscript
    if (entry.repeatCount && entry.repeatCount > 1) {
      // Rough estimate for superscript width
      totalWidth += entry.repeatCount.toString().length * 6;
    }

    totalWidth += badgeSpacing;
  }

  return totalWidth - badgeSpacing; // Remove last spacing
}
