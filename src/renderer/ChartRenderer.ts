/**
 * Chart Renderer
 *
 * Main class for rendering chord charts to HTML5 Canvas.
 */

import { Song } from '../types';
import {
  RenderConfig,
  LayoutResult,
  DEFAULT_CONFIG
} from './types';
import {
  calculateLayout,
  generateRoadmap,
  getSectionsForPage
} from './layout';
import {
  renderHeader,
  renderRoadmap,
  renderSection
} from './components';

export interface ChartRendererOptions {
  /** Custom render configuration */
  config?: Partial<RenderConfig>;
  /** Device pixel ratio for high-DPI displays */
  pixelRatio?: number;
}

/**
 * ChartRenderer class for rendering songs to canvas.
 */
export class ChartRenderer {
  private config: RenderConfig;
  private pixelRatio: number;
  private song: Song | null = null;
  private layout: LayoutResult | null = null;

  constructor(options: ChartRendererOptions = {}) {
    // Merge custom config with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...options.config,
      fonts: {
        ...DEFAULT_CONFIG.fonts,
        ...options.config?.fonts
      },
      colors: {
        ...DEFAULT_CONFIG.colors,
        ...options.config?.colors
      },
      spacing: {
        ...DEFAULT_CONFIG.spacing,
        ...options.config?.spacing
      },
      margins: {
        ...DEFAULT_CONFIG.margins,
        ...options.config?.margins
      },
      page: {
        ...DEFAULT_CONFIG.page,
        ...options.config?.page
      }
    };

