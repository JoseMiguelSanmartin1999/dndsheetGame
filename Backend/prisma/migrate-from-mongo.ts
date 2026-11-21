/**
 * Copia usuarios y personajes de MongoDB a PostgreSQL.
 *
 * Requisitos: MONGO_URI y DATABASE_URL en .env, migraciones aplicadas y
 * contenido cargado (npm run db:seed).
 *
 *   npm run db:migrate-mongo            → simulación: muestra qué haría, no escribe
 *   npm run db:migrate-mongo -- --apply → escribe en PostgreSQL
 *
 * Es idempotente: lo ya migrado (mismo legacyId) se salta.
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { mapLegacyCharacter, mapLegacyUser, type ContentLookup } from '../src/infrastructure/persistence/prisma/legacy-character.mapper';

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  if (!process.env.MONGO_URI) throw new Error('Falta MONGO_URI');
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e: any) {
    // En algunas redes de Windows el DNS del router no responde consultas SRV
    // (mongodb+srv://). Se reintenta una vez con DNS públicos.
    if (e?.code !== 'ENOTFOUND' || e?.syscall !== 'querySrv') throw e;
    console.warn('El DNS de tu red no resolvió el registro SRV de Atlas; reintentando con 1.1.1.1 y 8.8.8.8...');
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    await mongoose.connect(process.env.MONGO_URI);
  }
  const db = mongoose.connection.db!;

  const lookup: ContentLookup = {
    classes: await prisma.gameClass.findMany({ select: { id: true, slug: true, name: true } }),
    subclasses: await prisma.subclass.findMany({ select: { id: true, slug: true, name: true, legacyNames: true, classId: true } }),
    species: await prisma.species.findMany({ select: { id: true, slug: true, name: true, legacyNames: true } }),
    lineages: await prisma.speciesLineage.findMany({ select: { id: true, slug: true, name: true, speciesId: true } }),
    backgrounds: await prisma.background.findMany({ select: { id: true, slug: true, name: true, legacyNames: true } }),
    spells: await prisma.spell.findMany({ select: { id: true, slug: true, name: true } }),
  };
  if (!lookup.classes.length) throw new Error('No hay contenido en PostgreSQL. Ejecuta primero: npm run db:seed');

  const userIdByLegacy = new Map<string, string>();
  const users = await db.collection('users').find().toArray();
  let createdUsers = 0;
  for (const doc of users) {
    const mapped = mapLegacyUser(doc);
    const existing = await prisma.user.findUnique({ where: { legacyId: mapped.legacyId } });
    if (existing) { userIdByLegacy.set(mapped.legacyId, existing.id); continue; }
    if (apply) {
      const row = await prisma.user.create({ data: mapped as any });
      userIdByLegacy.set(mapped.legacyId, row.id);
    } else {
      userIdByLegacy.set(mapped.legacyId, `(nuevo:${mapped.username})`);
    }
    createdUsers++;
  }

  const characters = await db.collection('characters').find().toArray();
  let createdChars = 0;
  const report: string[] = [];
  for (const doc of characters) {
    const userId = userIdByLegacy.get(String(doc.userId));
    if (!userId) { report.push(`✗ ${doc.name}: su usuario (${doc.userId}) no existe; se omite`); continue; }
    if (await prisma.character.findUnique({ where: { legacyId: String(doc._id) } })) continue;

    const { data, spellIds, problems } = mapLegacyCharacter(doc, userId, lookup);
    if (!data.classId || !data.speciesId || !data.backgroundId) {
      report.push(`✗ ${doc.name}: ${problems.join('; ')}`);
      continue;
    }
    problems.forEach((p) => report.push(`! ${doc.name}: ${p}`));
    if (apply) {
      try {
        await prisma.character.create({
          data: { ...data, spells: { create: spellIds.map((spellId) => ({ spellId, origin: 'legacy', prepared: true })) } },
        });
      } catch (e: any) {
        report.push(`✗ ${doc.name}: ${e.message?.includes('CHARACTER_LIMIT_REACHED') ? 'el usuario ya tiene el máximo de personajes' : e.message}`);
        continue;
      }
    }
    createdChars++;
  }

  console.log(`${apply ? 'MIGRACIÓN' : 'SIMULACIÓN (usa --apply para escribir)'}`);
  console.log(`Usuarios: ${users.length} en Mongo, ${createdUsers} nuevos`);
  console.log(`Personajes: ${characters.length} en Mongo, ${createdChars} nuevos`);
  if (report.length) console.log(report.join('\n'));
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); await prisma.$disconnect(); });
