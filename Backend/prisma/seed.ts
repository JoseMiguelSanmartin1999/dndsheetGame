import { PrismaClient } from '@prisma/client';
import { join } from 'node:path';
import { seedContent } from './seed-content';

const prisma = new PrismaClient();
const mode = process.argv.includes('--sync') || process.env.SEED_MODE === 'sync' ? 'sync' : 'missing';

seedContent(prisma, join(__dirname, '..', 'content', 'data'), mode)
  .then((log) => {
    console.log(`Contenido cargado (modo ${mode}):\n  ${log.join('\n  ')}`);
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
