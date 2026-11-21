/**
 * Convierte usuarios y personajes guardados en MongoDB (modelo antiguo) al
 * modelo de PostgreSQL. Funciones puras: no tocan ninguna base de datos.
 */

type Json = any;

/** Fila de contenido con los campos mínimos para encontrarla por su nombre antiguo. */
export interface ContentRef {
  id: string;
  slug: string;
  name: string;
  legacyNames?: string[];
}

export interface ContentLookup {
  classes: ContentRef[];
  subclasses: (ContentRef & { classId: string })[];
  species: ContentRef[];
  lineages: (ContentRef & { speciesId: string })[];
  backgrounds: ContentRef[];
  spells: ContentRef[];
}

const norm = (s: string) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function findByName<T extends ContentRef>(rows: T[], name: string | undefined): T | undefined {
  if (!name) return undefined;
  const n = norm(name);
  return rows.find((r) => norm(r.name) === n || (r.legacyNames ?? []).some((l) => norm(l) === n));
}

const ABILITY_KEYS: Record<string, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};
function scores(stats: Json): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(stats ?? {})) if (ABILITY_KEYS[k]) out[ABILITY_KEYS[k]] = Number(v) || 0;
  return out;
}

export function mapLegacyUser(doc: Json) {
  return {
    legacyId: String(doc._id),
    email: String(doc.email).toLowerCase(),
    username: doc.username,
    // El hash bcrypt se conserva: las contraseñas siguen funcionando.
    passwordHash: doc.passwordHash,
    dateOfBirth: new Date(doc.dateOfBirth),
    hasPlayedBefore: Boolean(doc.hasPlayedBefore),
    role: doc.role === 'admin' ? 'ADMIN' : 'USER',
    failedLoginAttempts: 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
  };
}

export interface MappedCharacter {
  data: Json;
  spellIds: string[];
  problems: string[];
}

/** Devuelve los datos para prisma.character.create y los conjuros a enlazar. */
export function mapLegacyCharacter(doc: Json, userId: string, lookup: ContentLookup): MappedCharacter {
  const problems: string[] = [];
  const need = <T>(value: T | undefined, what: string, name: string): T | undefined => {
    if (!value) problems.push(`${what} "${name}" no existe en el contenido nuevo`);
    return value;
  };

  const gameClass = need(findByName(lookup.classes, doc.class), 'clase', doc.class);
  const species = need(findByName(lookup.species, doc.race), 'especie', doc.race);
  const background = need(findByName(lookup.backgrounds, doc.background), 'trasfondo', doc.background);

  // "Círculo de la Tierra (Árido)" → subclase "Círculo de la Tierra", variante "Árido"
  let subclassId: string | null = null;
  let subclassVariant: string | null = null;
  if (doc.subclass) {
    const sub = findByName(lookup.subclasses.filter((s) => s.classId === gameClass?.id), doc.subclass);
    if (sub) {
      subclassId = sub.id;
      subclassVariant = doc.subclass.match(/\(([^)]+)\)\s*$/)?.[1] ?? null;
    } else problems.push(`subclase "${doc.subclass}" no encontrada (se deja vacía)`);
  }

  let lineageId: string | null = null;
  if (doc.originLineage && species) {
    const lin = findByName(lookup.lineages.filter((l) => l.speciesId === species.id), doc.originLineage);
    if (lin) lineageId = lin.id;
    else problems.push(`linaje "${doc.originLineage}" no encontrado (se deja vacío)`);
  }

  const spellIds: string[] = [];
  for (const name of doc.preparedSpells ?? []) {
    const spell = findByName(lookup.spells, name);
    if (spell) spellIds.push(spell.id);
    else problems.push(`conjuro "${name}" no encontrado (no se enlaza)`);
  }

  const height = Number(doc.height) || 0;
  const data = {
    legacyId: String(doc._id),
    userId,
    name: doc.name,
    level: doc.level ?? 1,
    classId: gameClass?.id,
    subclassId,
    subclassVariant,
    speciesId: species?.id,
    lineageId,
    backgroundId: background?.id,
    baseScores: scores(doc.baseStats ?? doc.stats),
    backgroundBonuses: scores(doc.backgroundStatsAllocation),
    hpMax: doc.hp ?? 1,
    hpCurrent: doc.currentHp ?? doc.hp ?? 1,
    heroicInspiration: Boolean(doc.heroicInspiration),
    // Todo lo específico de clase pasa a `choices` hasta que el motor de reglas lo normalice.
    choices: {
      classSkills: doc.classSkills ?? [],
      skilledFeatSelection: doc.skilledFeatSelection ?? [],
      warlockInvocations: doc.warlockInvocations ?? [],
      sorcererMetamagic: doc.sorcererMetamagic ?? [],
      clericDivineOrder: doc.clericDivineOrder ?? null,
      druidPrimalOrder: doc.druidPrimalOrder ?? null,
      rangerFeyGift: doc.rangerFeyGift ?? null,
      rangerPrimalCompanion: doc.rangerPrimalCompanion ?? null,
      magicInitiate: {
        class: doc.magicInitiateClass ?? null,
        ability: doc.magicInitiateAbility ?? null,
        cantrips: doc.magicInitiateCantrips ?? [],
        spell: doc.magicInitiateSpell ?? null,
      },
      legacyStats: doc.stats ?? null,
    },
    avatar: doc.avatar ?? null,
    history: doc.history ?? null,
    physicalDesc: doc.physicalDesc ?? null,
    // En Mongo la altura estaba en metros.
    heightCm: height > 0 ? Math.round(height < 4 ? height * 100 : height) : null,
    sizeClass: doc.sizeClass ?? null,
    notes: doc.personalNotes ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
  };
  return { data, spellIds, problems };
}
