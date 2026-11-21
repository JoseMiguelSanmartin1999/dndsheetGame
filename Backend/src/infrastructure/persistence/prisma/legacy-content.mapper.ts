/**
 * Contenido en la forma que espera el frontend actual (/game-data/*).
 * Si la fila guarda su forma original en data.legacy se devuelve tal cual;
 * si no (BD cargada antes de existir ese campo) se reconstruye.
 * Los nombres son los anteriores al renombrado hasta que el frontend lea /content/*.
 */
type Json = any;

const ES: Record<string, string> = { STR: 'Fuerza', DEX: 'Destreza', CON: 'Constitución', INT: 'Inteligencia', WIS: 'Sabiduría', CHA: 'Carisma' };
const LEGACY_KEY: Record<string, string> = { STR: 'FUE', DEX: 'DES', CON: 'CON', INT: 'INT', WIS: 'SAB', CHA: 'CAR' };
const legacyOf = (row: Json) => (row?.data && typeof row.data === 'object' ? row.data.legacy : undefined);
const oldName = (row: Json) => row.legacyNames?.[0] ?? row.name;

export function toLegacyClass(row: Json) {
  return legacyOf(row) ?? {
    name: row.name,
    icon: row.icon ?? '',
    preference: row.playstyle ?? '',
    primaryStat: (row.primaryAbilities ?? []).map((a: string) => ES[a] ?? a).join(' y '),
    complexity: row.complexity ?? 'Media',
    image: row.image ?? '',
    hitDie: `d${row.hitDie}`,
    quote: row.tagline ?? '',
    description: row.description ?? '',
  };
}

export function toLegacyBackground(row: Json) {
  const featName = row.feat ? oldName(row.feat) : '';
  return legacyOf(row) ?? {
    name: oldName(row),
    icon: row.icon ?? '',
    concept: row.concept ?? '',
    statImprovement: (row.abilityOptions ?? []).map((a: string) => ES[a] ?? a).join(', '),
    keyFeat: featName,
    skills: (row.skillProficiencies ?? []).join(', '),
    tools: row.toolProficiency ?? '',
    recommendations: row.recommendations ?? '',
    image: row.image ?? '',
  };
}

export function toLegacySpecies(row: Json) {
  const legacy = legacyOf(row);
  if (legacy) return { ...legacy, id: row.id };
  const bonuses: Record<string, number> = row.legacyAbilityBonuses ?? {};
  const statModifiers = Object.fromEntries(Object.values(LEGACY_KEY).map((k) => [k, 0]));
  for (const [k, v] of Object.entries(bonuses)) if (LEGACY_KEY[k]) statModifiers[LEGACY_KEY[k]] = v;
  const meters = Number(row.speedMeters ?? 9);
  return {
    id: row.id,
    name: oldName(row),
    icon: row.icon ?? '',
    bonus: Object.entries(bonuses).map(([k, v]) => `+${v} ${ES[k] ?? k}`).join(', '),
    speed: `${Math.round(meters / 0.3)} pies (${meters}m)`,
    language: row.languages ?? '',
    trait: (row.traits ?? []).map((t: Json) => t.name).join(', '),
    image: row.image ?? '',
    description: row.description ?? '',
    statModifiers,
  };
}
