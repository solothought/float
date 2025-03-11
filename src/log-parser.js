import fs from 'fs';

/**
 * Parse the template file into an array of tokens.
 */
export function parseTemplate(templatePath) {
  try {
    const content = fs.readFileSync(templatePath, 'utf-8').trim();
    if (!content) {
      throw new Error('Template file is empty.');
    }
    // return content.split(/\s+/); // Split by whitespace
    return content; // Split by whitespace
  } catch (err) {
    throw new Error(`Error reading template file: ${err.message}`);
  }
}

/**
 * Generate a regex pattern from the template.
 */
function generateRegexFromTemplate(template) {
  // Define attribute-specific regex patterns for all attributes
  const attributePatterns = {
    NAME: '\\[(.*?)\\]', // Any characters (non-greedy)
    HEAD_MSG: '\\[(.*?)\\]', // Any characters (non-greedy)
    VERSION: '(\\S+)', // Any characters (non-greedy)
    TIME: '\\[(.*?)\\]', // Anything inside brackets
    STEPS: '((?:\\d+:\\d+)(?:>(?:\\d+:\\d+))*)', // Sequence of id:time pairs
    DURATION: '(\\d+)', // Numeric value (optional)
    STATUS: '(1|0)', // Numeric value (optional)
    PARENT_ID: '(\\d*)', // Numeric value (optional)
    PARENT_STEP_ID: '(\\d*)', // Numeric value (optional)
    ERR_MSG: '(\\[(.*?)\\])?', // Anything inside optional brackets
    TYPE: '(HEAD|FLOW|DEBUG|WARN|TRACE|ERROR|FATAL)', // Any characters (non-greedy)
    ID: '(\\S+)', // non-space
  };

  // Replace each attribute in the template with its corresponding regex pattern
  const regexPattern = template.replace(/%(\w+)%/g, (_, key) => {
    if (!attributePatterns[key]) {
      throw new Error(`Unsupported attribute in template: %${key}%`);
    }
    return attributePatterns[key];
  });

  // Wrap the pattern with ^ and $ to ensure full-line matching
  return new RegExp(`^${regexPattern}$`);
}

/**
 * Parse the log line using the template.
 */
export function parseLogLine(logLine, template) {
  if (!logLine || typeof logLine !== 'string') {
    throw new Error('Invalid log line provided.');
  }

  // Generate the regex from the template
  const regex = generateRegexFromTemplate(template);

  // Match the log line against the regex
  const match = logLine.match(regex);
  if (!match) {
    throw new Error('Log line does not match the template.');
  }

  // Extract keys from the template
  const keys = [...template.matchAll(/%(\w+)%/g)].map(match => match[1]);

  // Map captured groups to their respective keys
  const logData = {};
  keys.forEach((key, index) => {
    let value = match[index + 1]?.trim() || ''; // Extract the captured group

    // Post-process values
    if (key === 'STEPS') {
      // Parse steps into an array of objects
      logData[key] = value.split('>').map(step => {
        const [id, time] = step.split(':');
        return { id: parseInt(id, 10), time: parseInt(time, 10) };
      });
    } else if (['DURATION', 'STATUS', 'PARENT_ID', 'PARENT_STEP_ID'].includes(key)) {
      // Convert numeric fields to numbers (empty values become null)
      logData[key] = value ? parseInt(value, 10) : null;
    } else if (['TIME', 'NAME', 'ERR_MSG'].includes(key)) {
      // Remove surrounding brackets for bracketed attributes
      logData[key] = value.startsWith('[') && value.endsWith(']')
        ? value.slice(1, -1).trim()
        : value;
    } else {
      // Use the value as-is for other attributes
      logData[key] = value;
    }
  });

  return logData;
}