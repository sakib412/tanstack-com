/** Input checks shared by the Site API routes. Each throws a JSON 400. */
import {HTTPException} from 'hono/http-exception';

export function parseText(value: unknown, field: string, max: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new HTTPException(400, {message: `\`${field}\` is required.`});
  }
  if (text.length > max) {
    throw new HTTPException(400, {message: `\`${field}\` is at most ${max} characters.`});
  }
  return text;
}

/** Like `parseText`, but empty or missing is `null`. */
export function parseOptionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return null;
  }
  return parseText(value, field, max);
}

export function parseInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new HTTPException(400, {
      message: `\`${field}\` must be a whole number from ${min} to ${max}.`,
    });
  }
  return value;
}

export function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647) {
    throw new HTTPException(400, {message: 'Invalid id.'});
  }
  return id;
}
