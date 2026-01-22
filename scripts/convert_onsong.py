#!/usr/bin/env python3
"""
Convert OnSong (.onsong) files to chartForge ChordPro format.

Usage:
    python convert_onsong.py [input_dir] [output_dir]

Defaults:
    input_dir: ./mgrepo
    output_dir: ./converted
"""

import os
import re
import sys
from pathlib import Path


# Metadata fields to convert (OnSong -> ChordPro directive)
METADATA_MAP = {
    'title': 'title',
    'artist': 'artist',
    'key': 'key',
    'tempo': 'tempo',
    'time': 'time',
}

# Section name normalization
SECTION_PATTERNS = [
    (r'^verse\s*(\d*)$', 'Verse'),
    (r'^chorus\s*(\d*)$', 'Chorus'),
    (r'^bridge\s*(\d*)$', 'Bridge'),
    (r'^intro\s*(\d*)$', 'Intro'),
    (r'^outro\s*(\d*)$', 'Outro'),
    (r'^pre[- ]?chorus\s*(\d*)$', 'Pre Chorus'),
    (r'^prechorus\s*(\d*)$', 'Pre Chorus'),
    (r'^tag\s*(\d*)$', 'Tag'),
    (r'^interlude\s*(\d*)$', 'Interlude'),
    (r'^instrumental\s*(\d*)$', 'Instrumental'),
    (r'^ending\s*(\d*)$', 'Ending'),
    (r'^turnaround\s*(\d*)$', 'Turnaround'),
    (r'^turn\s*(\d*)$', 'Turnaround'),
    (r'^vamp\s*(\d*)$', 'Vamp'),
]


def normalize_section_name(name: str) -> str:
    """Normalize section name to chartForge format."""
    # Remove modifiers like (2x), x2, etc.
    clean = re.sub(r'\s*[\(\[]?\d*[xX][\)\]]?\s*$', '', name)
    clean = re.sub(r'\s*[\(\[].*[\)\]]\s*$', '', clean)
    clean = clean.strip()

    lower = clean.lower()

    for pattern, replacement in SECTION_PATTERNS:
        match = re.match(pattern, lower, re.IGNORECASE)
        if match:
            num = match.group(1) if match.lastindex and match.group(1) else ''
            return f"{replacement} {num}".strip() if num else replacement

    # Return original if no pattern matches (custom section)
    return clean.title()


def parse_key(value: str) -> str:
    """Extract key from OnSong format (removes brackets)."""
    # Handle Key: [G] format
    match = re.match(r'\[?([A-Ga-g][#b]?m?)\]?', value.strip())
    if match:
        key = match.group(1)
        return key[0].upper() + key[1:] if len(key) > 1 else key.upper()
    return value.strip()


def convert_onsong_to_chordpro(content: str, filename: str = '') -> str:
    """Convert OnSong format to chartForge ChordPro format."""
    lines = content.split('\n')
    output = []

    metadata = {}
    content_lines = []
    in_metadata = True

    for line in lines:
        stripped = line.strip()

        # Check for metadata (only at the start)
        if in_metadata:
            # Check for known metadata patterns
            meta_match = re.match(r'^(Title|Artist|Key|Tempo|Time|Original Key|Book|Notes|Scripture Reference\(s\)|CANT Key)\s*:\s*(.+)$', stripped, re.IGNORECASE)
            if meta_match:
                field = meta_match.group(1).lower()
                value = meta_match.group(2).strip()

                # Map to ChordPro directives
                if field == 'title':
                    metadata['title'] = value
                elif field == 'artist':
                    metadata['artist'] = value
                elif field == 'key':
                    metadata['key'] = parse_key(value)
                elif field == 'tempo':
                    metadata['tempo'] = value
                elif field == 'time':
                    metadata['time'] = value
                # Skip other metadata (Original Key, Book, Notes, etc.)
                continue
            elif stripped == '':
                continue
            else:
                # No longer in metadata section
                in_metadata = False

        if not in_metadata:
            content_lines.append(line)

    # Use filename as title if missing
    if 'title' not in metadata and filename:
        title = Path(filename).stem
        metadata['title'] = title

    # Build output with ChordPro directives
    if 'title' in metadata:
        output.append(f"{{title: {metadata['title']}}}")
    if 'artist' in metadata:
        output.append(f"{{artist: {metadata['artist']}}}")
    if 'key' in metadata:
        output.append(f"{{key: {metadata['key']}}}")
    if 'tempo' in metadata:
        output.append(f"{{tempo: {metadata['tempo']}}}")
    if 'time' in metadata:
        output.append(f"{{time: {metadata['time']}}}")

    output.append('')  # Blank line after metadata

    # Process content lines
    for line in content_lines:
        stripped = line.strip()

        # Check for section header (e.g., "Verse 1:", "Chorus:")
        section_match = re.match(r'^([A-Za-z][A-Za-z0-9 \-]*\d*)\s*(?:[\(\[][^\)\]]*[\)\]])?\s*:\s*$', stripped)
        if section_match:
            section_name = section_match.group(1).strip()
            normalized = normalize_section_name(section_name)
            output.append(f"{{section: {normalized}}}")
            continue

        # Keep other lines as-is (chords are already in [X] format)
        output.append(line.rstrip())

    # Clean up multiple blank lines
    result = '\n'.join(output)
    result = re.sub(r'\n{3,}', '\n\n', result)

    return result.strip() + '\n'


def convert_file(input_path: Path, output_path: Path) -> dict:
    """Convert a single file and return status."""
    try:
        # Try UTF-8 first, fall back to latin-1
        try:
            content = input_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            content = input_path.read_text(encoding='latin-1')

        converted = convert_onsong_to_chordpro(content, input_path.name)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(converted, encoding='utf-8')

        return {'status': 'success', 'file': input_path.name}
    except Exception as e:
        return {'status': 'error', 'file': input_path.name, 'error': str(e)}


def main():
    # Parse arguments
    input_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / 'mgrepo'
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / 'converted'

    if not input_dir.exists():
        print(f"Error: Input directory '{input_dir}' does not exist")
        sys.exit(1)

    # Find all .onsong files
    onsong_files = list(input_dir.glob('*.onsong'))

    if not onsong_files:
        print(f"No .onsong files found in '{input_dir}'")
        sys.exit(1)

    print(f"Converting {len(onsong_files)} files from '{input_dir}' to '{output_dir}'")
    print()

    success = 0
    errors = []

    for input_path in sorted(onsong_files):
        output_path = output_dir / (input_path.stem + '.txt')
        result = convert_file(input_path, output_path)

        if result['status'] == 'success':
            success += 1
        else:
            errors.append(result)

    print(f"Converted: {success}/{len(onsong_files)} files")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for err in errors:
            print(f"  - {err['file']}: {err['error']}")

    print(f"\nOutput directory: {output_dir}")


if __name__ == '__main__':
    main()
