// renderer.js
import chalk from 'chalk';

export function renderFlow(flow, logData, threshold) {
  const stepTimes = new Map();
  for (const step of logData.STEPS) {
    stepTimes.set(step.id, step.time);
  }
  
  let output = '\n\n';
  let flowN = chalk.yellow.bold(`FLOW: ${flow.name} ${logData.STATUS ? '✅' : '❌'} `);
  output += `${formatTime(logData.DURATION, threshold)} ${flowN}\n`;
  for(const header of Object.keys(flow.headers)){
    output += `      ${header}:${flow.headers[header]}\n`;
  }
  for (const step of flow.steps) {
    const time = stepTimes.get(step.id) || 0;
    const isExecuted = stepTimes.has(step.id);
    const timeColor = time > threshold ? chalk.yellow : chalk.white;
    const stepText = isExecuted ? chalk.green(step.text) : chalk.gray(step.text);
    
    output += `${timeColor(time.toString().padStart(5))} ${stepText}\n`;
  }
  
  return output;
}

function formatTime(time, threshold) {
  return chalk.cyan(time.toString().padStart(5));
}

