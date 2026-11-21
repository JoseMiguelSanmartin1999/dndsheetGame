/**
 * Da (o quita) el rol de administrador a un usuario ya registrado.
 *
 *   npm run make-admin -- correo@ejemplo.com
 *   npm run make-admin -- correo@ejemplo.com --remove
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv.slice(2).find((a) => !a.startsWith('--'))?.toLowerCase();
const remove = process.argv.includes('--remove');

async function main() {
  if (!email) throw new Error('Indica el correo: npm run make-admin -- correo@ejemplo.com');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No existe ningún usuario con el correo ${email}. Regístrate primero en la web.`);
  await prisma.user.update({ where: { email }, data: { role: remove ? 'USER' : 'ADMIN' } });
  await prisma.auditLog.create({
    data: { action: remove ? 'revoke-admin' : 'grant-admin', entity: 'user', entityId: user.id, diff: { via: 'cli' } },
  });
  console.log(`${user.username} ahora es ${remove ? 'usuario normal' : 'administrador'}.`);
}

main()
  .catch((e) => { console.error(e.message ?? e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
