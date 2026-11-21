import { HttpErrorResponse } from '@angular/common/http';

/** Convierte un error de la API en un mensaje legible (NestJS puede devolver una lista). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && err.status === 0) return fallback;
  const message = (err as HttpErrorResponse)?.error?.message;
  if (Array.isArray(message)) return message.join(' ');
  if (typeof message === 'string' && message.trim()) return message;
  return fallback;
}
