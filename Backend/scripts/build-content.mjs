#!/usr/bin/env node
/**
 * Convierte el contenido extraído (content/legacy) en datos normalizados
 * (content/data) listos para cargarse en PostgreSQL con `npm run db:seed`.
 *
 * - Asigna un slug estable a cada elemento (la clave que usa la BD).
 * - Marca el origen: SRD_5_2_1 o HOMEBREW (según content/srd-classification.json).
 * - Renombra lo que no está en el SRD y lo marca con needsRewrite = true.
 *
 * Uso: node Backend/scripts/build-content.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const legacy = (f) => JSON.parse(readFileSync(join(contentDir, 'legacy', f), 'utf8'));
const cls = JSON.parse(readFileSync(join(contentDir, 'srd-classification.json'), 'utf8'));
const outDir = join(contentDir, 'data');
mkdirSync(outDir, { recursive: true });

const SRD = 'SRD_5_2_1';
const HOMEBREW = 'HOMEBREW';
const warnings = [];

export const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => slugify(s).replace(/-/g, ' ');

/** Devuelve { name, source, needsRewrite, legacyNames } según la clasificación. */
function classify(group, legacyName) {
  const { srd, renamed } = cls[group];
  if (srd.some((n) => norm(n) === norm(legacyName))) {
    return { name: legacyName, source: SRD, needsRewrite: false, legacyNames: [legacyName] };
  }
  const r = renamed.find((x) => norm(x.from) === norm(legacyName));
  if (r) return { name: r.to, source: HOMEBREW, needsRewrite: true, legacyNames: [legacyName] };
  warnings.push(`[${group}] "${legacyName}" no está clasificado: se marca como HOMEBREW sin renombrar`);
  return { name: legacyName, source: HOMEBREW, needsRewrite: true, legacyNames: [legacyName] };
}

const ABILITIES = { fuerza: 'STR', destreza: 'DEX', constitucion: 'CON', inteligencia: 'INT', sabiduria: 'WIS', carisma: 'CHA' };
const LEGACY_ABILITY = { FUE: 'STR', DES: 'DEX', CON: 'CON', INT: 'INT', SAB: 'WIS', CAR: 'CHA' };
const SCHOOLS = {
  abjuracion: 'ABJURATION', adivinacion: 'DIVINATION', conjuracion: 'CONJURATION', encantamiento: 'ENCHANTMENT',
  evocacion: 'EVOCATION', ilusionismo: 'ILLUSION', nigromancia: 'NECROMANCY', transmutacion: 'TRANSMUTATION',
};
const splitList = (s) => (s || '').split(/,| y | o /).map((x) => x.trim()).filter(Boolean);
const write = (file, data) => writeFileSync(join(outDir, file), JSON.stringify(data, null, 2) + '\n');

// ---------- Clases ----------
const classSlug = (name) => {
  const slug = cls.classes[name];
  if (!slug) throw new Error(`Clase sin slug: ${name}`);
  return slug;
};
const classes = legacy('classes.json').map((c, i) => ({
  slug: classSlug(c.name),
  name: c.name,
  source: SRD,
  needsRewrite: false,
  hitDie: Number(c.hitDie.replace('d', '')),
  primaryAbilities: splitList(c.primaryStat).map((a) => ABILITIES[norm(a)] ?? a),
  complexity: c.complexity,
  playstyle: c.preference,
  tagline: c.quote,
  description: c.description,
  icon: c.icon,
  image: c.image,
  sortOrder: i,
  // Forma original, para la API compatible con el frontend actual.
  legacy: c,
}));
write('classes.json', classes);

