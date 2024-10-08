const core = require('@actions/core');
const fs = require('fs');
const readline = require('readline');

// store messages for output matchOutput
let matchOutput = "";

function loadPatterns(logType) {
  try {
    // Define a map or object with known logTypes and corresponding module paths
    const patternFiles = {
      unity: './patterns/unity.js',
      // node: './patterns/node.js',
      // Add other logTypes and their corresponding pattern files here
    };

    // Check if the logType is supported and require the corresponding pattern file
    if (patternFiles[logType]) {
      const patterns = require(patternFiles[logType]);
      return patterns.map(pattern => ({
        ...pattern,
        regex: new RegExp(pattern.regex),
      }));
    } else {
      throw new Error(`Unsupported logType '${logType}'.`);
    }
  } catch (error) {
    core.setFailed(`Failed to load patterns for logType '${logType}': ${error.message}`);
    return [];
  }
}

async function checkFile(filePath, patterns) {
  if (!fs.existsSync(filePath)) {
    core.setFailed(`The specified file does not exist: ${filePath}`);
    return;
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;
    let pendingMatches = []; // To hold matches and print them once we have enough context

    for await (const line of rl) {
      lineNumber++;
      const newPendingMatches = [];

      // Check pending matches to see if we can resolve them now
      pendingMatches.forEach(match => {
        if (lineNumber - match.lineNumber < match.showLine) {
          // Still collecting context lines for this match
          match.context.push(line);
          newPendingMatches.push(match); // Keep in pending
        } else {
          // We have all needed context lines, print the match
          printMatch(match);
        }
      });

      // Update the list of pending matches
      pendingMatches = newPendingMatches;

      // Check the current line against each pattern
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex);
        if (regex.test(line)) {
          const match = {
            lineNumber: lineNumber,
            showLine: pattern.showLine,
            result: pattern.result,
            context: [line], // start context with matching line
          };
          if (pattern.showLine > 1) {
            pendingMatches.push(match); // Defer printing for additional context
          } else {
            printMatch(match); // Print immediately if no additional context is needed
          }
        }
      });
    }

    // Print any remaining matches
    pendingMatches.forEach(match => printMatch(match));
  } catch (error) {
    core.setFailed(`An error occurred while processing the file: ${error.message}`);
  }
}

function printMatch(match) {
  let message = `Line ${match.lineNumber}: ${match.result}`;
  if (match.showLine && match.showLine > 0) {
    message += `\nContext Lines:\n${match.context.join("\n")}`;
  }
  console.log(message);
  matchOutput += message + "\n";
}

function formatMatchOutput(match, outputMaxChars) {
  if (match.length === 0) {
      match = "--- No matches found ---";
  } else if (match.length > outputMaxChars) {
      let truncationNotice = "\n--- The rest of matches is truncated due to \"" + outputMaxChars + "\" chars limit ---";
      match = match.substring(0, outputMaxChars - truncationNotice.length) + truncationNotice;
  } else {
      match += "\n--- The end of Matches ---";
  }

  return JSON.stringify(match);
}

async function run() {
  try {
    const filePath = core.getInput('filePath');
    const logType = core.getInput('logType');
    const matchOutputMaxCharsInput = core.getInput('matchOutputMaxChars');
    const matchOutputMaxChars = parseInt(matchOutputMaxCharsInput, 10);

    if (isNaN(matchOutputMaxChars)) {
      core.setFailed('Input "matchOutputMaxChars" is not a valid integer.');
    }

    const patterns = await loadPatterns(logType);

    if (patterns && patterns.length > 0) {
      await checkFile(filePath, patterns);
      core.setOutput("matchOutput", formatMatchOutput(matchOutput, matchOutputMaxChars));
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

module.exports = {
  run
}