const core = require('@actions/core');
const fs = require('fs');
const readline = require('readline');

// const nodePatterns = require('./patterns/unity.js')

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
    return; // Exit the function if the file does not exist
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;
    let deferredMatches = []; // Store matches that need future lines for context

    for await (const line of rl) {
      lineNumber++;

      // Process deferred matches to see if we can print them now
      deferredMatches = deferredMatches.filter(match => {
        match.contextLines--;
        if (match.contextLines <= 0) {
          // If showLine is 0, only print the result, otherwise print the match and context
          if (match.showLine === 0) {
            console.log(match.message);
          } else {
            console.log(match.message + `\nContext:\n${match.lines.join("\n")}\n`);
          }
          return false; // Remove match from deferredMatches
        }
        match.lines.push(line); // Add current line to the context of the deferred match
        return true; // Keep match in deferredMatches for now
      });

      // Check current line against patterns
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex);
        if (regex.test(line)) {
          if (pattern.showLine === 0) {
            // If showLine is 0, immediately print result without context
            console.log(`Result: ${pattern.result}`);
          } else {
            // If showLine > 0, defer printing until we have enough context
            const match = {
              message: `Line ${lineNumber}: ${pattern.result}`,
              showLine: pattern.showLine,
              contextLines: pattern.showLine - 1, // Subtract 1 because the current line is part of context
              lines: [line] // Start context with the current line
            };
            deferredMatches.push(match);
          }
        }
      });
    }

    // After file processing, print any remaining matches with the context we have
    deferredMatches.forEach(match => {
      if (match.showLine === 0) {
        console.log(match.message);
      } else {
        console.log(match.message + `\nContext:\n${match.lines.join("\n")}`);
      }
    });
  } catch (error) {
    core.setFailed(`An error occurred while processing the file: ${error.message}`);
  }
}

// async function checkFile(filePath, patterns) {
//   // Check if the file exists before attempting to open it
//   if (!fs.existsSync(filePath)) {
//     const errorMessage = `The specified file does not exist: ${filePath}`;
//     core.setFailed(errorMessage);
//     console.error(errorMessage);
//     return; // Exit the function if the file does not exist
//   }
//
//   try {
//     const fileStream = fs.createReadStream(filePath);
//     const rl = readline.createInterface({
//       input: fileStream,
//       crlfDelay: Infinity
//     });
//
//     let lineNumber = 0;
//
//     for await (const line of rl) {
//       lineNumber++;
//
//       patterns.forEach(pattern => {
//         if (pattern.regex.test(line)) {
//           let message = `Line ${lineNumber}: ${pattern.result}`;
//           if (pattern.showLine && pattern.showLine > 0) {
//             message += ` | Line content: "${line}"`;
//           }
//           console.log(message);
//         }
//       });
//     }
//   } catch (error) {
//     core.setFailed(`An error occurred while processing the file: ${error.message}`);
//     // console.error(`An error occurred while processing the file: ${error.message}`);
//   }
// }

async function run() {
  try {
    const filePath = core.getInput('filePath');
    const logType = core.getInput('logType');

    const patterns = await loadPatterns(logType);

    if (patterns && patterns.length > 0) {
      await checkFile(filePath, patterns);
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

module.exports = {
  run
}