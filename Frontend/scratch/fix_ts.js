const fs = require('fs');
const tsFile = 'src/app/features/character-sheet/character-sheet.component.ts';
const content = fs.readFileSync(tsFile, 'utf8');
const lines = content.split('\n');

const startIdx = lines.findIndex(l => l.includes('template: `'));
const classIdx = lines.findIndex(l => l.includes('export class CharacterSheetComponent'));

let endIdx = classIdx - 1;
while (endIdx > startIdx && !lines[endIdx].includes('`')) {
  endIdx--;
}

// Extract template
const templateLines = lines.slice(startIdx + 1, endIdx);
const lastLineBeforeBacktick = lines[endIdx].replace(/`.*$/, '');
if (lastLineBeforeBacktick.trim()) {
  templateLines.push(lastLineBeforeBacktick);
}
fs.writeFileSync('src/app/features/character-sheet/character-sheet.component.html', templateLines.join('\n'));

// Generate the new TS lines
const newTsLines = [
  ...lines.slice(0, startIdx),
  '  templateUrl: \'./character-sheet.component.html\'',
  '})',
  ...lines.slice(classIdx)
];

// Add ngOnInit and loadCharacter right after the usedSpellSlots property
const spellSlotIdx = newTsLines.findIndex(l => l.includes('usedSpellSlots:'));
if (spellSlotIdx !== -1) {
  const methods = `
  ngOnInit(): void {
    this.addLog('ngOnInit iniciado.');
    this.route.paramMap.subscribe({
      next: (params) => {
        const id = params.get('id');
        this.addLog(\`ID del observable paramMap: \${id}\`);
        if (id) {
          this.loadCharacter(id);
        } else {
          this.addLog('ADVERTENCIA: ¡No se encontró ID en los parámetros de ruta!');
        }
      }
    });
  }

  addLog(msg: string): void {
    console.log(msg);
  }

  loadCharacter(id: string): void {
    this.loading = true;
    this.errorLoading = false;
    this.characterService.getCharacters('6a6cf7478027ecfa23f8539f').subscribe({
      next: (chars) => {
        const found = chars.find(c => c.id === id);
        if (found) {
          this.character = found;
          this.loading = false;
          this.addLog(\`Personaje cargado con éxito: \${found.name}\`);
        } else {
          this.errorLoading = true;
          this.loading = false;
          this.addLog(\`Error: Personaje no encontrado con id \${id}\`);
        }
      },
      error: (err) => {
        this.errorLoading = true;
        this.loading = false;
        this.addLog(\`Error cargando personaje: \${err.message}\`);
      }
    });
  }`.split('\n');
  
  newTsLines.splice(spellSlotIdx + 1, 0, ...methods);
}

fs.writeFileSync(tsFile, newTsLines.join('\n'));
console.log('TS file updated perfectly.');
