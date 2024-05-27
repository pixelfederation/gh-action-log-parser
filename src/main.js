const core = require('@actions/core');
// const fs = require('fs');
// const readline = require('readline');

const nodePatterns = require('./patterns/unity.js')

function loadPatterns(logType) {
  try {
    // Define a map or object with known logTypes and corresponding module paths
    const patternFiles = {
      unity: './patterns/unity.js',
      node: './patterns/node.js',
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

// async function loadPatterns(logType) {
//   try {
//     // Dynamically construct the module path and import the patterns module
//     const modulePath = `./patterns/${logType}.js`;
//     const patternsModule = await import(modulePath);
//     const patterns = patternsModule.default.map(pattern => ({
//       ...pattern,
//       regex: new RegExp(pattern.regex),
//     }));
//     return patterns;
//   } catch (error) {
//     core.setFailed(`Failed to load patterns for logType '${logType}': ${error.message}`);
//     return [];
//   }
// }
// async function checkFile(filePath, patterns) {
//   try {
//     const fileStream = fs.createReadStream(filePath);
//     const rl = readline.createInterface({
//       input: fileStream,
//       crlfDelay: Infinity
//     });

//     let lineNumber = 0;

//     for await (const line of rl) {
//       lineNumber++;

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
//   }
// }

async function run() {
  try {
    const filePath = core.getInput('filePath');
    const logType = core.getInput('logType');

    console.log(`_ok7_`)
    const patterns = await loadPatterns(logType);

    // if (patterns && patterns.length > 0) {
    //   await checkFile(filePath, patterns);
    // }
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

module.exports = {
  run
}