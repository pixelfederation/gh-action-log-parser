const fs = require('fs');
const readline = require('readline');

// Read patterns from an external JSON file
const patterns = JSON.parse(fs.readFileSync('patterns.json', 'utf8')).map(pattern => ({
  ...pattern,
  regex: new RegExp(pattern.regex) // Convert string back to RegExp
}));

// Determine the maximum number of lines to show based on patterns
const maxLinesToShow = Math.max(...patterns.map(p => p.showLine), 1); // Ensure at least 1

const filePath = process.argv[2];
let globalShowLineSetting = process.argv.find(arg => arg.startsWith('--show-lines='));
globalShowLineSetting = globalShowLineSetting ? globalShowLineSetting.split('=')[1] : 'default';

if (!filePath) {
  console.error('Please provide a file path.');
  process.exit(1);
}

const shouldShowLine = (patternShowLine) => {
  switch (globalShowLineSetting) {
    case 'all':
      return Math.max(patternShowLine, 1); // Treat 0 as 1 when global setting is 'all'
    case 'none':
      return 0; // Override to show no lines
    case 'default':
    default:
      return patternShowLine;
  }
};

const processFile = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let buffer = []; // Buffer to hold lines for context
  let lineNumber = 0;

  for await (const line of rl) {
    lineNumber++;
    buffer.push(line); // Add current line to buffer

    // Check buffer against patterns
    patterns.forEach(pattern => {
      if (pattern.regex.test(buffer[0])) { // Check the first line in the buffer
        const numLinesToShow = shouldShowLine(pattern.showLine);
        let output = `Line ${lineNumber}: ${pattern.result}`;
        if (numLinesToShow > 0) {
          output += `\nLines:\n"${buffer.slice(0, numLinesToShow).join('"\n"')}"\n`;
        }
        console.log(output);
        console.log(); // Add a blank line after each pattern output
      }
    });

    // Manage buffer size
    if (buffer.length > maxLinesToShow) {
      buffer.shift(); // Remove the oldest line
    }
  }

  // Handle patterns that might match the last lines in the file
  while (buffer.length > 0) {
    patterns.forEach(pattern => {
      if (pattern.regex.test(buffer[0])) {
        const numLinesToShow = shouldShowLine(pattern.showLine);
        let output = `Line ${lineNumber - buffer.length + 1}: ${pattern.result}`;
        if (numLinesToShow > 0) {
          output += `\nLines:\n"${buffer.slice(0, numLinesToShow).join('"\n"')}"\n`;
        }
        console.log(output);
        console.log(); // Add a blank line after each pattern output
      }
    });
    buffer.shift(); // Remove the oldest line and check again
  }
};

processFile(filePath).catch(err => {
  console.error(err);
});
