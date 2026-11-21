const fs = require('fs');
const tsFile = 'src/app/features/character-sheet/character-sheet.component.ts';
const content = fs.readFileSync(tsFile, 'utf8');
const lines = content.split('\n');

const classIdx = lines.findIndex(l => l.includes('export class CharacterSheetComponent'));

const newTsLines = [
  ...lines.slice(0, 7),
  '@Component({',
  '  selector: \'app-character-sheet\',',
  '  standalone: true,',
  '  imports: [CommonModule, RouterModule, FormsModule],',
  '  templateUrl: \'./character-sheet.component.html\',',
  '  styleUrl: \'./character-sheet.component.css\'',
  '})',
  ...lines.slice(classIdx)
];

fs.writeFileSync(tsFile, newTsLines.join('\n'));
fs.writeFileSync('src/app/features/character-sheet/character-sheet.component.html', '<div class="wireframe-container">Cargando Wireframe...</div>');
fs.writeFileSync('src/app/features/character-sheet/character-sheet.component.css', '');
console.log('TS file cleaned up successfully.');
