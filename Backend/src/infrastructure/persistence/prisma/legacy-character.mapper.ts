/**
 * Traduce entre el personaje "antiguo" (la forma que usa hoy el frontend:
 * nombres de clase/especie/trasfondo como texto y un campo por cada elección)
 * y las filas de PostgreSQL (ids de contenido + `choices`).
 *
 * Funciones puras: no tocan ninguna base de datos. Las usan el repositorio de
 * personajes y el script de migración desde MongoDB.
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

export function findByName<T extends ContentRef>(rows: T[], name: string | undefined | null): T | undefined {
  if (!name) return undefined;
  const n = norm(name);
  return rows.find((r) => norm(r.name) === n || (r.legacyNames ?? []).some((l) => norm(l) === n));
}

/** Nombre que entiende el frontend actual (el anterior al renombrado). */
export const legacyName = (ref: { name: string; legacyNames?: string[] } | null | undefined) =>
  ref ? (ref.legacyNames?.[0] ?? ref.name) : undefined;

const ABILITY_KEYS: Record<string, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};
const ABILITY_NAMES = Object.fromEntries(Object.entries(ABILITY_KEYS).map(([k, v]) => [v, k]));

function scores(stats: Json): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(stats ?? {})) if (ABILITY_KEYS[k]) out[ABILITY_KEYS[k]] = Number(v) || 0;
  return out;
}
function legacyScores(s: Json): Record<string, number> {
  const out: Record<string, number> = {};
  for (const key of Object.keys(ABILITY_KEYS)) out[key] = 0;
  for (const [k, v] of Object.entries(s ?? {})) if (ABILITY_NAMES[k]) out[ABILITY_NAMES[k]] = Number(v) || 0;
  return out;
}

/** Campos del personaje antiguo que tienen columna o lugar propio. El resto va a choices.extra. */
const KNOWN_FIELDS = new Set([
  'id', '_id', '__v', 'userId', 'name', 'class', 'race', 'level', 'levelingMode', 'xp', 'avatar', 'hp', 'currentHp',
  'stats', 'baseStats', 'backgroundStatsAllocation', 'background', 'originLineage', 'subclass', 'classSkills',
  'weapons', 'skilledFeatSelection', 'preparedSpells', 'warlockInvocations', 'sorcererMetamagic',
  'clericDivineOrder', 'druidPrimalOrder', 'rangerFeyGift', 'rangerPrimalCompanion', 'magicInitiateClass',
  'magicInitiateAbility', 'magicInitiateCantrips', 'magicInitiateSpell', 'heroicInspiration', 'history',
  'physicalDesc', 'height', 'sizeClass', 'personalNotes', 'inventory', 'createdAt', 'updatedAt',
]);

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

/** Personaje antiguo → datos para prisma.character.create/update + conjuros a enlazar. */
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
    if (spell) { if (!spellIds.includes(spell.id)) spellIds.push(spell.id); }
    else problems.push(`conjuro "${name}" no encontrado (no se enlaza)`);
  }

  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc ?? {})) if (!KNOWN_FIELDS.has(k) && v !== undefined) extra[k] = v;

  const height = Number(doc.height) || 0;
  const data = {
    legacyId: doc._id ? String(doc._id) : undefined,
    userId,
    name: doc.name,
    level: doc.level ?? 1,
    experience: Number(doc.xp) || 0,
    levelingMode: doc.levelingMode === 'xp' ? 'xp' : 'hito',
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
    weapons: Array.isArray(doc.weapons) ? doc.weapons : [],
    inventory: doc.inventory ?? {},
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
      extra,
    },
    avatar: doc.avatar ?? null,
    history: doc.history ?? null,
    physicalDesc: doc.physicalDesc ?? null,
    // En el modelo antiguo la altura está en metros.
    heightCm: height > 0 ? Math.round(height < 4 ? height * 100 : height) : null,
    sizeClass: doc.sizeClass ?? null,
    notes: doc.personalNotes ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
  };
  return { data, spellIds, problems };
}

/** Fila de PostgreSQL con sus relaciones (ver CHARACTER_INCLUDE en el repositorio). */
export interface CharacterRow {
  id: string;
  userId: string;
  name: string;
  level: number;
  experience: number;
  levelingMode: string;
  subclassVariant: string | null;
  baseScores: Json;
  backgroundBonuses: Json;
  hpMax: number;
  hpCurrent: number;
  heroicInspiration: boolean;
  weapons: string[] | null;
  inventory: Json;
  choices: Json;
  avatar: string | null;
  history: string | null;
  physicalDesc: string | null;
  heightCm: number | null;
  sizeClass: string | null;
  notes: string | null;
  createdAt: Date;
  gameClass: { name: string };
  subclass: { name: string; legacyNames: string[] } | null;
  species: { name: string; legacyNames: string[] };
  lineage: { name: string } | null;
  background: { name: string; legacyNames: string[] };
  spells: { spell: { name: string } }[];
}

/** Fila de PostgreSQL → personaje con la forma que espera el frontend actual. */
export function toLegacyCharacter(row: CharacterRow): Record<string, unknown> {
  const c = row.choices ?? {};
  const mi = c.magicInitiate ?? {};
  let subclass: string | undefined;
  if (row.subclass) {
    subclass = row.subclassVariant
      ? (row.subclass.legacyNames.find((n) => n.endsWith(`(${row.subclassVariant})`)) ?? `${legacyName(row.subclass)} (${row.subclassVariant})`)
      : legacyName(row.subclass);
  }
  const base = legacyScores(row.baseScores);
  const bonus = legacyScores(row.backgroundBonuses);
  const stats = c.legacyStats ?? Object.fromEntries(Object.keys(base).map((k) => [k, base[k] + bonus[k]]));

  return {
    ...(c.extra ?? {}),
    id: row.id,
    userId: row.userId,
    name: row.name,
    class: row.gameClass.name,
    race: legacyName(row.species),
    level: row.level,
    levelingMode: row.levelingMode,
    xp: row.experience,
    avatar: row.avatar ?? '',
    hp: row.hpMax,
    currentHp: row.hpCurrent,
    stats,
    baseStats: base,
    backgroundStatsAllocation: bonus,
    background: legacyName(row.background),
    originLineage: row.lineage?.name,
    subclass,
    classSkills: c.classSkills ?? [],
    weapons: row.weapons ?? [],
    skilledFeatSelection: c.skilledFeatSelection ?? [],
    preparedSpells: row.spells.map((s) => s.spell.name),
    warlockInvocations: c.warlockInvocations ?? [],
    sorcererMetamagic: c.sorcererMetamagic ?? [],
    clericDivineOrder: c.clericDivineOrder ?? undefined,
    druidPrimalOrder: c.druidPrimalOrder ?? undefined,
    rangerFeyGift: c.rangerFeyGift ?? undefined,
    rangerPrimalCompanion: c.rangerPrimalCompanion ?? undefined,
    magicInitiateClass: mi.class ?? undefined,
    magicInitiateAbility: mi.ability ?? undefined,
    magicInitiateCantrips: mi.cantrips ?? [],
    magicInitiateSpell: mi.spell ?? undefined,
    heroicInspiration: row.heroicInspiration,
    history: row.history ?? '',
    physicalDesc: row.physicalDesc ?? '',
    height: row.heightCm ? row.heightCm / 100 : 0,
    sizeClass: row.sizeClass ?? '',
    personalNotes: row.notes ?? '',
    inventory: row.inventory ?? {},
    createdAt: row.createdAt,
  };
}
