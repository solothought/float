import fs from 'fs';
import path from 'path';

export function readFlows(dirPath, flowName, version){
    //TODO: support nested directory structure
    let flowFound = null;
    fs.readdirSync(dirPath).forEach(file => {
      if(!file.endsWith(".stflow")) return;
      const  filePath = path.resolve(dirPath,file);
      // console.log(`reading ${filePath}`);
      const flow = parseFlowFile(filePath, flowName, version);
      if(flow){
        flowFound = flow;
        return;
      }
    });
    return flowFound;
  }

/**
 * 
 * @param {string} filePath 
 * @returns {{name:string,headers:{},steps:[{id:number,text:string}]}}
 */
export function parseFlowFile(filePath, flowName, version) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const flowBlocks = content.split(/^FLOW:/m).filter(block => block.trim() !== '');
  
  for (let i = 0; i < flowBlocks.length; i++) {
    const block = flowBlocks[i];
    const lines = block.split('\n').filter(line => line !== '' && !line.startsWith('#'));
    if(lines.length < 2) continue;

    const name = lines[0].split('\n')[0].trim();
    let headers = {};
    let steps = [];
    let readingHeader = true;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if(readingHeader){
        const match = line.match(/^\s*(\w+)\s*:\s*(.+)\s*$/);
        if(match){
          headers[match[1]]=match[2];
        }else{
          readingHeader = false;
          readStep(steps, line)
        }
      }else{
        readStep(steps, line)
      }
    }
    if(!headers.version) headers.version = "0.0.1";
        
    const stepEntries = steps.map((step, index) => ({
      id: index,
      text: step
    }));
    
    if(name === flowName && headers.version === version) return {
      name,
      headers,
      steps: stepEntries
    }
  }
}

function readStep(steps, line){
  const trimmedLine = line.trim()
  if(trimmedLine.length === 0 || trimmedLine[0]=== "#") return;
  else steps.push(line);
}