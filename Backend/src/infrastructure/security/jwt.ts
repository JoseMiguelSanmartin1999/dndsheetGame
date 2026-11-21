import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * JWT mínimo con HS256 (HMAC-SHA256) usando solo node:crypto.
 * Suficiente para sesiones propias: firmamos y verificamos nosotros mismos.
 */
export interface JwtPayload {
  sub: string;
  role: 'user' | 'admin';
  username: string;
  iat: number;
  exp: number;
}

const b64url = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');
const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

function sign(data: string, secret: string) {
  return createHmac('sha256', secret).update(data).digest();
}

export function signJwt(
  claims: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number,
  now = Math.floor(Date.now() / 1000),
): string {
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  const payload = b64url(JSON.stringify({ ...claims, iat: now, exp: now + expiresInSeconds }));
  const data = `${HEADER}.${payload}`;
  return `${data}.${b64url(sign(data, secret))}`;
}

/** Devuelve el payload si la firma es válida y no ha expirado; si no, null. */
export function verifyJwt(token: string, secret: string, now = Math.floor(Date.now() / 1000)): JwtPayload | null {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3 || parts[0] !== HEADER) return null;
  const expected = sign(`${parts[0]}.${parts[1]}`, secret);
  const given = Buffer.from(parts[2], 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as JwtPayload;
    if (typeof payload.exp !== 'number' || payload.exp <= now || typeof payload.sub !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}