    this.pixelRatio = options.pixelRatio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  }

  /**
   * Get the current render configuration.
   */
  getConfig(): RenderConfig {
    return this.config;
  }

  /**
   * Update the render configuration.
   */
  setConfig(config: Partial<RenderConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      fonts: {
        ...this.config.fonts,
        ...config.fonts
      },
      colors: {
        ...this.config.colors,
        ...config.colors
      },
      spacing: {
        ...this.config.spacing,
        ...config.spacing
      },
      margins: {
        ...this.config.margins,
        ...config.margins
      },
      page: {
        ...this.config.page,
        ...config.page
      }
    };

    // Recalculate layout if song is loaded
    if (this.song) {
      this.layout = calculateLayout(this.song, this.config);
    }
  }

  /**
   * Load a song for rendering.
   */
  loadSong(song: Song): void {
    this.song = song;
    this.layout = calculateLayout(song, this.config);
  }

  /**
   * Get the current song.
   */
  getSong(): Song | null {
    return this.song;
  }

  /**
   * Get the calculated layout.
   */
  getLayout(): LayoutResult | null {
    return this.layout;
  }

  /**
   * Get the number of pages.
   */
  getPageCount(): number {
    return this.layout?.pageCount || 0;
  }

  /**
   * Create a canvas element sized for the chart.
   */
  createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    this.sizeCanvas(canvas);
    return canvas;
  }

  /**
   * Size an existing canvas for the chart.
   */
  sizeCanvas(canvas: HTMLCanvasElement): void {
    const { width, height } = this.config.page;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set actual size in memory (scaled for retina)
    canvas.width = width * this.pixelRatio;
    canvas.height = height * this.pixelRatio;
  }

  /**
   * Get a canvas context configured for rendering.
   */
  private getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    // Scale for retina displays
    ctx.scale(this.pixelRatio, this.pixelRatio);

    // Enable font smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    return ctx;
  }

  /**
   * Clear the canvas with the background color.
   */
  private clearCanvas(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.config.colors.background;
    ctx.fillRect(0, 0, this.config.page.width, this.config.page.height);
  }

  /**
   * Render a single page to a canvas.
   */
  renderPage(canvas: HTMLCanvasElement, pageIndex: number): void {
    if (!this.song || !this.layout) {
      throw new Error('No song loaded. Call loadSong() first.');
    }

    if (pageIndex < 0 || pageIndex >= this.layout.pageCount) {
      throw new Error(`Invalid page index: ${pageIndex}. Valid range: 0-${this.layout.pageCount - 1}`);
    }

    // Size and get context
    this.sizeCanvas(canvas);
    const ctx = this.getContext(canvas);

    // Clear background
    this.clearCanvas(ctx);

    // Render header
    const isFirstPage = pageIndex === 0;
    let y = renderHeader(ctx, this.song, {
      pageNumber: pageIndex + 1,
      totalPages: this.layout.pageCount,
      isFirstPage
    }, this.config);

    // Render roadmap (first page only)
    if (isFirstPage) {
      const roadmapEntries = generateRoadmap(this.song);
      y = renderRoadmap(ctx, roadmapEntries, { y }, this.config);
      y += this.config.spacing.afterRoadmap;
    }

    // Get sections for this page
    const pageSections = getSectionsForPage(this.layout, pageIndex);

    // Render sections
    for (const layoutSection of pageSections) {
      const section = this.song.sections[layoutSection.sectionIndex];

      // Calculate X position based on column
      const x = layoutSection.column === 0
        ? this.layout.column1X
        : this.layout.column2X;

      // Calculate Y position
      const sectionY = this.layout.contentStartY + layoutSection.y;

      renderSection(ctx, section, {
        x,
        y: sectionY,
        width: this.layout.columnWidth
      }, this.config);
    }
  }

  /**
   * Render all pages and return an array of canvas elements.
   */
  renderAllPages(): HTMLCanvasElement[] {
    if (!this.song || !this.layout) {
      throw new Error('No song loaded. Call loadSong() first.');
    }

    const pages: HTMLCanvasElement[] = [];

    for (let i = 0; i < this.layout.pageCount; i++) {
      const canvas = this.createCanvas();
      this.renderPage(canvas, i);
      pages.push(canvas);
    }

    return pages;
  }

  /**
   * Render all pages to data URLs.
   */
  renderToDataURLs(mimeType: string = 'image/png', quality?: number): string[] {
    const pages = this.renderAllPages();
    return pages.map(canvas => canvas.toDataURL(mimeType, quality));
  }

  /**
   * Render all pages to blobs.
   */
  async renderToBlobs(mimeType: string = 'image/png', quality?: number): Promise<Blob[]> {
    const pages = this.renderAllPages();

    const blobs: Blob[] = [];
    for (const canvas of pages) {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result: Blob | null) => {
            if (result) resolve(result);
            else reject(new Error('Failed to create blob'));
          },
          mimeType,
          quality
        );
      });
      blobs.push(blob);
    }

    return blobs;
  }

  /**
   * Calculate preview dimensions for a given container size.
   * Maintains aspect ratio.
   */
  calculatePreviewSize(containerWidth: number, containerHeight: number): { width: number; height: number; scale: number } {
    const pageRatio = this.config.page.width / this.config.page.height;
    const containerRatio = containerWidth / containerHeight;

    let width: number;
    let height: number;

    if (containerRatio > pageRatio) {
      // Container is wider than page ratio, fit to height
      height = containerHeight;
      width = height * pageRatio;
    } else {
      // Container is taller than page ratio, fit to width
      width = containerWidth;
      height = width / pageRatio;
    }

    const scale = width / this.config.page.width;

    return { width, height, scale };
  }

  /**
   * Render a preview page scaled to fit a container.
   */
  renderPreview(
    canvas: HTMLCanvasElement,
    pageIndex: number,
    containerWidth: number,
    containerHeight: number
  ): void {
    if (!this.song || !this.layout) {
      throw new Error('No song loaded. Call loadSong() first.');
    }

    // Calculate preview size
    const { width, height, scale } = this.calculatePreviewSize(containerWidth, containerHeight);

    // Create temporary full-size canvas
    const fullCanvas = this.createCanvas();
    this.renderPage(fullCanvas, pageIndex);

    // Size preview canvas
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * this.pixelRatio;
    canvas.height = height * this.pixelRatio;

    // Draw scaled preview
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D canvas context');
    }

    ctx.scale(this.pixelRatio, this.pixelRatio);
    ctx.drawImage(fullCanvas, 0, 0, width, height);
  }
}

/**
 * Create a ChartRenderer instance with default options.
 */
export function createRenderer(options?: ChartRendererOptions): ChartRenderer {
  return new ChartRenderer(options);
}
