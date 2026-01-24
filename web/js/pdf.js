// chartForge - PDF Export Functions

import { ALL_KEYS, ALL_MODES } from './config.js';
import { parseChordPro, extractTitle, extractVersion } from './parser.js';
import { convertSongToLetters } from './music.js';

/**
 * Export a single PDF of the current chart
 */
export async function exportSinglePdf(renderer, inputContent, options = {}) {
  if (!renderer.layout) return;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [renderer.config.page.width, renderer.config.page.height]
  });

  const title = extractTitle(inputContent);
  const pageCount = renderer.layout.pageCount;

  // Create high-res canvas for PDF export (3x for print quality)
  const exportScale = 3;
  const exportCanvas = document.createElement('canvas');
  const { width, height } = renderer.config.page;
  exportCanvas.width = width * exportScale;
  exportCanvas.height = height * exportScale;

  // Temporarily override pixel ratio for high-res rendering
  const originalRatio = renderer.pixelRatio;
  renderer.pixelRatio = exportScale;

  for (let i = 0; i < pageCount; i++) {
    if (i > 0) pdf.addPage();

    // Render page to high-res canvas
    renderer.renderPage(exportCanvas, i);

    // Add canvas as image to PDF (JPEG for smaller file size)
    const imgData = exportCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
  }

  // Restore original pixel ratio
  renderer.pixelRatio = originalRatio;

  // Build filename
  const version = extractVersion(inputContent);
  const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const safeVersion = version ? version.replace(/[^a-zA-Z0-9\s]/g, '').trim() : '';
  const titlePart = safeVersion ? `${safeTitle} - ${safeVersion}` : safeTitle;
  const mode = options.displayMode || renderer.config.displayMode;
  const keyLabel = options.keyLabel || (options.renderKey === 'numbers' ? 'Numbers' : options.renderKey);

  // Lyrics don't change with key, so omit key from filename
  const filename = mode === 'lyrics'
    ? `${titlePart} - Lyrics.pdf`
    : `${titlePart} - ${keyLabel}${mode === 'chords' ? ' - Chords' : ''}.pdf`;

  pdf.save(filename);

  return { filename };
}

/**
 * Export a full set of PDFs (all keys, all display modes) as a ZIP
 */
export async function exportFullSet(renderer, inputContent, onProgress = null) {
  const baseSong = parseChordPro(inputContent);
  const title = baseSong.title || 'Untitled';
  const version = baseSong.version || '';
  const safeTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const safeVersion = version ? version.replace(/[^a-zA-Z0-9\s]/g, '').trim() : '';
  const titlePart = safeVersion ? `${safeTitle} - ${safeVersion}` : safeTitle;

  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  // Create high-res canvas for PDF export (3x for print quality)
  const exportScale = 3;
  const exportCanvas = document.createElement('canvas');
  const { width, height } = renderer.config.page;
  exportCanvas.width = width * exportScale;
  exportCanvas.height = height * exportScale;

  // Save and override pixel ratio for high-res rendering
  const originalRatio = renderer.pixelRatio;
  renderer.pixelRatio = exportScale;

  const totalFiles = ALL_KEYS.length * ALL_MODES.length + 1; // +1 for lyrics
  let fileCount = 0;

  for (let k = 0; k < ALL_KEYS.length; k++) {
    const key = ALL_KEYS[k];

    // Convert song to this key
    let song;
    if (key === 'numbers') {
      song = baseSong;
    } else {
      song = convertSongToLetters(baseSong, key);
      song.key = key;
    }

    // Generate PDF for each display mode
    for (const mode of ALL_MODES) {
      fileCount++;
      if (onProgress) onProgress(fileCount, totalFiles);

      // Set display mode and load song
      renderer.config.displayMode = mode.value;
      renderer.loadSong(song);
      const pageCount = renderer.layout.pageCount;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [width, height]
      });

      for (let i = 0; i < pageCount; i++) {
        if (i > 0) pdf.addPage();
        renderer.renderPage(exportCanvas, i);
        const imgData = exportCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
      }

      const keyLabel = key === 'numbers' ? 'Numbers' : key;
      const modeLabel = mode.label ? ` - ${mode.label}` : '';
      const pdfFilename = `${titlePart} - ${keyLabel}${modeLabel}.pdf`;
      zip.file(pdfFilename, pdf.output('blob'));

      // Allow UI to update
      await new Promise(r => setTimeout(r, 10));
    }
  }

  // Generate single lyrics-only PDF (key-independent)
  fileCount++;
  if (onProgress) onProgress(fileCount, totalFiles);
  renderer.config.displayMode = 'lyrics';
  renderer.loadSong(baseSong);
  const lyricsPageCount = renderer.layout.pageCount;

  const lyricsPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [width, height]
  });

  for (let i = 0; i < lyricsPageCount; i++) {
    if (i > 0) lyricsPdf.addPage();
    renderer.renderPage(exportCanvas, i);
    const imgData = exportCanvas.toDataURL('image/jpeg', 0.92);
    lyricsPdf.addImage(imgData, 'JPEG', 0, 0, width, height);
  }

  zip.file(`${titlePart} - Lyrics.pdf`, lyricsPdf.output('blob'));

  // Restore original pixel ratio
  renderer.pixelRatio = originalRatio;

  // Generate and return ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return {
    blob: zipBlob,
    filename: `${titlePart} - Full Set.zip`
  };
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
