const fs = require('fs');
const path = 'src/app/features/character-sheet/character-sheet.component.ts';
// Read it correctly.
const content = fs.readFileSync(path, 'utf16le');
// Remove BOM if present
const cleanContent = content.replace(/^\uFEFF/, '');
const lines = cleanContent.split(/\r?\n/);

const classIdx = lines.findIndex(l => l.includes('export class CharacterSheetComponent'));

const newTsLines = [
  ...lines.slice(0, 11),
  '  templateUrl: \'./character-sheet.component.html\',',
  '  styleUrl: \'./character-sheet.component.css\'',
  '})',
  ...lines.slice(classIdx)
];

const helperMethods = `
  // Helper Methods for HTML Template
  getProficiencyBonus(): number {
    if (!this.character) return 2;
    return Math.ceil((this.character.level || 1) / 4) + 1;
  }

  getCalculatedArmorClass(): number {
    if (!this.character) return 10;
    const dex = this.getModifierNumber(this.character.stats?.dexterity);
    return 10 + dex;
  }

  getModifierNumber(stat: number | string | undefined): number {
    if (stat === undefined) return 0;
    const val = typeof stat === 'string' ? parseInt(stat, 10) : stat;
    return Math.floor(((val || 10) - 10) / 2);
  }

  getModifier(stat: number | string | undefined): number {
    return this.getModifierNumber(stat);
  }

  getClassHitDie(): number {
    if (!this.character || !this.character.class) return 8;
    const cls = this.character.class.toLowerCase();
    if (cls.includes('bárbaro')) return 12;
    if (cls.includes('guerrero') || cls.includes('paladín') || cls.includes('explorador')) return 10;
    if (cls.includes('mago') || cls.includes('hechicero')) return 6;
    return 8;
  }

  isProficient(skillName: string): boolean {
    return false; // Placeholder until skills are fully integrated
  }

  getHpPercentage(): number {
    if (!this.character || !this.character.maxHp) return 100;
    return Math.max(0, Math.min(100, (this.character.currentHp / this.character.maxHp) * 100));
  }

  modifyHp(amount: number): void {
    if (this.character) {
      this.character.currentHp = Math.max(0, Math.min(this.character.maxHp, (this.character.currentHp || 0) + amount));
    }
  }

  toggleInspiration(): void {
    if (this.character) {
      this.character.inspiration = !this.character.inspiration;
    }
  }

  openAcManager(): void {}
  openHpManager(): void {}
`;

newTsLines.splice(15, 0, helperMethods);

fs.writeFileSync(path, newTsLines.join('\n'), 'utf8');
console.log('TS file perfectly rewritten and converted to UTF-8.');
