# Crossword Submission Checker

A tool for crossword constructors and editors to validate crossword puzzles against standard publication and submission guidelines before submitting them to publishers (such as The New York Times, Universal, Los Angeles Times, etc.).

## Features & Checks

The submission checker evaluates a puzzle against the following standard editorial guidelines:

1. **Black Square Count**
   - **Guideline**: No more than 1/6 of total grid squares (`Math.ceil(cells.length / 6)`).
   - *Example*: For a standard 15×15 grid (225 cells), the typical maximum is 38 black squares.

2. **Three-Letter Word Count**
   - **Guideline**: No more than 25% (1/4) of total word entries should be 3-letter words.
   - Minimizing short fill keeps grid quality higher.

3. **Word Count**
   - **Guideline**: Approximated by `Math.ceil(0.3 * width * height + 12)`.
   - *Example*: Standard 15×15 grids typically max out at 78–80 words; 21×21 Sunday grids typically max out at 140–145 words.

4. **Clue Character Count**
   - **Guideline**: Approximated by `Math.ceil((50/9) * width * height + 350)` characters total.
   - *Example*: ~1,600 characters for a 15×15 grid. Useful for ensuring clue lists will fit standard print publication layouts without crowding.

5. **Dupes (Grid vs. Clues)**
   - **Guideline**: Words in clues should not duplicate or appear within grid entries.
   - Strips non-alphanumeric characters, uppercases clue tokens, and flags any word of length $\ge$ `minDupeLength` (configurable in the UI, default 4) that matches any grid entry.

6. **Dupes (Within Grid)**
   - **Guideline**: Grid entries should not repeat identical words or share etymological roots, stems, or suffixes (e.g., `QUICK` / `QUICKLY`, `ATEUP` / `EATING`).
   - Powered by `window.findDupes` from [`dupe-checker.min.js`](dupe-checker.min.js).

## Supported Formats

Puzzle parsing is handled via [`JSCrossword`](../jscrossword/):
- Across Lite (`.puz`)
- ipuz (`.ipuz`)
- JPZ / Crossword Compiler (`.jpz`, `.xml`)
- Crossdown (`.xpz`)
- Crossword Forge (`.cfp`)

## Files

- **[`submission_checker.js`](submission_checker.js)**: Core validation logic and HTML report generator.
- **[`dupe-checker.min.js`](dupe-checker.min.js)**: Bundled stemmer and dupe-finding engine providing `window.findDupes`.
- **[`index.html`](index.html)**: Browser interface to upload puzzle files and view pass/fail checks with diagnostic details.

## Usage

### In the Browser

Open `index.html` in your web browser (or serve the repository via a local web server):
1. Select the minimum word length for clue duplicate checking (3, 4, or 5; default is 4).
2. Choose a supported puzzle file using the file selector.
3. View the checklist results with pass (✅) and fail (❌) indicators.

### Programmatic API

```javascript
// Parse a puzzle file using JSCrossword
const xw = new JSCrossword().fromData(fileContents);

// Run the submission checker asynchronously (returns an array of metric objects)
const results = await submissionChecker(xw, /* minDupeLength = */ 4);
/*
[
  { name: 'Black squares', value: 36, max_value: 38, is_ok: true },
  { name: '3-letter words', value: 8, max_value: 19, is_ok: true },
  { name: 'Word count', value: 76, max_value: 80, is_ok: true },
  { name: 'Clue characters', value: 1420, max_value: 1600, is_ok: true },
  { name: 'Dupes (grid vs. clues)', value: [], max_value: null, is_ok: true },
  { name: 'Dupes (within grid)', value: [], max_value: null, is_ok: true }
]
*/

// Or generate HTML output directly
const reportHtml = await submission_check_html(xw, /* minDupeLength = */ 4);
document.getElementById('results').innerHTML = reportHtml;
```

## License

MIT License. (c) 2021 Crossword Nexus.
