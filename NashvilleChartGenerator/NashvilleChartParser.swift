import Foundation

struct NashvilleChartParser {
    enum Section: Character {
        case intro = "i", verse = "v", chorus = "c", bridge = "b", tag = "t"
        var title: String {
            switch self {
            case .intro:  return "Intro:"
            case .verse:  return "Verse:"
            case .chorus: return "Chorus:"
            case .bridge: return "Bridge:"
            case .tag:    return "Tag:"
            }
        }
    }

    static func parse(title: String, raw: String) -> String {
        var output = "\(title)\n\n"
        for line in raw
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .components(separatedBy: .newlines)
        {
            guard !line.isEmpty else { continue }
            let tokens = line
                .split(separator: " ", omittingEmptySubsequences: true)
                .map(String.init)

            // Section header?
            if let first = tokens.first,
               first.count == 1,
               let secChar = first.lowercased().first,
               let section = Section(rawValue: secChar)
            {
                output += "\(section.title)\n"
                continue
            }

            // Parse one chord-line with local grouping
            var segments: [String] = []
            var awaitingGroup = false
            var groupTemp: [String] = []

            func processChord(_ tok: String) -> String {
                if tok.hasSuffix("+") {
                    return "\(tok.dropLast())M"
                } else if tok.hasSuffix("-") {
                    return "\(tok.dropLast())m"
                } else {
                    return tok
                }
            }

            for tok in tokens {
                if tok == "." {
                    // remove last chord and buffer it
                    if let last = segments.popLast() {
                        groupTemp = [last]
                        awaitingGroup = true
                    }
                } else {
                    let chord = processChord(tok)
                    if awaitingGroup {
                        groupTemp.append(chord)
                        // finalize grouping and reset
                        let grp = "(\(groupTemp.joined(separator: "  ")))"
                        segments.append(grp)
                        groupTemp = []
                        awaitingGroup = false
                    } else {
                        segments.append(chord)
                    }
                }
            }

            output += segments.joined(separator: "  ") + "\n"
        }
        return output
    }

    static func export(chartText: String, fileName: String) throws {
        let fm = FileManager.default
        let docs = try fm.url(
            for: .documentDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let chartsDir = docs.appendingPathComponent("Charts", isDirectory: true)
        if !fm.fileExists(atPath: chartsDir.path) {
            try fm.createDirectory(at: chartsDir, withIntermediateDirectories: true)
        }
        let fileURL = chartsDir
            .appendingPathComponent(fileName)
            .appendingPathExtension("txt")
        try chartText.write(to: fileURL, atomically: true, encoding: .utf8)
    }
}