// ---------- Rasgos de clase por nivel ----------
const PROGRESSION_KEYS = {
  MONK_PROGRESS_MAP: 'monk', BARBARIAN_PROGRESS_MAP: 'barbarian', SORCERER_PROGRESS_MAP: 'sorcerer',
  FIGHTER_PROGRESS_MAP: 'fighter', BARD_PROGRESS_MAP: 'bard', WARLOCK_PROGRESS_MAP: 'warlock',
  CLERIC_PROGRESS_MAP: 'cleric', DRUID_PROGRESS_MAP: 'druid', RANGER_PROGRESS_MAP: 'ranger',
  PALADIN_PROGRESS_MAP: 'paladin', ROGUE_PROGRESS_MAP: 'rogue',
};
const progression = legacy('class-progression.json');
const featureDescs = legacy('descriptions.json').FEATURE_DESCRIPTIONS_MAP;
const classFeatures = [];
for (const [key, classSlugValue] of Object.entries(PROGRESSION_KEYS)) {
  for (const [level, { features }] of Object.entries(progression[key])) {
    features.forEach((name, order) => {
      classFeatures.push({
        classSlug: classSlugValue,
        level: Number(level),
        sortOrder: order,
        slug: `${classSlugValue}-${level}-${slugify(name)}`,
        name,
        description: featureDescs[name] ?? null,
        // Marcadores genéricos ("Subclase de X", "Rasgo de subclase") los resuelve el motor de reglas.
        isSubclassPlaceholder: /subclase/i.test(name),
      });
    });
  }
}
const withoutProgression = classes.filter((c) => !classFeatures.some((f) => f.classSlug === c.slug));
withoutProgression.forEach((c) => warnings.push(`[class-features] ${c.name} no tiene progresión por nivel en el código actual`));
write('class-features.json', classFeatures);

// ---------- Subclases ----------
const SUBCLASS_CLASS_KEYS = {
  hechicero: 'sorcerer', 'bárbaro': 'barbarian', bardo: 'bard', brujo: 'warlock', 'clérigo': 'cleric',
  druida: 'druid', explorador: 'ranger', guerrero: 'fighter', mago: 'wizard', 'paladín': 'paladin',
  monje: 'monk', 'pícaro': 'rogue',
};
const subclasses = [];
for (const [key, names] of Object.entries(legacy('subclasses.json'))) {
  const classSlugValue = SUBCLASS_CLASS_KEYS[key];
  const variants = {};
  for (const legacyName of names) {
    const m = legacyName.match(/^(.*?)\s*\((.+)\)$/); // "Círculo de la Tierra (Árido)" → variante
    if (m) (variants[m[1]] ??= []).push({ name: m[2], legacyName });
    else variants[legacyName] ??= [];
  }
  for (const [baseName, vars] of Object.entries(variants)) {
    const c = classify('subclasses', baseName);
    subclasses.push({
      slug: `${classSlugValue}-${slugify(c.name)}`,
      classSlug: classSlugValue,
      ...c,
      legacyNames: [baseName, ...vars.map((v) => v.legacyName)],
      variants: vars.map((v) => ({ slug: slugify(v.name), name: v.name })),
    });
  }
}
write('subclasses.json', subclasses);
const subclassByLegacy = (legacyName) => subclasses.find((s) => s.legacyNames.includes(legacyName));

// ---------- Dotes ----------
const FEAT_ALIASES = {
  'magic initiate': 'Iniciado en la Magia', skilled: 'Habilidoso', healer: 'Sanador', crafter: 'Fabricante',
  lucky: 'Afortunado', alert: 'Alerta', tough: 'Duro', musician: 'Músico', 'tavern brawler': 'Matón de Taberna',
  'savage attacker': 'Atacante Salvaje',
};
const feats = Object.values(legacy('feats.json')).map((f) => {
  const c = classify('feats', f.title);
  return {
    slug: slugify(c.name),
    ...c,
    category: 'ORIGIN',
    benefits: f.benefits,
  };
});
write('feats.json', feats);
function featForBackground(keyFeat) {
  const text = norm(keyFeat);
  const legacyName = feats.flatMap((f) => f.legacyNames).find((n) => text.includes(norm(n)))
    ?? Object.entries(FEAT_ALIASES).find(([alias]) => text.includes(alias))?.[1];
  const feat = feats.find((f) => f.legacyNames.some((n) => norm(n) === norm(legacyName ?? '')));
  if (!feat) warnings.push(`[backgrounds] no encontré la dote "${keyFeat}"`);
  const option = keyFeat.match(/\((clérigo|clerigo|mago|druida)\)/i)?.[1];
  return { featSlug: feat?.slug ?? null, featOption: option ? classSlug(option === 'clerigo' ? 'Clérigo' : option[0].toUpperCase() + option.slice(1)) : null };
}

