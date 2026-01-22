#!/usr/bin/env python3
"""
Convert letter chord notation to Nashville Number notation.

Reads songs from converted/ and outputs to numbered/ with chords
converted from letters (Am, G, C/E) to numbers (6m, 5, 1/3).

Usage:
    python convert_to_numbers.py [input_dir] [output_dir]

Defaults:
    input_dir: ./converted
    output_dir: ./numbered
"""

import os
import re
import sys
from pathlib import Path


# Chromatic scale (sharps and flats)
CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
CHROMATIC_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

# Major scale intervals (semitones from root)
MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]

# Keys that prefer flats
FLAT_KEYS = {'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
             'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'}


def get_note_index(note: str) -> int:
    """Get chromatic index (0-11) for a note."""
    # Normalize
    if len(note) > 1:
        note = note[0].upper() + note[1:]
    else:
        note = note.upper()

    idx = -1
    if note in CHROMATIC_SHARPS:
        idx = CHROMATIC_SHARPS.index(note)
    elif note in CHROMATIC_FLATS:
        idx = CHROMATIC_FLATS.index(note)
    return idx


def get_major_scale(key_root: str) -> list:
    """Get the major scale notes for a given key root."""
    root_idx = get_note_index(key_root)
    if root_idx == -1:
        return None

    prefer_flats = key_root in FLAT_KEYS or key_root.rstrip('m') in FLAT_KEYS
    chromatic = CHROMATIC_FLATS if prefer_flats else CHROMATIC_SHARPS

    scale = []
    for interval in MAJOR_SCALE_INTERVALS:
        note_idx = (root_idx + interval) % 12
        scale.append(chromatic[note_idx])

    return scale


def get_key_root(key: str) -> str:
    """Extract root note from key (handles minor keys like 'Am')."""
    if key.endswith('m'):
        return key[:-1]
    return key


def letter_to_number(chord_str: str, key: str) -> str:
    """
    Convert a letter chord to Nashville number notation.

    Examples (key of G):
        G -> 1
        Am -> 2m
        C -> 4
        D/F# -> 5/7
        Em7 -> 6m7
    """
    if not chord_str or not key:
        return chord_str

    key_root = get_key_root(key)
    scale = get_major_scale(key_root)
    if not scale:
        return chord_str

    # Parse the chord: root, quality, bass
    # Match: root note (with optional #/b), quality, optional /bass
    match = re.match(r'^([A-Ga-g][#b]?)(.*?)(?:/([A-Ga-g][#b]?))?$', chord_str)
    if not match:
        return chord_str

    root = match.group(1)
    quality = match.group(2) or ''
    bass = match.group(3)

    # Normalize root
    root = root[0].upper() + root[1:] if len(root) > 1 else root.upper()

    # Find scale degree for root
    root_idx = get_note_index(root)
    if root_idx == -1:
        return chord_str

    # Check if root is in the scale
    degree = None
    for i, scale_note in enumerate(scale):
        if get_note_index(scale_note) == root_idx:
            degree = i + 1
            break

    # If not in scale, check for chromatic alterations
    chromatic_prefix = ''
    if degree is None:
        # Check if it's a sharp or flat of a scale degree
        for i, scale_note in enumerate(scale):
            scale_idx = get_note_index(scale_note)
            if (scale_idx + 1) % 12 == root_idx:
                # Root is one semitone above scale degree (sharp)
                degree = i + 1
                chromatic_prefix = '#'
                break
            elif (scale_idx - 1) % 12 == root_idx:
                # Root is one semitone below scale degree (flat)
                degree = i + 1
                chromatic_prefix = 'b'
                break

    if degree is None:
        return chord_str  # Couldn't map to scale

    # Build the number chord
    result = f"{chromatic_prefix}{degree}{quality}"

    # Handle bass note
    if bass:
        bass = bass[0].upper() + bass[1:] if len(bass) > 1 else bass.upper()
        bass_idx = get_note_index(bass)

        if bass_idx != -1:
            bass_degree = None
            bass_prefix = ''

            for i, scale_note in enumerate(scale):
                if get_note_index(scale_note) == bass_idx:
                    bass_degree = i + 1
                    break

            if bass_degree is None:
                for i, scale_note in enumerate(scale):
                    scale_idx = get_note_index(scale_note)
                    if (scale_idx + 1) % 12 == bass_idx:
                        bass_degree = i + 1
                        bass_prefix = '#'
                        break
                    elif (scale_idx - 1) % 12 == bass_idx:
                        bass_degree = i + 1
                        bass_prefix = 'b'
                        break

            if bass_degree:
                result += f"/{bass_prefix}{bass_degree}"
            else:
                result += f"/{bass}"  # Keep original if can't convert
        else:
            result += f"/{bass}"

    return result


def convert_chords_in_line(line: str, key: str) -> str:
    """Convert all [chord] occurrences in a line to number notation."""
    def replace_chord(match):
        chord = match.group(1)
        converted = letter_to_number(chord, key)
        return f"[{converted}]"

    return re.sub(r'\[([^\]]+)\]', replace_chord, line)


def extract_key(content: str) -> str:
    """Extract key from ChordPro content."""
    match = re.search(r'\{key\s*:\s*([A-Ga-g][#b]?m?)\}', content, re.IGNORECASE)
    if match:
        key = match.group(1)
        return key[0].upper() + key[1:] if len(key) > 1 else key.upper()
    return None


def convert_file(content: str, filename: str = '') -> tuple:
    """
    Convert a song from letter notation to number notation.
    Returns (converted_content, key_used, success).
    """
    key = extract_key(content)

    if not key:
        return content, None, False

    lines = content.split('\n')
    converted_lines = []

    for line in lines:
        # Skip key directive line (we keep it for reference)
        if re.match(r'^\{key\s*:', line, re.IGNORECASE):
            converted_lines.append(line)
            continue

        # Convert chords in this line
        converted_lines.append(convert_chords_in_line(line, key))

    return '\n'.join(converted_lines), key, True


def process_directory(input_dir: Path, output_dir: Path):
    """Process all .txt files in input directory."""
    txt_files = list(input_dir.glob('*.txt'))

    if not txt_files:
        print(f"No .txt files found in '{input_dir}'")
        return

    print(f"Converting {len(txt_files)} files from '{input_dir}' to '{output_dir}'")
    print()

    output_dir.mkdir(parents=True, exist_ok=True)

    success = 0
    no_key = 0
    errors = []

    for input_path in sorted(txt_files):
        try:
            # Try UTF-8 first, fall back to latin-1
            try:
                content = input_path.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                content = input_path.read_text(encoding='latin-1')

            converted, key, ok = convert_file(content, input_path.name)

            if ok:
                output_path = output_dir / input_path.name
                output_path.write_text(converted, encoding='utf-8')
                success += 1
            else:
                no_key += 1
                # Still copy the file, just without conversion
                output_path = output_dir / input_path.name
                output_path.write_text(content, encoding='utf-8')

        except Exception as e:
            errors.append({'file': input_path.name, 'error': str(e)})

    print(f"Converted: {success}/{len(txt_files)} files")
    if no_key:
        print(f"No key found (copied as-is): {no_key} files")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for err in errors:
            print(f"  - {err['file']}: {err['error']}")

    print(f"\nOutput directory: {output_dir}")


def main():
    input_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / 'converted'
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / 'numbered'

    if not input_dir.exists():
        print(f"Error: Input directory '{input_dir}' does not exist")
        sys.exit(1)

    process_directory(input_dir, output_dir)


if __name__ == '__main__':
    main()
