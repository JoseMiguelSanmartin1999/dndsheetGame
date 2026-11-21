const fs = require('fs');
const lines = fs.readFileSync('c:/Users/VICTUS/Documents/D&D/dndsheetGame/Frontend/src/app/features/character-sheet/character-sheet.component.html', 'utf-8').split('\n');
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('weapon')) {
    console.log(i + 1 + ': ' + line.trim());
  }
});
