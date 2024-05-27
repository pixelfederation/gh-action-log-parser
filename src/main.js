const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function loadPatterns(logType) {
  // Construct the file path using the patterns subdirectory and logType
  const patternsPath = path.join(__dirname, 'patterns', `${logType}.json`);

  try {
    const patternsData = fs.readFileSync(patternsPath, 'utf8');
    return JSON.parse(patternsData).map(pattern => ({
      ...pattern,
      regex: new RegExp(pattern.regex),
    }));
  } catch (error) {
    core.setFailed(`Failed to load patterns file for logType '${logType}': ${error.message}`);
    return []; // Return an empty array to prevent further execution
  }
}

async function checkFile(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath)
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    })

    let lineNumber = 0

    for await (const line of rl) {
      lineNumber++
      // Simplified logic for demonstration
      patterns.forEach(pattern => {
        if (pattern.regex.test(line)) {
          console.log(`Line ${lineNumber}: ${pattern.result}`)
          // Use core.setOutput if you need to pass this information to other steps
        }
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

async function run() {
  const filePath = core.getInput('file-path');
  const logType = core.getInput('log-type'); // Get the log type input
  const patterns = await loadPatterns(logType); // Load patterns based on logType

  if (patterns.length > 0) {
    await checkFile(filePath, patterns);
  }
}

run().catch(err => core.setFailed(err.message));
