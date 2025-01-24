import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Convert __dirname to ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/// Input file path
const inputFilePath = path.join(__dirname, 'data.txt');
// Output file path
const outputFilePath = path.join(__dirname, 'data.json');

// Read the input file
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Split the raw text into separate objects
  const entries = data
    .trim()
    .split('\n')
    .filter((line) => line.trim().length > 0) // Filter out empty lines
    .map((line) => {
      // Convert each block to a JSON object
      const cleanedLine = line
        .trim()
        .replace(/^{|}$/g, '') // Remove leading/trailing curly braces
        .split(',') // Split key-value pairs
        .reduce((obj, pair) => {
          const [key, value] = pair.split(':').map((item) => item.trim());
          if (key && value) {
            obj[key] = value.replace(/^'|'$/g, ''); // Remove single quotes
          }
          return obj;
        }, {});

      // Only include objects with both "name" and "alts"
      return cleanedLine.name && cleanedLine.alts ? cleanedLine : null;
    })
    .filter((item) => item !== null); // Remove null entries

  // Write the JSON to an output file
  fs.writeFile(outputFilePath, JSON.stringify(entries, null, 2), (err) => {
    if (err) {
      console.error('Error writing the JSON file:', err);
    } else {
      console.log(`JSON file created successfully at ${outputFilePath}`);
    }
  });
});
