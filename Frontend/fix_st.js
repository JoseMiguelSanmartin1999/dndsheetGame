const fs = require('fs');
const tsPath = 'src/app/features/character-sheet/character-sheet.component.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

const newMethods = `
  hasSavingThrowProficiency(statKey: string): boolean {
    if (!this.character || !this.character.class) return false;
    const cls = this.character.class.toLowerCase();
    const proficiencies: Record<string, string[]> = {
      'bárbaro': ['strength', 'constitution'], 'barbaro': ['strength', 'constitution'],
      'bardo': ['dexterity', 'charisma'], 'clérigo': ['wisdom', 'charisma'], 'clerigo': ['wisdom', 'charisma'],
      'druida': ['intelligence', 'wisdom'], 'guerrero': ['strength', 'constitution'], 'monje': ['strength', 'dexterity'],
      'paladín': ['wisdom', 'charisma'], 'paladin': ['wisdom', 'charisma'], 'explorador': ['strength', 'dexterity'],
      'pícaro': ['dexterity', 'intelligence'], 'picaro': ['dexterity', 'intelligence'], 'hechicero': ['constitution', 'charisma'],
      'brujo': ['wisdom', 'charisma'], 'mago': ['intelligence', 'wisdom'], 'fighter': ['strength', 'constitution'],
      'wizard': ['intelligence', 'wisdom'], 'rogue': ['dexterity', 'intelligence'], 'cleric': ['wisdom', 'charisma']
    };
    const profs = proficiencies[cls] || [];
    const explicit = (this.character as any).savingThrowProficiencies || [];
    return profs.includes(statKey) || explicit.includes(statKey);
  }

  getSavingThrow(statKey: string): string {
    let modVal = this.getFinalModifierValue(statKey);
    if (this.hasSavingThrowProficiency(statKey)) {
      modVal += this.getProficiencyBonus();
    }
    return modVal >= 0 ? '+' + modVal : '' + modVal;
  }
`;

tsContent = tsContent.replace('export class CharacterSheetComponent implements OnInit {', 'export class CharacterSheetComponent implements OnInit {' + newMethods);
fs.writeFileSync(tsPath, tsContent, 'utf8');

const htmlPath = 'src/app/features/character-sheet/character-sheet.component.html';
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

const statsMap = {
  'strength': 'FUERZA',
  'dexterity': 'DESTREZA',
  'constitution': 'CONSTITUCION',
  'intelligence': 'INTELIGENCIA',
  'wisdom': 'SABIDURIA',
  'charisma': 'CARISMA'
};

for (const stat in statsMap) {
  const label = statsMap[stat];
  // Replace the exact div after the comment
  const searchStr = `<!-- ${label} -->\n                <div class="bg-[#121215] border border-neutral-700 rounded-2xl flex flex-col items-center pt-3 pb-8 relative shadow-inner">`;
  const replaceStr = `<!-- ${label} -->
                <div class="bg-[#121215] border border-neutral-700 rounded-2xl flex flex-col items-center pt-3 pb-8 relative shadow-inner">
                   <div class="absolute top-2 right-2 flex items-center gap-1 bg-black/40 px-1 py-0.5 rounded border border-neutral-800 shadow-sm" title="Tirada de Salvación">
                     <div class="w-1.5 h-1.5 rounded-full" [ngClass]="hasSavingThrowProficiency('${stat}') ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]' : 'bg-neutral-700'"></div>
                     <span class="text-[8px] font-mono" [ngClass]="hasSavingThrowProficiency('${stat}') ? 'text-amber-100' : 'text-neutral-500'">{{ getSavingThrow('${stat}') }}</span>
                   </div>`;
                   
  htmlContent = htmlContent.replace(searchStr, replaceStr);
}

fs.writeFileSync(htmlPath, htmlContent, 'utf8');
console.log('Added Saving Throws!');
