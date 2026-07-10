const fs = require('fs');
const path = require('path');

function replaceConsoleError(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceConsoleError(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('console.error(')) {
        content = content.replace(/console\.error\(/g, 'console.log(');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

replaceConsoleError('d:/Ment-X/mobile/src/screens');
