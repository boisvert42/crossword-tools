/**
 * Crossword Submission Checker
 * (c) 2021 Crossword Nexus
 * https://mit-license.org/
 *
 * This module validates crossword puzzle specifications against standard
 * publication and submission guidelines (e.g., maximum black square counts,
 * word count limits, 3-letter fill caps, total clue character counts, and
 * accidental clue/entry duplicates).
 **/

/**
 * Counts the number of black squares (blocks) in the crossword grid.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {Array<Object>} xw.cells - Array of cell objects in the puzzle grid.
 * @returns {number} The total count of black square cells.
 */
function countBlackSquares(xw) {
    var ct = 0;
    xw.cells.forEach(function (c) {
        if (c.type == 'block') {
            ct += 1;
        }
    });
    return ct;
}

/**
 * Returns the total number of words (entries) in the crossword puzzle.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {Array<Object>} xw.words - Array of word objects in the puzzle.
 * @returns {number} The total word count.
 */
function wordCount(xw) {
    return xw.words.length;
}

/**
 * Counts the number of short 3-letter words in the crossword puzzle.
 * Most crossword publishers limit the proportion of 3-letter words to maintain fill quality.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {Array<Object>} xw.words - Array of word objects in the puzzle.
 * @returns {number} The number of 3-letter words.
 */
function threeLetterWordCount(xw) {
    var ct = 0;
    xw.words.forEach(function(w) {
        if (w.cells.length == 3) {
            ct += 1;
        }
    });
    return ct;
}

/**
 * Calculates the total character length of all clues combined.
 * Helpful for estimating whether clue lists will fit within printed page layout limits.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {Array<Object>} xw.clues - Array of clue lists (e.g., Across and Down).
 * @returns {number} Total character count of all clue texts.
 */
function clueCharacterCount(xw) {
    var ct = 0;
    xw.clues.forEach(function(clueList) {
        clueList.clue.forEach(function (c) {
            var clue_text = c.text || '';
            ct += clue_text.length;
        });
    });
    return ct;
}

/**
 * Identifies duplicate occurrences where words in a clue also appear within grid entries.
 * Crossword conventions generally discourage having a clue repeat or contain any entry in the grid.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {number} [minDupeLength=4] - Minimum word length to consider when checking for clue duplicates.
 * @returns {Array<Object>} Array of dupe records, each containing {entry, clue, clueDirection, clueNumber}.
 */
function xwDupes(xw, minDupeLength=4) {
    var dupes = [];
    // Map clue labels to grid entry answer strings (e.g., { "1A": "ANSWER", ... })
    var entry_map = xw.get_entry_mapping();
    // Collect unique grid entry solutions into a Set for fast lookup
    var entries = new Set();
    Object.keys(entry_map).forEach(x => entries.add(entry_map[x]));

    // Iterate through all clue lists (typically "Across" and "Down")
    xw.clues.forEach(function(clueList) {
        var thisCluesDirection = clueList.title;
        // Iterate through each individual clue
        clueList.clue.forEach(function (c) {
            var clue = c.text || '';
            var num = c.number;
            // Split the clue into constituent words by spaces and hyphens
            var words = clue.split(/[ -]/);
            words.forEach(function (word) {
                // Normalize word: uppercase and strip punctuation / non-alpha characters
                word = word.toUpperCase();
                word = word.replace(/[^A-Za-z]+/g, "");
                // Only check words meeting or exceeding the minimum length threshold
                if (word.length >= minDupeLength) {
                    entries.forEach(function (entry) {
                        // Check if the grid entry contains the clue word as a substring
                        if (entry.match(word)) {
                            dupes.push({
                                'entry': entry,
                                'clue': clue,
                                'clueDirection': thisCluesDirection,
                                'clueNumber': num
                            });
                        }
                    }); // end for entry
                } // end if word length
            }); // end for words in clue
        }); // end for clues in clue list
    }); // end for cluelist in xw
    return dupes;
}

