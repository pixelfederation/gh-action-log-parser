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
    let linesBuffer = []; // Buffer to store recent lines for context

    for await (const line of rl) {
      lineNumber++;

      // Update the rolling buffer of recent lines
      linesBuffer.push(line);

      patterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex);
        if (regex.test(line)) {
          // Always print the line number and result
          let message = `Line ${lineNumber}: ${pattern.result}`;

          // If showLine is 1 or more, include the context lines
          if (pattern.showLine > 0) {
            // Grab the last N lines from the buffer, including the current line
            const contextLines = linesBuffer.slice(-pattern.showLine).join("\n");
            message += `\nContext Lines:\n${contextLines}`;
          }

          console.log(message);
        }
      });

      // Limit the size of linesBuffer to the maximum showLine value to conserve memory
      const maxShowLine = Math.max(...patterns.map(p => p.showLine), 1); // Ensure at least 1
      while (linesBuffer.length > maxShowLine) {
        linesBuffer.shift(); // Remove the oldest line
      }
    }
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