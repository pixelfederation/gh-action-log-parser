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
    const errorMessage = `The specified file does not exist: ${filePath}`;
    core.setFailed(errorMessage);
    console.error(errorMessage);
    return; // Exit the function if the file does not exist
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineNumber = 0;
    let linesBuffer = []; // Buffer to store lines for context
    const maxLinesToShow = Math.max(...patterns.map(p => p.showLine)); // Find the maximum showLine value

    for await (const line of rl) {
      lineNumber++;
      linesBuffer.push(line); // Add the current line to the buffer

      // Ensure the buffer does not grow larger than the maximum lines needed
      if (linesBuffer.length > maxLinesToShow) {
        linesBuffer.shift(); // Remove the oldest line if buffer exceeds the size
      }

      patterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex);
        if (regex.test(line)) {
          let message = `Line ${lineNumber}: ${pattern.result}`;
          // If showLine is enabled for this pattern, include the context lines
          if (pattern.showLine > 0) {
            // Calculate how many lines of context to include
            const contextStartIndex = Math.max(0, linesBuffer.length - pattern.showLine);
            const contextLines = linesBuffer.slice(contextStartIndex).join("\n");
            message += `\nContext Lines:\n${contextLines}`;
          }

          console.log(message);
        }
      });
    }
  } catch (error) {
    core.setFailed(`An error occurred while processing the file: ${error.message}`);
    console.error(`An error occurred while processing the file: ${error.message}`);
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