// ---------- Trasfondos ----------
const backgrounds = legacy('backgrounds.json').map((b, i) => {
  const c = classify('backgrounds', b.name);
  return {
    slug: slugify(c.name),
    ...c,
    icon: b.icon,
    image: b.image,
    concept: b.concept,
    abilityOptions: splitList(b.statImprovement).map((a) => ABILITIES[norm(a)] ?? a),
    ...featForBackground(b.keyFeat),
    skillProficiencies: splitList(b.skills),
    toolProficiency: b.tools,
    recommendations: b.recommendations,
    sortOrder: i,
    legacy: b,
  };
});
write('backgrounds.json', backgrounds);

// ---------- Especies ----------
const traits = legacy('species-traits.json');
const lineages = legacy('lineages.json');
const LINEAGE_KEYS = {
  Elfo: 'elvenLineages', 'Dracónido': 'dragonLineages', Gnomo: 'gnomeLineages', Goliat: 'goliathLineages',
  Tiflin: 'tieflingLineages', Aasimar: 'aasimarLineages',
};
const TRAIT_KEYS = { Tiflin: 'tiefling' };
const species = legacy('origins.json').map((s, i) => {
  const c = classify('species', s.name);
  const traitList = traits[TRAIT_KEYS[s.name] ?? s.name.toLowerCase()] ?? [];
  if (!traitList.length) warnings.push(`[species] ${s.name} no tiene rasgos detallados`);
  const fixed = Object.fromEntries(traitList.filter((t) => ['Tipo de Criatura', 'Tamaño', 'Velocidad'].includes(t.title)).map((t) => [t.title, t.desc]));
  return {
    slug: slugify(c.name),
    ...c,
    icon: s.icon,
    image: s.image,
    description: s.description,
    creatureType: fixed['Tipo de Criatura'] ?? 'Humanoide',
    size: fixed['Tamaño'] ?? null,
    speedMeters: Number((s.speed.match(/\(([\d.,]+)\s*m\)/)?.[1] ?? '9').replace(',', '.')),
    languages: s.language,
    traits: traitList.filter((t) => !['Tipo de Criatura', 'Tamaño', 'Velocidad'].includes(t.title))
      .map((t) => ({ name: t.title, description: t.desc })),
    // Bonos de característica de las reglas 2014. En las reglas 2024 los da el trasfondo.
    legacyAbilityBonuses: Object.fromEntries(Object.entries(s.statModifiers).filter(([, v]) => v).map(([k, v]) => [LEGACY_ABILITY[k], v])),
    lineages: (lineages[LINEAGE_KEYS[s.name]] ?? []).map((l) => ({
      slug: slugify(l.name), name: l.name, description: l.desc ?? null, damageType: l.element ?? null,
    })),
    sortOrder: i,
    legacy: s,
  };
});
write('species.json', species);

