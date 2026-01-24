// chartForge - Chart Renderer

import { SECTION_ABBREVIATIONS, SECTION_NAMES, DEFAULT_CONFIG } from './config.js';
import { getNoteIndex } from './music.js';

export class ChartRenderer {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config;
    this.song = null;
    this.layout = null;
    this.pixelRatio = window.devicePixelRatio || 1;
  }

  loadSong(song) {
    this.song = song;
    this.layout = this.calculateLayout();
  }

  calculateLayout() {
    if (!this.song) return null;

    const contentWidth = this.config.page.width - this.config.margins.left - this.config.margins.right;
    // iPad uses single column except for chords-only mode
    const singleColumn = this.config.singleColumn && this.config.displayMode !== 'chords';
    const columnWidth = singleColumn ? contentWidth : (contentWidth - this.config.columnGap) / 2;

    // Page 1: full header + roadmap
    const headerHeight =
      this.config.fonts.title.size * this.config.fonts.title.lineHeight +
      this.config.fonts.artist.size * this.config.fonts.artist.lineHeight +
      this.config.spacing.afterHeader;
    const roadmapHeight = this.calculateRoadmapHeight() + this.config.spacing.afterRoadmap;
    const contentStartY = this.config.margins.top + headerHeight + roadmapHeight;
    const columnHeightPage1 = this.config.page.height - contentStartY - this.config.margins.bottom;

    // Pages 2+: compact header only (no roadmap)
    const compactHeaderHeight = (this.config.fonts.sectionName.size + 4) * 1.4 + this.config.spacing.afterHeader;
    const contentStartYContinuation = this.config.margins.top + compactHeaderHeight;
    const columnHeightContinuation = this.config.page.height - contentStartYContinuation - this.config.margins.bottom;

    const sections = [];
    let page = 0;
    let column = 0;
    let columnY = 0;

    const getColumnHeight = () => page === 0 ? columnHeightPage1 : columnHeightContinuation;

    const advanceColumn = () => {
      if (singleColumn) {
        // Single column mode: always go to next page
        page++;
        columnY = 0;
      } else if (column === 0) {
        column = 1;
        columnY = 0;
      } else {
        page++;
        column = 0;
        columnY = 0;
      }
    };

    for (let i = 0; i < this.song.sections.length; i++) {
      const section = this.song.sections[i];
      const sectionHeight = this.calculateSectionHeight(section);

      // Skip sections with no content for this display mode
      if (sectionHeight === 0) {
        continue;
      }

      // If section doesn't fit and we're not at top, move to next column/page
      if (columnY > 0 && columnY + sectionHeight > getColumnHeight()) {
        advanceColumn();
      }

      sections.push({
        sectionIndex: i,
        column,
        y: columnY,
        height: sectionHeight,
        page
      });

      columnY += sectionHeight + this.config.spacing.betweenSections;

      // If exceeded column height, next section goes to new column
      if (columnY >= getColumnHeight()) {
        advanceColumn();
      }
    }

    return {
      pageCount: page + 1,
      sections,
      columnWidth,
      columnHeightPage1,
      columnHeightContinuation,
      contentStartY,
      contentStartYContinuation,
      column1X: this.config.margins.left,
      column2X: this.config.margins.left + columnWidth + this.config.columnGap
    };
  }

  calculateSectionHeight(section) {
    const displayMode = this.config.displayMode || 'full';

    // Key change sections have fixed height
    if (section.type === 'key_change') {
      return 32; // Fixed height for key change box
    }

    // Compact padding for chords-only mode
    const boxPadding = displayMode === 'chords'
      ? { top: 4, bottom: 6 }
      : { top: 8, bottom: 10 };

    // Always include sections - performers need to see structure
    // (e.g., vocalist needs to know there's an intro even with no lyrics)

    // Header (badge height)
    let height = this.config.badgeRadius * 2;

    // Box padding top
    height += boxPadding.top;

    // Dynamics
    if (section.dynamics) {
      height += this.config.fonts.dynamics.size * this.config.fonts.dynamics.lineHeight + 4;
    }

    // In chords-only mode, consolidate all chords into rows of 4
    if (displayMode === 'chords') {
      // Count total chords
      let totalChords = 0;
      for (const line of section.lines) {
        if (line.chords) {
          totalChords += line.chords.length;
        }
      }

      // Calculate number of rows (4 chords per row)
      const chordsPerRow = 4;
      const rowCount = Math.ceil(totalChords / chordsPerRow);

      // Add height for each row
      for (let i = 0; i < rowCount; i++) {
        if (i > 0) {
          height += 2; // Compact line spacing
        }
        height += this.config.fonts.chordRoot.size * this.config.fonts.chordRoot.lineHeight;
      }
    } else {
      // Full or lyrics mode - calculate line by line
      // Lyrics mode uses half spacing between lines for tighter layout
      const lineSpacing = displayMode === 'lyrics'
        ? this.config.spacing.betweenLines / 2
        : this.config.spacing.betweenLines;
      let lineCount = 0;
      for (let i = 0; i < section.lines.length; i++) {
        const line = section.lines[i];

        // Handle dynamics lines
        if (line.type === 'dynamics') {
          if (lineCount > 0) {
            height += lineSpacing;
          }
          lineCount++;
          height += this.config.fonts.dynamics.size * this.config.fonts.dynamics.lineHeight;
          continue;
        }

        const hasChords = line.chords && line.chords.length > 0;
        const hasLyrics = line.lyrics && line.lyrics.trim().length > 0;

        // Skip lines based on display mode
        if (displayMode === 'lyrics' && !hasLyrics) continue;

        // Add spacing between lines
        if (lineCount > 0) {
          height += lineSpacing;
        }
        lineCount++;

        // Calculate line height based on display mode
        if (displayMode === 'lyrics') {
          // Lyrics only - no chord space overhead
          height += this.config.fonts.lyrics.size * this.config.fonts.lyrics.lineHeight;
        } else {
          // Full mode
          const isChordOnly = hasChords && !hasLyrics;
          if (isChordOnly) {
            height += this.config.fonts.chordRoot.size * this.config.fonts.chordRoot.lineHeight;
          } else if (hasChords && hasLyrics) {
            height += this.config.fonts.chordRoot.size * this.config.fonts.chordRoot.lineHeight;
            height += this.config.spacing.chordToLyric;
            height += this.config.fonts.lyrics.size * this.config.fonts.lyrics.lineHeight;
          } else if (hasLyrics) {
            // Lyrics-only line: include chord space for visual consistency
            height += this.config.fonts.chordRoot.size * this.config.fonts.chordRoot.lineHeight;
            height += this.config.spacing.chordToLyric;
            height += this.config.fonts.lyrics.size * this.config.fonts.lyrics.lineHeight;
          }
        }
      }
    }

    // Box padding bottom
    height += boxPadding.bottom;

    return height;
  }

  renderPage(canvas, pageIndex, containerEl = null) {
    if (!this.song || !this.layout) return;

    const { width, height } = this.config.page;

    // Calculate display size to fit container while maintaining aspect ratio
    let displayWidth = width;
    let displayHeight = height;

    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const availableWidth = containerRect.width - 40; // padding
      const availableHeight = containerRect.height - 40;

      // Scale to fit container
      const scaleByWidth = availableWidth / width;
      const scaleByHeight = availableHeight / height;
      const scale = Math.min(scaleByWidth, scaleByHeight, 1); // Don't exceed original size

      displayWidth = width * scale;
      displayHeight = height * scale;
    }

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.width = width * this.pixelRatio;
    canvas.height = height * this.pixelRatio;

    const ctx = canvas.getContext('2d');
    ctx.scale(this.pixelRatio, this.pixelRatio);

    // Clear background
    ctx.fillStyle = this.config.colors.background;
    ctx.fillRect(0, 0, width, height);

    // Render header
    let y = this.renderHeader(ctx, pageIndex);

    // Render roadmap (first page only)
    if (pageIndex === 0) {
      y = this.renderRoadmap(ctx, y);
      y += this.config.spacing.afterRoadmap;
    }

    // Render sections
    // Use actual y from header/roadmap for this page, not the fixed contentStartY
    const pageContentStartY = y;
    const pageSections = this.layout.sections.filter(s => s.page === pageIndex);

    for (const layoutSection of pageSections) {
      const section = this.song.sections[layoutSection.sectionIndex];
      const x = layoutSection.column === 0 ? this.layout.column1X : this.layout.column2X;
      const sectionY = pageContentStartY + layoutSection.y;

      this.renderSection(ctx, section, x, sectionY, this.layout.columnWidth);
    }

    // Footer on first page only
    if (pageIndex === 0) {
      const config = this.config;
      ctx.font = `300 ${config.fonts.metadata.size - 2}px ${config.fonts.metadata.family}`;
      ctx.fillStyle = config.colors.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('made with proflee.me/chartforge', config.page.width - config.margins.right, config.page.height - 12);
    }
  }

  renderHeader(ctx, pageIndex) {
    const config = this.config;
    let y = config.margins.top;

    if (pageIndex === 0) {
      // Title
      ctx.font = `${config.fonts.title.weight} ${config.fonts.title.size}px ${config.fonts.title.family}`;
      ctx.fillStyle = config.colors.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const displayTitle = this.song.version && this.song.version.trim()
        ? `${this.song.title} (${this.song.version})`
        : this.song.title;
      ctx.fillText(displayTitle, config.margins.left, y);

      // Page number
      ctx.font = `${config.fonts.pageNumber.weight} ${config.fonts.pageNumber.size}px ${config.fonts.pageNumber.family}`;
      ctx.fillStyle = config.colors.textSecondary;
      ctx.textAlign = 'right';
      ctx.fillText(`Page: ${pageIndex + 1}/${this.layout.pageCount}`, config.page.width - config.margins.right, y);

      y += config.fonts.title.size * config.fonts.title.lineHeight;

      // Artist
      ctx.font = `${config.fonts.artist.weight} ${config.fonts.artist.size}px ${config.fonts.artist.family}`;
      ctx.fillStyle = config.colors.textSecondary;
      ctx.textAlign = 'left';
      ctx.fillText(this.song.artist, config.margins.left, y);

      // Metadata - render labels normal, values bold
      const metaFont = `${config.fonts.metadata.weight} ${config.fonts.metadata.size}px ${config.fonts.metadata.family}`;
      const metaFontBold = `bold ${config.fonts.metadata.size}px ${config.fonts.metadata.family}`;
      ctx.textAlign = 'right';

      // Build metadata items as label/value pairs
      const metaItems = [];
      if (this.song.key) {
        const keyLabel = this.config.numbersMode ? 'Original Key' : 'Key';
        metaItems.push({ label: `${keyLabel}: `, value: this.song.key.replace(/b/g, '\u266D').replace(/#/g, '\u266F') });
      }
      if (this.song.tempo) metaItems.push({ label: 'Tempo: ', value: String(this.song.tempo) });
      if (this.song.timeSignature) metaItems.push({ label: 'Meter: ', value: this.song.timeSignature });

      // Draw from right to left
      let metaX = config.page.width - config.margins.right;
      for (let i = metaItems.length - 1; i >= 0; i--) {
        const item = metaItems[i];
        // Draw value (bold)
        ctx.font = metaFontBold;
        ctx.fillText(item.value, metaX, y);
        metaX -= ctx.measureText(item.value).width;
        // Draw label (normal)
        ctx.font = metaFont;
        ctx.fillText(item.label, metaX, y);
        metaX -= ctx.measureText(item.label).width;
        // Add spacing between items
        if (i > 0) metaX -= ctx.measureText('  ').width;
      }

      y += config.fonts.artist.size * config.fonts.artist.lineHeight;
    } else {
      // Compact header
      ctx.font = `bold ${config.fonts.sectionName.size + 4}px ${config.fonts.title.family}`;
      ctx.fillStyle = config.colors.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const compactTitle = this.song.version && this.song.version.trim()
        ? `${this.song.title} (${this.song.version})`
        : this.song.title;
      ctx.fillText(compactTitle, config.margins.left, y);

      ctx.font = `${config.fonts.pageNumber.weight} ${config.fonts.pageNumber.size}px ${config.fonts.pageNumber.family}`;
      ctx.fillStyle = config.colors.textSecondary;
      ctx.textAlign = 'right';
      ctx.fillText(`Page: ${pageIndex + 1}/${this.layout.pageCount}`, config.page.width - config.margins.right, y);

      y += (config.fonts.sectionName.size + 4) * 1.4;
    }

    return y + config.spacing.afterHeader;
  }

  calculateRoadmapHeight() {
    const config = this.config;
    const entries = this.generateRoadmap();
    const radius = config.roadmapBadgeRadius;
    const badgeWidth = radius * 2 + 10;
    const maxX = config.page.width - config.margins.right;

    let x = config.margins.left;
    let lines = 1;

    for (const entry of entries) {
      if (x + radius * 2 > maxX && x > config.margins.left) {
        lines++;
        x = config.margins.left;
      }
      x += badgeWidth;
    }

    return lines * config.spacing.roadmapHeight;
  }

  renderRoadmap(ctx, y) {
    const config = this.config;
    const entries = this.generateRoadmap();
    const radius = config.roadmapBadgeRadius;
    const badgeWidth = radius * 2 + 10;
    const maxX = config.page.width - config.margins.right;

    let x = config.margins.left;

    for (const entry of entries) {
      // Wrap to next line if badge would exceed right margin
      if (x + radius * 2 > maxX && x > config.margins.left) {
        x = config.margins.left;
        y += config.spacing.roadmapHeight;
      }

      const centerY = y + radius;

      // Chorus gets filled circle, others get outline
      const isChorus = entry.sectionType === 'chorus' || entry.sectionType === 'halfchorus';

      ctx.beginPath();
      ctx.arc(x + radius, centerY, radius, 0, Math.PI * 2);
      if (isChorus) {
        ctx.fillStyle = config.colors.roadmapInactive;
        ctx.fill();
      } else {
        ctx.strokeStyle = config.colors.roadmapInactive;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw abbreviation
      ctx.font = `${config.fonts.roadmapBadge.weight} ${config.fonts.roadmapBadge.size}px ${config.fonts.roadmapBadge.family}`;
      ctx.fillStyle = isChorus ? '#ffffff' : config.colors.roadmapInactive;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(entry.abbreviation, x + radius, centerY);

      // Superscript for repeat count or vamp - at top-right of circle
      if (entry.repeatCount > 1 || entry.hasVamp) {
        const superSize = config.fonts.roadmapBadge.size * 0.7;
        ctx.font = `${superSize}px ${config.fonts.roadmapBadge.family}`;

        // Build superscript text
        let superText = '';
        if (entry.repeatCount > 1) superText += entry.repeatCount.toString();
        if (entry.hasVamp) superText += 'v';

        // Position: top-right, overlapping circle edge
        const superCenterX = x + radius + radius * 0.7;
        const superCenterY = y + radius * 0.3;

        // Measure text for background circle
        const textMetrics = ctx.measureText(superText);
        const circleRadius = Math.max(textMetrics.width, superSize) / 2 + 2;

        // Draw white circle background
        ctx.beginPath();
        ctx.arc(superCenterX, superCenterY, circleRadius, 0, Math.PI * 2);
        ctx.fillStyle = config.colors.background;
        ctx.fill();

        // Draw superscript text centered in circle
        ctx.fillStyle = config.colors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(superText, superCenterX, superCenterY);
      }

      x += badgeWidth;
    }

    return y + config.spacing.roadmapHeight;
  }

  generateRoadmap() {
    const entries = [];
    let currentAbbr = '';
    let currentType = '';
    let currentCount = 0;
    let currentExplicitRepeat = null;
    let currentHasVamp = false;

    for (const section of this.song.sections) {
      let abbr;

      // Key change sections get arrow based on direction
      if (section.type === 'key_change') {
        const interval = this.formatKeyChangeInterval(section.previousKey, section.newKey);
        abbr = interval.startsWith('\u2191') ? '\u2191' : '\u2193';
      } else {
        abbr = SECTION_ABBREVIATIONS[section.type] || '';
        if (section.number) abbr += section.number;
        if (section.type === 'custom' && section.label) {
          abbr = section.label.substring(0, 2).toUpperCase();
        }
      }

      // If section has explicit repeat count or vamp, use that
      const explicitRepeat = section.repeatCount || null;
      const hasVamp = section.hasVamp || false;

      // Key change sections never combine with previous entries
      if (section.type === 'key_change') {
        // Flush current entry
        if (currentAbbr) {
          const repeatCount = currentExplicitRepeat || (currentCount > 1 ? currentCount : null);
          entries.push({ abbreviation: currentAbbr, repeatCount, hasVamp: currentHasVamp, sectionType: currentType });
        }
        // Add key change entry (never combines)
        entries.push({ abbreviation: abbr, repeatCount: null, hasVamp: false, isKeyChange: true, sectionType: 'key_change' });
        currentAbbr = '';
        currentType = '';
        currentCount = 0;
        currentExplicitRepeat = null;
        currentHasVamp = false;
      } else if (abbr === currentAbbr && !explicitRepeat && !currentExplicitRepeat && !hasVamp && !currentHasVamp) {
        // Consecutive same section without explicit repeats or vamp
        currentCount++;
      } else {
        if (currentAbbr) {
          const repeatCount = currentExplicitRepeat || (currentCount > 1 ? currentCount : null);
          entries.push({ abbreviation: currentAbbr, repeatCount, hasVamp: currentHasVamp, sectionType: currentType });
        }
        currentAbbr = abbr;
        currentType = section.type;
        currentCount = 1;
        currentExplicitRepeat = explicitRepeat;
        currentHasVamp = hasVamp;
      }
    }

    if (currentAbbr) {
      const repeatCount = currentExplicitRepeat || (currentCount > 1 ? currentCount : null);
      entries.push({ abbreviation: currentAbbr, repeatCount, hasVamp: currentHasVamp, sectionType: currentType });
    }

    return entries;
  }

  renderSection(ctx, section, x, y, width) {
    const config = this.config;

    // Handle key_change sections specially
    if (section.type === 'key_change') {
      return this.renderKeyChangeSection(ctx, section, x, y, width);
    }

    const boxPadding = { top: 8, right: 8, bottom: 10, left: 8 };
    const cornerRadius = 8;

    // Render badge
    const abbr = this.getSectionAbbreviation(section);
    const badgeRadius = config.badgeRadius;
    const badgeOffset = cornerRadius + 8; // Left margin: after top-left corner + padding

    // Chorus gets dark fill with white text, others get white fill with black text
    const isChorus = section.type === 'chorus' || section.type === 'halfchorus';

    ctx.beginPath();
    ctx.arc(x + badgeOffset + badgeRadius, y + badgeRadius, badgeRadius, 0, Math.PI * 2);
    if (isChorus) {
      ctx.fillStyle = config.colors.badgeFill;
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = config.colors.badgeFill;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.font = `${config.fonts.roadmapBadge.weight} ${config.fonts.roadmapBadge.size}px ${config.fonts.roadmapBadge.family}`;
    ctx.fillStyle = isChorus ? config.colors.badgeText : config.colors.badgeFill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(abbr, x + badgeOffset + badgeRadius, y + badgeRadius);

    // Render section name
    const displayName = this.getSectionDisplayName(section);
    const nameX = x + badgeOffset + badgeRadius * 2 + 8;
    const nameY = y + badgeRadius;

    ctx.font = `${config.fonts.sectionName.weight} ${config.fonts.sectionName.size}px ${config.fonts.sectionName.family}`;
    ctx.fillStyle = config.colors.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, nameX, nameY);

    const nameWidth = ctx.measureText(displayName).width;
    const ruleStartX = nameX + nameWidth + 10;

    // Content area starts below header
    let currentY = y + badgeRadius * 2 + boxPadding.top;

    // Dynamics (right-aligned, below header)
    if (section.dynamics) {
      ctx.font = `${config.fonts.dynamics.weight} ${config.fonts.dynamics.size}px ${config.fonts.dynamics.family}`;
      ctx.fillStyle = config.colors.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(section.dynamics, x + width - boxPadding.right, currentY);
      currentY += config.fonts.dynamics.size * config.fonts.dynamics.lineHeight + 4;
    }

    // Render lines with left padding
    const contentX = x + boxPadding.left;
    const contentWidth = width - boxPadding.left - boxPadding.right;
    const displayMode = config.displayMode || 'full';

    // In chords-only mode, consolidate chords into rows of 4
    if (displayMode === 'chords') {
      // Collect all chords from all lines
      const allChords = [];
      for (const line of section.lines) {
        if (line.chords && line.chords.length > 0) {
          for (const cp of line.chords) {
            allChords.push(cp.chord);
          }
        }
      }

      // Group into rows of 4 chords
      const chordsPerRow = 4;
      let renderedRowCount = 0;
      for (let i = 0; i < allChords.length; i += chordsPerRow) {
        const rowChords = allChords.slice(i, i + chordsPerRow);

        if (renderedRowCount > 0) {
          currentY += 2; // Compact line spacing
        }

        const chordY = currentY + config.fonts.chordRoot.size;
        this.renderChordRow(ctx, rowChords, contentX, chordY, contentWidth);
        currentY += config.fonts.chordRoot.size * config.fonts.chordRoot.lineHeight;
        renderedRowCount++;
      }
    } else {
      // Full or lyrics mode - render line by line
      // Lyrics mode uses half spacing between lines for tighter layout
      const lineSpacing = displayMode === 'lyrics'
        ? config.spacing.betweenLines / 2
        : config.spacing.betweenLines;
      let renderedLineCount = 0;
      for (let i = 0; i < section.lines.length; i++) {
        const line = section.lines[i];
        const hasChords = line.chords && line.chords.length > 0;
        const hasLyrics = line.lyrics && line.lyrics.trim().length > 0;

        // Skip lines based on display mode
        if (displayMode === 'lyrics' && !hasLyrics) continue;

        // Add spacing between lines (before the line, not after)
        if (renderedLineCount > 0) {
          currentY += lineSpacing;
        }

        currentY += this.renderLine(ctx, line, contentX, currentY, contentWidth);
        renderedLineCount++;
      }
    }

    // Add bottom padding
    currentY += boxPadding.bottom;

    // Draw section box with rounded corners
    const boxTop = nameY;
    const boxBottom = currentY;
    const topLeftEnd = x + cornerRadius + 4; // Where top-left corner ends

    ctx.strokeStyle = config.colors.rule;
    ctx.lineWidth = 1;

    // Main box path: top-left corner -> left -> bottom-left -> bottom -> bottom-right -> right -> top-right corner
    ctx.beginPath();

    // Top-left rounded corner
    ctx.moveTo(topLeftEnd, boxTop);
    ctx.quadraticCurveTo(x, boxTop, x, boxTop + cornerRadius);

    // Left side down to bottom
    ctx.lineTo(x, boxBottom - cornerRadius);

    // Bottom-left rounded corner
    ctx.quadraticCurveTo(x, boxBottom, x + cornerRadius, boxBottom);

    // Bottom line
    ctx.lineTo(x + width - cornerRadius, boxBottom);

    // Bottom-right rounded corner
    ctx.quadraticCurveTo(x + width, boxBottom, x + width, boxBottom - cornerRadius);

    // Right side up to top
    ctx.lineTo(x + width, boxTop + cornerRadius);

    // Top-right rounded corner
    ctx.quadraticCurveTo(x + width, boxTop, x + width - cornerRadius, boxTop);

    // Top rule from top-right corner to after section name
    ctx.lineTo(ruleStartX, boxTop);

    ctx.stroke();

    return currentY - y;
  }

  renderLine(ctx, line, x, y, width) {
    const config = this.config;
    const displayMode = config.displayMode || 'full';
    let currentY = y;

    // Handle dynamics lines (mid-section dynamics)
    if (line.type === 'dynamics') {
      ctx.font = `${config.fonts.dynamics.weight} ${config.fonts.dynamics.size}px ${config.fonts.dynamics.family}`;
      ctx.fillStyle = config.colors.textMuted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(line.text, x + width, currentY);
      currentY += config.fonts.dynamics.size * config.fonts.dynamics.lineHeight;
      return currentY - y;
    }

    const hasChords = line.chords && line.chords.length > 0;
    const hasLyrics = line.lyrics && line.lyrics.trim().length > 0;

    // Skip lines based on display mode
    if (displayMode === 'chords' && !hasChords) return 0;
    if (displayMode === 'lyrics' && !hasLyrics) return 0;

    // Chords-only mode: render only chords
    if (displayMode === 'chords') {
      const chordY = currentY + config.fonts.chordRoot.size;
      this.renderChordRow(ctx, line.chords.map(c => c.chord), x, chordY, width);
      currentY += config.fonts.chordRoot.size * config.fonts.chordRoot.lineHeight;
      return currentY - y;
    }

    // Lyrics-only mode: render lyrics without chord space overhead
    if (displayMode === 'lyrics') {
      ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;
      ctx.fillStyle = config.colors.textSecondary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(line.lyrics, x, currentY);
      currentY += config.fonts.lyrics.size * config.fonts.lyrics.lineHeight;
      return currentY - y;
    }

    // Full mode: render both
    const isChordOnly = hasChords && !hasLyrics;

    if (isChordOnly) {
      // Chord-only line
      const chordY = currentY + config.fonts.chordRoot.size;
      this.renderChordRow(ctx, line.chords.map(c => c.chord), x, chordY, width);
      currentY += config.fonts.chordRoot.size * config.fonts.chordRoot.lineHeight;

    } else if (hasChords && hasLyrics) {
      // Chords above lyrics - renders both with stretched spacing
      const chordY = currentY + config.fonts.chordRoot.size;
      currentY += config.fonts.chordRoot.size * config.fonts.chordRoot.lineHeight;
      currentY += config.spacing.chordToLyric;
      const lyricY = currentY;

      this.renderChordsAboveLyrics(ctx, line.chords, line.lyrics, x, chordY, lyricY);
      currentY += config.fonts.lyrics.size * config.fonts.lyrics.lineHeight;

    } else if (hasLyrics) {
      // Lyrics-only line: include chord space for visual consistency
      currentY += config.fonts.chordRoot.size * config.fonts.chordRoot.lineHeight;
      currentY += config.spacing.chordToLyric;
      ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;
      ctx.fillStyle = config.colors.textSecondary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(line.lyrics, x, currentY);
      currentY += config.fonts.lyrics.size * config.fonts.lyrics.lineHeight;
    }

    return currentY - y;
  }

  // Convert accidentals to Unicode symbols for display
  formatAccidentals(str) {
    return str.replace(/b/g, '\u266D').replace(/#/g, '\u266F');
  }

  renderChord(ctx, chord, x, y) {
    const config = this.config;
    let currentX = x;

    // Check if this is a band note (e.g., "(Out)", "(last time hold)")
    const isBandNote = chord.root.startsWith('(') && chord.root.endsWith(')');

    if (isBandNote) {
      // Render band notes in lighter italic style
      ctx.font = `italic ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
      ctx.fillStyle = config.colors.textMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(chord.root, currentX, y);
      currentX += ctx.measureText(chord.root).width;
      return currentX - x;
    }

    const displayRoot = this.formatAccidentals(chord.root);
    ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
    ctx.fillStyle = config.colors.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(displayRoot, currentX, y);
    currentX += ctx.measureText(displayRoot).width;

    if (chord.quality) {
      const displayQuality = this.formatAccidentals(chord.quality);
      ctx.font = `${config.fonts.chordQuality.weight} ${config.fonts.chordQuality.size}px ${config.fonts.chordQuality.family}`;
      const qualityY = y - (config.fonts.chordRoot.size * 0.25);
      ctx.fillText(displayQuality, currentX, qualityY);
      currentX += ctx.measureText(displayQuality).width;
    }

    if (chord.bass) {
      const displayBass = '/' + this.formatAccidentals(chord.bass);
      ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
      ctx.fillText(displayBass, currentX, y);
      currentX += ctx.measureText(displayBass).width;
    }

    return currentX - x;
  }

  measureChordWidth(ctx, chord) {
    const config = this.config;
    let width = 0;

    // Check if this is a band note
    const isBandNote = chord.root.startsWith('(') && chord.root.endsWith(')');

    if (isBandNote) {
      ctx.font = `italic ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
      return ctx.measureText(chord.root).width;
    }

    const displayRoot = this.formatAccidentals(chord.root);
    ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
    width += ctx.measureText(displayRoot).width;

    if (chord.quality) {
      const displayQuality = this.formatAccidentals(chord.quality);
      ctx.font = `${config.fonts.chordQuality.weight} ${config.fonts.chordQuality.size}px ${config.fonts.chordQuality.family}`;
      width += ctx.measureText(displayQuality).width;
    }

    if (chord.bass) {
      const displayBass = '/' + this.formatAccidentals(chord.bass);
      ctx.font = `${config.fonts.chordRoot.weight} ${config.fonts.chordRoot.size}px ${config.fonts.chordRoot.family}`;
      width += ctx.measureText(displayBass).width;
    }

    return width;
  }

  /**
   * Calculate the interval between two keys with full interval names.
   * Returns formatted string like "up Whole Step" or "down Minor 3rd".
   */
  getKeyChangeIntervalFull(fromKey, toKey) {
    // Get root notes (strip 'm' suffix for minor keys)
    const fromRoot = fromKey.replace(/m$/, '');
    const toRoot = toKey.replace(/m$/, '');

    const fromIndex = getNoteIndex(fromRoot);
    const toIndex = getNoteIndex(toRoot);

    if (fromIndex === -1 || toIndex === -1) return '?';

    // Calculate semitone distance going up
    const semitonesUp = ((toIndex - fromIndex) + 12) % 12;

    if (semitonesUp === 0) return 'Same Key';

    // Determine direction: <=6 semitones = up, >6 = down
    let semitones, direction;
    if (semitonesUp <= 6) {
      semitones = semitonesUp;
      direction = 'up';
    } else {
      semitones = 12 - semitonesUp;
      direction = 'down';
    }

    // Map semitones to full interval names
    const intervalNames = {
      1: 'Half Step',
      2: 'Whole Step',
      3: 'Minor 3rd',
      4: 'Major 3rd',
      5: 'Perfect 4th',
      6: 'Tritone',
    };

    const arrow = direction === 'up' ? '\u2191' : '\u2193';
    const intervalName = intervalNames[semitones] || semitones + ' semitones';
    return arrow + ' ' + intervalName;
  }

  /**
   * Calculate the interval between two keys for key change display.
   * Returns formatted string like "upW" (up whole step) or "downm3" (down minor 3rd).
   */
  formatKeyChangeInterval(fromKey, toKey) {
    // Get root notes (strip 'm' suffix for minor keys)
    const fromRoot = fromKey.replace(/m$/, '');
    const toRoot = toKey.replace(/m$/, '');

    const fromIndex = getNoteIndex(fromRoot);
    const toIndex = getNoteIndex(toRoot);

    if (fromIndex === -1 || toIndex === -1) return '?';

    // Calculate semitone distance going up
    const semitonesUp = ((toIndex - fromIndex) + 12) % 12;

    if (semitonesUp === 0) return '=';

    // Determine direction: <=6 semitones = up, >6 = down
    let semitones, direction;
    if (semitonesUp <= 6) {
      semitones = semitonesUp;
      direction = 'up';
    } else {
      semitones = 12 - semitonesUp;
      direction = 'down';
    }

    // Map semitones to interval names
    const intervalNames = {
      1: '\u00BD',   // half step
      2: 'W',   // whole step
      3: 'm3',  // minor 3rd
      4: 'M3',  // major 3rd
      5: 'P4',  // perfect 4th
      6: 'b5',  // tritone
    };

    const arrow = direction === 'up' ? '\u2191' : '\u2193';
    const intervalName = intervalNames[semitones] || String(semitones);
    return arrow + intervalName;
  }

  /**
   * Render a key change as a standalone section with full-width shaded box.
   */
  renderKeyChangeSection(ctx, section, x, y, width) {
    const config = this.config;
    const boxHeight = 28;
    const cornerRadius = 6;

    // Determine display text based on mode
    let displayText;
    if (config.numbersMode) {
      // Numbers mode: show interval with full names
      const intervalInfo = this.getKeyChangeIntervalFull(section.previousKey, section.newKey);
      displayText = 'Key Change: ' + intervalInfo;
    } else {
      // Letter mode: show "Key Change: C -> D"
      const fromKey = this.formatAccidentals(section.previousKey);
      const toKey = this.formatAccidentals(section.newKey);
      displayText = 'Key Change: ' + fromKey + ' \u2192 ' + toKey;
    }

    // Draw full-width rounded rectangle with fill
    const boxX = x;
    const boxY = y;

    ctx.beginPath();
    ctx.moveTo(boxX + cornerRadius, boxY);
    ctx.lineTo(boxX + width - cornerRadius, boxY);
    ctx.quadraticCurveTo(boxX + width, boxY, boxX + width, boxY + cornerRadius);
    ctx.lineTo(boxX + width, boxY + boxHeight - cornerRadius);
    ctx.quadraticCurveTo(boxX + width, boxY + boxHeight, boxX + width - cornerRadius, boxY + boxHeight);
    ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius);
    ctx.lineTo(boxX, boxY + cornerRadius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
    ctx.closePath();

    // Light fill with border
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
    ctx.strokeStyle = config.colors.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text centered in box
    ctx.font = `bold ${config.fonts.sectionName.size}px ${config.fonts.sectionName.family}`;
    ctx.fillStyle = config.colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, boxX + width / 2, boxY + boxHeight / 2);

    return boxHeight;
  }

  /**
   * Render a key change box (inline within section - legacy, kept for compatibility).
   * - In letter mode: "New Key: G"
   * - In numbers mode: interval like "upW" or "downm3"
   */
  renderKeyChange(ctx, line, x, y, width) {
    const config = this.config;
    const boxHeight = 24;
    const boxPadding = 8;
    const cornerRadius = 4;

    // Determine display text based on mode
    let displayText;
    if (config.numbersMode) {
      // Numbers mode: show interval
      displayText = this.formatKeyChangeInterval(line.previousKey, line.newKey);
    } else {
      // Letter mode: show "New Key: X" with unicode accidentals
      const displayKey = this.formatAccidentals(line.newKey);
      displayText = 'New Key: ' + displayKey;
    }

    // Measure text width
    ctx.font = `bold ${config.fonts.sectionName.size}px ${config.fonts.sectionName.family}`;
    const textWidth = ctx.measureText(displayText).width;
    const boxWidth = textWidth + boxPadding * 2;

    // Draw rounded rectangle border
    const boxX = x;
    const boxY = y;

    ctx.beginPath();
    ctx.moveTo(boxX + cornerRadius, boxY);
    ctx.lineTo(boxX + boxWidth - cornerRadius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + cornerRadius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - cornerRadius);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - cornerRadius, boxY + boxHeight);
    ctx.lineTo(boxX + cornerRadius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - cornerRadius);
    ctx.lineTo(boxX, boxY + cornerRadius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + cornerRadius, boxY);
    ctx.closePath();

    ctx.strokeStyle = config.colors.rule;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text centered in box
    ctx.fillStyle = config.colors.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, boxX + boxWidth / 2, boxY + boxHeight / 2);

    return boxHeight;
  }

  renderChordRow(ctx, chords, x, y, width) {
    if (chords.length === 0) return;
    if (chords.length === 1) {
      this.renderChord(ctx, chords[0], x, y);
      return;
    }

    const chordWidths = chords.map(c => this.measureChordWidth(ctx, c));
    const totalWidth = chordWidths.reduce((a, b) => a + b, 0);

    // In chords-only mode, use compact fixed spacing
    // In full mode, distribute evenly across width
    const displayMode = this.config.displayMode || 'full';
    const compactSpacing = 24; // Fixed spacing between chords in chords-only mode
    const spacing = displayMode === 'chords'
      ? compactSpacing
      : (width - totalWidth) / chords.length;

    let currentX = x;
    for (let i = 0; i < chords.length; i++) {
      this.renderChord(ctx, chords[i], currentX, y);
      currentX += chordWidths[i] + spacing;
    }
  }

  renderChordsAboveLyrics(ctx, chordPositions, lyrics, x, chordY, lyricY) {
    const config = this.config;

    // Sort by position
    const sorted = [...chordPositions].sort((a, b) => a.position - b.position);

    ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;

    const minGap = 8;
    const positions = [];
    const segments = [];
    let currentX = x;

    // Calculate positions with overlap prevention
    for (let i = 0; i < sorted.length; i++) {
      const cp = sorted[i];
      const prevPos = i === 0 ? 0 : sorted[i - 1].position;
      const segmentText = lyrics.substring(prevPos, cp.position);

      if (segmentText) {
        ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;
        segments.push({ text: segmentText, xPos: currentX });
        currentX += ctx.measureText(segmentText).width;
      }

      const chordWidth = this.measureChordWidth(ctx, cp.chord);

      // Check overlap with previous chord
      if (positions.length > 0) {
        const prev = positions[positions.length - 1];
        const minX = prev.xPos + prev.width + minGap;
        if (currentX < minX) {
          currentX = minX;
        }
      }

      positions.push({ chord: cp.chord, xPos: currentX, width: chordWidth });
    }

    // Add remaining lyrics
    if (sorted.length > 0) {
      const lastPos = sorted[sorted.length - 1].position;
      const remaining = lyrics.substring(lastPos);
      if (remaining) {
        segments.push({ text: remaining, xPos: currentX });
      }
    }

    // Render chords
    for (const p of positions) {
      this.renderChord(ctx, p.chord, p.xPos, chordY);
    }

    // Render stretched lyrics
    ctx.font = `${config.fonts.lyrics.weight} ${config.fonts.lyrics.size}px ${config.fonts.lyrics.family}`;
    ctx.fillStyle = config.colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    for (const seg of segments) {
      ctx.fillText(seg.text, seg.xPos, lyricY);
    }
  }

  getSectionAbbreviation(section) {
    // Key change sections use arrow based on direction
    if (section.type === 'key_change') {
      const interval = this.formatKeyChangeInterval(section.previousKey, section.newKey);
      return interval.startsWith('\u2191') ? '\u2191' : '\u2193';
    }

    let abbr = SECTION_ABBREVIATIONS[section.type] || '';
    if (section.number) abbr += section.number;
    if (section.type === 'custom' && section.label) {
      abbr = section.label.substring(0, 2).toUpperCase();
    }
    return abbr;
  }

  getSectionDisplayName(section) {
    // Key change sections show the key or interval
    if (section.type === 'key_change') {
      if (this.config.numbersMode) {
        return this.formatKeyChangeInterval(section.previousKey, section.newKey);
      } else {
        return this.formatAccidentals(section.newKey);
      }
    }

    let name;
    if (section.label) {
      name = section.label.toUpperCase();
    } else {
      name = SECTION_NAMES[section.type] || section.type.toUpperCase();
      if (section.number) name += ' ' + section.number;
    }
    // Add repeat/vamp indicators
    if (section.repeatCount > 1) name += ` [${section.repeatCount}x]`;
    if (section.hasVamp) name += ' [Vamp]';
    return name;
  }
}
