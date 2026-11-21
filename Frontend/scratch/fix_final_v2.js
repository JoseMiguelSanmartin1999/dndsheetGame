const fs = require('fs');
const path = 'src/app/features/character-sheet/character-sheet.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split(/\r?\n/);

const classIdx = lines.findIndex(l => l.includes('export class CharacterSheetComponent'));

const newTsLines = [
  ...lines.slice(0, 10), // Exclude the opening backtick
  '  templateUrl: \'./character-sheet.component.html\',',
  '  styleUrl: \'./character-sheet.component.css\'',
  '})',
  ...lines.slice(classIdx)
];

const helperMethods = `
  // Helper Methods for HTML Template
  isProficient(skillName: string): boolean {
    return false; // Placeholder until skills are fully integrated
  }

  getHpPercentage(): number {
    if (!this.character || !(this.character as any).maxHp) return 100;
    return Math.max(0, Math.min(100, ((this.character as any).currentHp / (this.character as any).maxHp) * 100));
  }

  modifyHp(amount: number): void {
    if (this.character) {
      const charAny = this.character as any;
      charAny.currentHp = Math.max(0, Math.min(charAny.maxHp || 0, (charAny.currentHp || 0) + amount));
    }
  }

  toggleInspiration(): void {
    if (this.character) {
      (this.character as any).inspiration = !(this.character as any).inspiration;
    }
  }

  openAcManager(): void {}
  openHpManager(): void {}
`;

newTsLines.splice(14, 0, helperMethods); // Inject right after the class declaration
fs.writeFileSync(path, newTsLines.join('\n'), 'utf8');

// Modify the character service interface
const charServicePath = 'src/app/data/services/character.service.ts';
if (fs.existsSync(charServicePath)) {
  let charServiceContent = fs.readFileSync(charServicePath, 'utf8');
  // Avoid duplicating properties if already there, but they weren't
  if (!charServiceContent.includes('maxHp?: number')) {
    charServiceContent = charServiceContent.replace(
      'export interface Character {',
      'export interface Character {\n  maxHp?: number;\n  currentHp?: number;\n  inspiration?: boolean;'
    );
    fs.writeFileSync(charServicePath, charServiceContent, 'utf8');
  }
}

console.log('Script completed. TS file and Character interface updated.');