// ---------- Conjuros ----------
const SPELL_LISTS = {
  paladinSpellsList: { classSlug: 'paladin' }, magoCantripsList: { classSlug: 'wizard', cantrips: true },
  magoSpellsList: { classSlug: 'wizard' }, bardCantripsList: { classSlug: 'bard', cantrips: true },
  bardSpellsList: { classSlug: 'bard' }, warlockCantripsList: { classSlug: 'warlock', cantrips: true },
  warlockSpellsList: { classSlug: 'warlock' }, clericCantripsList: { classSlug: 'cleric', cantrips: true },
  clericSpellsList: { classSlug: 'cleric' }, druidCantripsList: { classSlug: 'druid', cantrips: true },
  druidSpellsList: { classSlug: 'druid' }, sorcererSpellsList: { classSlug: 'sorcerer' },
  eldritchKnightCantripsList: { subclassLegacy: 'Caballero Arcano', cantrips: true },
  eldritchKnightSpellsList: { subclassLegacy: 'Caballero Arcano' },
  rangerSpellsList: { classSlug: 'ranger' },
};
const spellDescs = legacy('descriptions.json').SPELL_DESCRIPTIONS_MAP;
const spellsByName = new Map();
for (const [listKey, list] of Object.entries(legacy('spell-lists.json'))) {
  const target = SPELL_LISTS[listKey];
  const access = target.classSlug
    ? { classSlug: target.classSlug }
    : { subclassSlug: subclassByLegacy(target.subclassLegacy)?.slug };
  for (const s of list) {
    const level = target.cantrips ? 0 : s.level ?? 0;
    const head = s.desc.match(/^([^.(]+)\s*(?:\(([^)]*)\))?\./);
    const tags = (head?.[2] ?? '').split(/,\s*/).map(norm);
    const key = norm(s.name);
    const existing = spellsByName.get(key);
    if (existing) {
      if (existing.level !== level) warnings.push(`[spells] "${s.name}" tiene niveles distintos (${existing.level} y ${level})`);
      if (!existing.lists.some((l) => JSON.stringify(l) === JSON.stringify(access))) existing.lists.push(access);
      existing.ritual ||= tags.includes('ritual');
      existing.concentration ||= tags.includes('concentracion') || /concentraci[oó]n/i.test(s.desc);
      continue;
    }
    spellsByName.set(key, {
      slug: slugify(s.name),
      name: s.name,
      // Casi todo está en el SRD 5.2.1; se confirma uno a uno antes de publicar.
      source: SRD,
      verified: false,
      level,
      school: SCHOOLS[norm(head?.[1] ?? '')] ?? null,
      ritual: tags.includes('ritual'),
      concentration: tags.includes('concentracion') || /concentraci[oó]n/i.test(s.desc),
      shortDescription: s.desc,
      description: spellDescs[s.name] ?? null,
      lists: [access],
    });
  }
}
const spells = [...spellsByName.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'es'));
spells.filter((s) => !s.school).forEach((s) => warnings.push(`[spells] "${s.name}" sin escuela reconocible`));
Object.keys(spellDescs).filter((n) => !spellsByName.has(norm(n)))
  .forEach((n) => warnings.push(`[spells] descripción huérfana (no está en ninguna lista): "${n}"`));
write('spells.json', spells);

// ---------- Opciones de clase (invocaciones, metamagia) ----------
const opts = legacy('class-options.json');
const classOptions = [
  ...opts.warlockInvocationsList.map((o, i) => ({
    slug: `invocacion-${slugify(o.name)}`, classSlug: 'warlock', kind: 'INVOCATION', name: o.name,
    prerequisite: o.req ?? null, cost: null, description: o.desc, source: SRD, verified: false, sortOrder: i,
  })),
  ...opts.sorcererMetamagicList.map((o, i) => ({
    slug: `metamagia-${slugify(o.name)}`, classSlug: 'sorcerer', kind: 'METAMAGIC', name: o.name,
    prerequisite: null, cost: o.cost ?? null, description: o.desc, source: SRD, verified: false, sortOrder: i,
  })),
];
write('class-options.json', classOptions);

// ---------- Paquetes de equipo ----------
const packs = Object.values(legacy('equipment-packs.json')).map((p) => ({
  slug: slugify(p.title), name: p.title, source: SRD, items: p.items,
}));
write('equipment-packs.json', packs);

// ---------- Resumen ----------
const count = (arr) => ({ total: arr.length, srd: arr.filter((x) => x.source === SRD).length, homebrew: arr.filter((x) => x.source === HOMEBREW).length });
const summary = {
  classes: count(classes), classFeatures: classFeatures.length, subclasses: count(subclasses),
  backgrounds: count(backgrounds), species: count(species), feats: count(feats),
  spells: spells.length, classOptions: classOptions.length, equipmentPacks: packs.length,
};
write('_build-report.json', { summary, warnings });
console.log(JSON.stringify(summary, null, 2));
console.log(`${warnings.length} avisos (ver content/data/_build-report.json)`);
