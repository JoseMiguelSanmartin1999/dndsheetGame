const fs = require('fs');
const tsFile = 'src/app/features/character-sheet/character-sheet.component.ts';
const content = fs.readFileSync(tsFile, 'utf8');

const regex = /template:\s*`([\s\S]*?)`\s*\n\}\)/m;
const match = content.match(regex);

if (match) {
  const newContent = content.replace(regex, 'templateUrl: \'./character-sheet.component.html\'\n})');
  fs.writeFileSync(tsFile, newContent);
  console.log('Template string replaced successfully.');
} else {
  console.log('Regex did not match.');
}
