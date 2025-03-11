import { Command } from 'commander';
import { parseFlowFile, readFlows } from './FlowsReader.js';
import { parseTemplate, parseLogLine } from './log-parser.js';
import { renderFlow } from './renderer.js';

const program = new Command();

program
  .name('float')
  .description('CLI tool to process flow logs')
  .option('-f, --file <path>', 'Path to the flow file')
  .option('-d, --directory <path>', 'Directory containing flow files')
  // .option('-u, --url <url>', 'URL to fetch flow content')
  // .option('--st <number>', 'Step threshold for highlighting', '5') // Long flag only
  .option('-t, --template <path>', 'Path to the template file (mandatory)')
  .parse(process.argv);

const options = program.opts();

// Function to read from stdin
function readStdin() {
  return new Promise((resolve, reject) => {
    let inputData = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      inputData += chunk;
    });
    process.stdin.on('end', () => {
      resolve(inputData.replace(/\n/,""));
    });
    process.stdin.on('error', err => {
      reject(err);
    });
  });
}

(async () => {
  try {
    // Read the log line from stdin
    const logLine = await readStdin();

    // Validation: Ensure at least one of -f, -u, or -d is provided
    if (!options.file && !options.directory && !options.url) {
      console.error('Error: You must provide one of -f, -u, or -d.');
      process.exit(1);
    }

    // Validation: Ensure -t (template file) is provided
    if (!options.template) {
      console.error('Error: Template file (-t) is required.');
      process.exit(1);
    }

    // Validation: Ensure a log line is provided via stdin
    if (!logLine) {
      console.error('Error: A log line must be provided via stdin.');
      process.exit(1);
    }

    const template = parseTemplate(options.template);
    const logData = parseLogLine(logLine, template);

    // Parse the flow file or directory
    let flow;
    if (options.file) {
      flow = parseFlowFile(options.file, logData.NAME, logData.VERSION);
    } else if (options.directory) {
      // Implement directory parsing logic here if needed
      flow = readFlows(options.directory, logData.NAME, logData.VERSION)
    } else if (options.url) {
      // Implement URL fetching logic here if needed
      console.error('URL fetching is not implemented yet.');
      process.exit(1);
    }

    if (!flow) {
      console.error('Error: No matching flow found in the provided flow file.');
      process.exit(1);
    }

    // Render the output
    const threshold = parseInt(options.stepThreshold, 10);
    const output = renderFlow(flow, logData, threshold);
    console.log(output);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();