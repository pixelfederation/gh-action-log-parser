const core = require('@actions/core')
const fs = require('fs')
const readline = require('readline')

// Assuming patterns.json is placed in the same directory, or adjust accordingly
const patterns = JSON.parse(fs.readFileSync('./patterns.json', 'utf8')).map(
  pattern => ({
    ...pattern,
    regex: new RegExp(pattern.regex)
  })
)

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

// Get inputs
const filePath = core.getInput('file-path')
const showLines = core.getInput('show-lines') // Use this variable as needed in your logic

checkFile(filePath)
