// chartForge - Editor Functions (Syntax Highlighting)

/**
 * Apply syntax highlighting to ChordPro text
 */
export function highlightSyntax(text) {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Highlight directives: {key: value}
  html = html.replace(
    /(\{)(title|artist|key|tempo|time|version|key_change|keychange)(:)([^}]*)(\})/gi,
    '<span class="hl-brace">$1</span><span class="hl-directive-key">$2</span><span class="hl-brace">$3</span><span class="hl-directive-value">$4</span><span class="hl-brace">$5</span>'
  );

  // Highlight sections: {section: Name}
  html = html.replace(
    /(\{)(section)(:)([^}]*)(\})/gi,
    '<span class="hl-brace">$1</span><span class="hl-section">$2</span><span class="hl-brace">$3</span><span class="hl-section-name">$4</span><span class="hl-brace">$5</span>'
  );

  // Highlight dynamics: {dynamics: value}
  html = html.replace(
    /(\{)(dynamics)(:)([^}]*)(\})/gi,
    '<span class="hl-brace">$1</span><span class="hl-directive-key">$2</span><span class="hl-brace">$3</span><span class="hl-directive-value">$4</span><span class="hl-brace">$5</span>'
  );

  // Highlight chords: [chord]
  html = html.replace(
    /(\[)([^\]]+)(\])/g,
    '<span class="hl-bracket">$1</span><span class="hl-chord">$2</span><span class="hl-bracket">$3</span>'
  );

  return html;
}

/**
 * Sync the highlight layer with the input textarea
 */
export function syncHighlight(inputEl, highlightEl) {
  highlightEl.innerHTML = highlightSyntax(inputEl.value) + '\n';
}

/**
 * Sync scroll position between textarea and backdrop
 */
export function syncScroll(inputEl, backdropEl) {
  backdropEl.scrollTop = inputEl.scrollTop;
  backdropEl.scrollLeft = inputEl.scrollLeft;
}

/**
 * Setup auto-complete behavior for the editor
 * - Numbers wrap in []
 * - { completes to {}
 */
export function setupAutoComplete(inputEl, onInput) {
  inputEl.addEventListener('keydown', (e) => {
    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const value = inputEl.value;

    // Auto-wrap numbers in brackets
    if (e.key >= '0' && e.key <= '9') {
      // Check if already inside brackets or braces
      const beforeCursor = value.substring(0, start);
      const lastOpen = beforeCursor.lastIndexOf('[');
      const lastClose = beforeCursor.lastIndexOf(']');
      const insideBrackets = lastOpen > lastClose;
      const lastBraceOpen = beforeCursor.lastIndexOf('{');
      const lastBraceClose = beforeCursor.lastIndexOf('}');
      const insideBraces = lastBraceOpen > lastBraceClose;

      if (!insideBrackets && !insideBraces) {
        e.preventDefault();
        const newValue = value.substring(0, start) + '[' + e.key + ']' + value.substring(end);
        inputEl.value = newValue;
        inputEl.selectionStart = inputEl.selectionEnd = start + 2; // After the number, before ]
        if (onInput) onInput();
      }
    }

    // Auto-complete { to {}
    if (e.key === '{') {
      e.preventDefault();
      const newValue = value.substring(0, start) + '{}' + value.substring(end);
      inputEl.value = newValue;
      inputEl.selectionStart = inputEl.selectionEnd = start + 1; // Between { and }
      if (onInput) onInput();
    }
  });
}
