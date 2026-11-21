#!/usr/bin/env node
/**
 * Extrae el contenido de juego que hoy está escrito a mano dentro del código
 * (componentes de Angular y el seeder de Mongo) y lo guarda como JSON en
 * Backend/content/legacy/. Es un paso de migración de una sola vez: a partir de
 * aquí el contenido vive en PostgreSQL y se edita desde el panel de admin.
 *
 * Uso: node Backend/scripts/extract-legacy-content.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'Backend', 'content', 'legacy');
mkdirSync(outDir, { recursive: true });

const FILES = {
  creator: 'Frontend/src/app/features/character-creator/character-creator.component.ts',
  sheet: 'Frontend/src/app/features/character-sheet/character-sheet.component.ts',
  seeder: 'Backend/src/infrastructure/persistence/game-data.seeder.ts',
};

/** Devuelve el literal ([...] o {...}) que empieza en `start`, respetando strings y comentarios. */
function readLiteral(src, start) {
  const open = src[start];
  const close = open === '[' ? ']' : '}';
  const stack = [close];
  let i = start + 1;
  while (i < src.length && stack.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === '/' && n === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"') {
      i++;
      while (src[i] !== c) { if (src[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (c === '`') {
      i++;
      while (src[i] !== '`') {
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '$' && src[i + 1] === '{') {
          const end = readLiteral(src, i + 1);
          i = end; continue;
        }
        i++;
      }
      i++; continue;
    }
    if (c === '[' || c === '{') stack.push(c === '[' ? ']' : '}');
    else if (c === ']' || c === '}') {
      if (stack.pop() !== c) throw new Error(`Corchete inesperado en ${i}`);
    }
    i++;
  }
  return i; // índice justo después del cierre
}

/** Busca `nombre ... = [` o `nombre ... = {` y evalúa el literal. */
function extract(src, name, file) {
  const re = new RegExp(`(?:^|[\\s;])(?:const\\s+)?${name}\\s*(?::[^=\\n]+)?=\\s*([\\[{])`, 'm');
  const m = re.exec(src);
  if (!m) throw new Error(`No encontré "${name}" en ${file}`);
  const start = m.index + m[0].length - 1;
  const end = readLiteral(src, start);
  const text = src.slice(start, end);
  try {
    return new Function(`return (${text});`)();
  } catch (e) {
    throw new Error(`No pude evaluar "${name}" en ${file}: ${e.message}`);
  }
}

/**
 * Para funciones con cadenas de `if (x.includes('clave')) { return LITERAL; }`
 * devuelve { clave: literal }. Toma la primera clave de cada condición.
 */
function extractIfChain(src, fnName, file) {
  // La firma puede tener un tipo de retorno con llaves: el cuerpo empieza en la última `{` de la línea.
  const m = new RegExp(`\\n\\s*${fnName}\\([^)]*\\)[^\\n]*\\{[ \\t]*\\n`).exec(src);
  if (!m) throw new Error(`No encontré la función "${fnName}" en ${file}`);
  const bodyStart = m.index + m[0].lastIndexOf('{');
  const body = src.slice(bodyStart, readLiteral(src, bodyStart));
  const out = {};
  const re = /if\s*\(([^)]*?includes\('([^']+)'\)[^{]*)\{\s*return\s*([\[{])/g;
  let r;
  while ((r = re.exec(body))) {
    const start = r.index + r[0].length - 1;
    const end = readLiteral(body, start);
    out[r[2]] = new Function(`return (${body.slice(start, end)});`)();
    re.lastIndex = end;
  }
  return out;
}

const src = Object.fromEntries(
  Object.entries(FILES).map(([k, f]) => [k, readFileSync(join(root, f), 'utf8')]),
);

const groups = {
  // Seeder (lo que hoy está en Mongo)
  'classes.json': ['seeder', ['classes']],
  'backgrounds.json': ['seeder', ['backgrounds']],
  'origins.json': ['seeder', ['origins']],
  'races.json': ['seeder', ['races']],
  // Creador de personajes
  'equipment-packs.json': ['creator', ['DND_PACKAGES']],
  'spell-lists.json': ['creator', [
    'paladinSpellsList', 'magoCantripsList', 'magoSpellsList', 'bardCantripsList', 'bardSpellsList',
    'warlockCantripsList', 'warlockSpellsList', 'clericCantripsList', 'clericSpellsList',
    'druidCantripsList', 'druidSpellsList', 'sorcererSpellsList', 'eldritchKnightCantripsList',
    'eldritchKnightSpellsList', 'rangerSpellsList',
  ]],
  'class-options.json': ['creator', ['warlockInvocationsList', 'sorcererMetamagicList']],
  'lineages.json': ['creator', [
    'elvenLineages', 'dragonLineages', 'gnomeLineages', 'goliathLineages', 'tieflingLineages', 'aasimarLineages',
  ]],
  'misc.json': ['creator', ['pointBuyCosts', 'allSkillsList', 'allToolsList', 'guideTabs']],
  // Hoja de personaje
  'class-progression.json': ['sheet', [
    'MONK_PROGRESS_MAP', 'BARBARIAN_PROGRESS_MAP', 'SORCERER_PROGRESS_MAP', 'FIGHTER_PROGRESS_MAP',
    'BARD_PROGRESS_MAP', 'WARLOCK_PROGRESS_MAP', 'CLERIC_PROGRESS_MAP', 'DRUID_PROGRESS_MAP',
    'RANGER_PROGRESS_MAP', 'PALADIN_PROGRESS_MAP', 'ROGUE_PROGRESS_MAP',
  ]],
  'descriptions.json': ['sheet', ['FEATURE_DESCRIPTIONS_MAP', 'SPELL_DESCRIPTIONS_MAP', 'METAMAGIC_DESCRIPTIONS_MAP']],
};

const summary = [];
for (const [out, [fileKey, names]] of Object.entries(groups)) {
  const data = {};
  for (const name of names) {
    data[name] = extract(src[fileKey], name, FILES[fileKey]);
    const v = data[name];
    summary.push(`${out.padEnd(24)} ${name.padEnd(30)} ${Array.isArray(v) ? v.length : Object.keys(v).length}`);
  }
  const payload = names.length === 1 ? data[names[0]] : data;
  writeFileSync(join(outDir, out), JSON.stringify(payload, null, 2) + '\n');
}
const chains = {
  'subclasses.json': ['sheet', 'getSubclassesForClass'],
  'feats.json': ['creator', 'getFeatInfo'],
  'species-traits.json': ['creator', 'getOriginManualAttributes'],
};
for (const [out, [fileKey, fn]] of Object.entries(chains)) {
  const data = extractIfChain(src[fileKey], fn, FILES[fileKey]);
  summary.push(`${out.padEnd(24)} ${fn.padEnd(30)} ${Object.keys(data).length}`);
  writeFileSync(join(outDir, out), JSON.stringify(data, null, 2) + '\n');
}
console.log(summary.join('\n'));
