/**
 * Carga el contenido de juego de Backend/content/data/*.json en PostgreSQL.
 *
 * Modos (`npm run db:seed` o `npm run db:seed:sync`):
 *  - "missing" (por defecto): solo inserta lo que falta. No pisa cambios hechos
 *    desde el panel de admin.
 *  - "sync": además actualiza lo existente con lo que diga el JSON. Úsalo cuando
 *    edites los JSON a propósito (p. ej. una nueva versión del SRD).
 *
 * Se escribe sin tipos de Prisma para poder probarse aislado.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Json = any;
type Mode = 'missing' | 'sync';

const read = (dataDir: string, file: string): Json[] =>
  JSON.parse(readFileSync(join(dataDir, file), 'utf8'));

export async function seedContent(prisma: any, dataDir: string, mode: Mode = 'missing') {
  const log: string[] = [];
  const upsert = async (model: string, where: Json, data: Json) =>
    prisma[model].upsert({ where, create: data, update: mode === 'sync' ? data : {} });

  // Clases
  const classIds = new Map<string, string>();
  for (const c of read(dataDir, 'classes.json')) {
    const row = await upsert('gameClass', { slug: c.slug }, {
      slug: c.slug, name: c.name, source: c.source, needsRewrite: c.needsRewrite,
      hitDie: c.hitDie, primaryAbilities: c.primaryAbilities, complexity: c.complexity,
      playstyle: c.playstyle, tagline: c.tagline, description: c.description,
      icon: c.icon, image: c.image, sortOrder: c.sortOrder,
    });
    classIds.set(c.slug, row.id);
  }
  log.push(`clases: ${classIds.size}`);

  // Rasgos de clase
  const features = read(dataDir, 'class-features.json');
  for (const f of features) {
    await upsert('classFeature', { slug: f.slug }, {
      slug: f.slug, classId: classIds.get(f.classSlug), level: f.level, name: f.name,
      description: f.description, isSubclassPlaceholder: f.isSubclassPlaceholder, sortOrder: f.sortOrder,
    });
  }
  log.push(`rasgos de clase: ${features.length}`);

  // Subclases
  const subclassIds = new Map<string, string>();
  for (const s of read(dataDir, 'subclasses.json')) {
    const row = await upsert('subclass', { slug: s.slug }, {
      slug: s.slug, classId: classIds.get(s.classSlug), name: s.name, source: s.source,
      needsRewrite: s.needsRewrite, legacyNames: s.legacyNames, variants: s.variants,
    });
    subclassIds.set(s.slug, row.id);
  }
  log.push(`subclases: ${subclassIds.size}`);

  // Dotes
  const featIds = new Map<string, string>();
  for (const f of read(dataDir, 'feats.json')) {
    const row = await upsert('feat', { slug: f.slug }, {
      slug: f.slug, name: f.name, source: f.source, needsRewrite: f.needsRewrite,
      legacyNames: f.legacyNames, category: f.category, benefits: f.benefits,
    });
    featIds.set(f.slug, row.id);
  }
  log.push(`dotes: ${featIds.size}`);

  // Trasfondos
  const backgrounds = read(dataDir, 'backgrounds.json');
  for (const b of backgrounds) {
    await upsert('background', { slug: b.slug }, {
      slug: b.slug, name: b.name, source: b.source, needsRewrite: b.needsRewrite,
      legacyNames: b.legacyNames, concept: b.concept, abilityOptions: b.abilityOptions,
      featId: b.featSlug ? featIds.get(b.featSlug) : null, featOption: b.featOption,
      skillProficiencies: b.skillProficiencies, toolProficiency: b.toolProficiency,
      recommendations: b.recommendations, icon: b.icon, image: b.image, sortOrder: b.sortOrder,
    });
  }
  log.push(`trasfondos: ${backgrounds.length}`);

  // Especies y linajes
  let lineageCount = 0;
  const species = read(dataDir, 'species.json');
  for (const s of species) {
    const row = await upsert('species', { slug: s.slug }, {
      slug: s.slug, name: s.name, source: s.source, needsRewrite: s.needsRewrite,
      legacyNames: s.legacyNames, description: s.description, creatureType: s.creatureType,
      size: s.size, speedMeters: s.speedMeters, languages: s.languages, traits: s.traits,
      legacyAbilityBonuses: s.legacyAbilityBonuses, icon: s.icon, image: s.image, sortOrder: s.sortOrder,
    });
    for (const l of s.lineages) {
      await upsert('speciesLineage', { speciesId_slug: { speciesId: row.id, slug: l.slug } }, {
        speciesId: row.id, slug: l.slug, name: l.name, description: l.description, damageType: l.damageType,
      });
      lineageCount++;
    }
  }
  log.push(`especies: ${species.length}, linajes: ${lineageCount}`);

  // Conjuros y listas por clase/subclase
  let entries = 0;
  const spells = read(dataDir, 'spells.json');
  for (const s of spells) {
    const row = await upsert('spell', { slug: s.slug }, {
      slug: s.slug, name: s.name, source: s.source, verified: s.verified, level: s.level,
      school: s.school, ritual: s.ritual, concentration: s.concentration,
      shortDescription: s.shortDescription, description: s.description,
    });
    for (const l of s.lists) {
      const where = {
        spellId: row.id,
        classId: l.classSlug ? classIds.get(l.classSlug) : null,
        subclassId: l.subclassSlug ? subclassIds.get(l.subclassSlug) : null,
      };
      if (!(await prisma.spellListEntry.findFirst({ where }))) {
        await prisma.spellListEntry.create({ data: where });
        entries++;
      }
    }
  }
  log.push(`conjuros: ${spells.length}, entradas nuevas en listas: ${entries}`);

  // Opciones de clase
  const options = read(dataDir, 'class-options.json');
  for (const o of options) {
    await upsert('classOption', { slug: o.slug }, {
      slug: o.slug, classId: classIds.get(o.classSlug), kind: o.kind, name: o.name, source: o.source,
      verified: o.verified, prerequisite: o.prerequisite, cost: o.cost, description: o.description,
      sortOrder: o.sortOrder,
    });
  }
  log.push(`opciones de clase: ${options.length}`);

  // Paquetes de equipo
  const packs = read(dataDir, 'equipment-packs.json');
  for (const p of packs) {
    await upsert('equipmentPack', { slug: p.slug }, { slug: p.slug, name: p.name, source: p.source, items: p.items });
  }
  log.push(`paquetes de equipo: ${packs.length}`);

  return log;
}