/**
 * Runs a full suite of submission specification checks against standard crossword guidelines:
 * 1. Black squares count (typical guideline: <= 1/6 of total cells in grid).
 * 2. 3-letter words count (typical guideline: <= 25% of total entries).
 * 3. Total word count (typical guideline formula: <= ceil(0.3 * width * height + 12)).
 * 4. Clue character count (typical layout formula: <= ceil((50/9) * width * height + 350)).
 * 5. Clue/entry dupes (guideline: 0 duplicate words >= minDupeLength).
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {number} [minDupeLength=4] - Minimum word length for duplicate checking.
 * @returns {Array<Object>} Array of result objects with {name, value, max_value, is_ok}.
 */
function submissionChecker(xw, minDupeLength=4) {
    var check_results = [];

    // Guideline 1: Black squares should typically not exceed 1/6 of total grid squares
    var blackSquareMax = Math.ceil(xw.cells.length / 6);
    var blackSquares = countBlackSquares(xw);
    check_results.push({
        'name': 'Black squares',
        'value': blackSquares,
        'max_value': blackSquareMax,
        'is_ok': (blackSquares <= blackSquareMax)
    });

    // Guideline 2: 3-letter words should not exceed 25% (1/4) of total entries
    var threeLetterMax = Math.ceil(0.25 * Object.keys(xw.get_entry_mapping()).length);
    var threeLetterWords = threeLetterWordCount(xw);
    check_results.push({
        'name': '3-letter words',
        'value': threeLetterWords,
        'max_value': threeLetterMax,
        'is_ok': (threeLetterWords <= threeLetterMax)
    });

    // Guideline 3: Word count limit approximate formula: 0.3 * width * height + 12
    // (e.g., max 80 words for standard 15x15; max 145 words for 21x21)
    var maxWordCount = Math.ceil(0.3 * xw.metadata.width * xw.metadata.height + 12);
    var word_count = wordCount(xw);
    check_results.push({
        'name': 'Word count',
        'value': word_count,
        'max_value': maxWordCount,
        'is_ok': (word_count <= maxWordCount)
    });

    // Guideline 4: Clue character count approximate layout limit formula: (50/9) * width * height + 350
    // (e.g., ~1600 characters for 15x15)
    var maxClueCharacterCount = Math.ceil((50/9) * xw.metadata.width * xw.metadata.height + 350);
    var clueChars = clueCharacterCount(xw);
    check_results.push({
        'name': 'Clue characters',
        'value': clueChars,
        'max_value': maxClueCharacterCount,
        'is_ok': (clueChars <= maxClueCharacterCount)
    });

    // Guideline 5: Unintentional dupes between clues and entries
    var dupes = xwDupes(xw, minDupeLength);
    check_results.push({
        'name': 'Dupes',
        'value': dupes,
        'max_value': null,
        'is_ok': (dupes.length == 0)
    });

    return check_results;
}

/**
 * Runs submission checks and formats the results as an HTML string for display in the UI.
 * Passes display with a green checkmark (✅), while guideline violations display in red (❌)
 * along with the typical recommended limit.
 *
 * @param {Object} xw - The JSCrossword puzzle object.
 * @param {number} [minDupeLength=4] - Minimum word length for duplicate checking.
 * @returns {string} Formatted HTML representing the check results.
 */
function submission_check_html(xw, minDupeLength=4) {
    var check_results = submissionChecker(xw, minDupeLength);
    var html = '';

    check_results.forEach(function (x) {
        var color = x.is_ok ? 'green' : 'red';
        var emoji = x.is_ok ? '✅' : '❌';
        html += `<h3>${x.name}</h3>`;
        html += `<p style="color:${color};">`;

        if (x.name == 'Dupes') {
            // List all detected clue/entry duplicates
            x.value.forEach(function (d) {
                html += `${d.entry} / ${d.clue} [${d.clueNumber}-${d.clueDirection}]<br />\n`;
            });
            if (!x.value.length) {
                html += 'No dupes found.';
            }
        } else {
            // Display metric value and pass/fail indicator
            html += `${x.value} ${emoji}</p>`;
            if (!x.is_ok) {
                html += `<p>Typical limit: ${x.max_value}</p>`;
            }
        }
    });

    return html;
}
