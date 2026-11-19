/**
 * Universal defensive helpers for ConsuDerme forms, AI responses, and storage.
 * Prevents runtime crashes like "TypeError: x.join is not a function" or ".map of undefined".
 */

/**
 * Safely joins arrays or returns string values without throwing TypeError.
 */
export function safeJoin(val: unknown, separator: string = ', '): string {
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
      .map((item) => String(item))
      .join(separator);
  }
  if (typeof val === 'string') {
    return val;
  }
  if (val === null || val === undefined) {
    return '';
  }
  return String(val);
}

/**
 * Safely normalizes any value into an array of type T.
 */
export function safeArray<T = unknown>(val: unknown): T[] {
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as unknown as T[];
  }
  return [];
}

/**
 * Safely coerces unknown values into a trimmed or raw string with fallback.
 */
export function safeString(val: unknown, fallback: string = ''): string {
  if (typeof val === 'string') {
    return val;
  }
  if (val === null || val === undefined) {
    return fallback;
  }
  if (Array.isArray(val)) {
    return safeJoin(val);
  }
  return String(val);
}

/**
 * Safely parses numeric values with fallback.
 */
export function safeNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

/**
 * Safely reads and validates JSON from localStorage.
 */
export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) {
      return fallback;
    }
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[ConsuDerme Storage] Falha ao ler chave "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely writes JSON to localStorage.
 */
export function safeStorageSet<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[ConsuDerme Storage] Falha ao salvar chave "${key}":`, err);
    return false;
  }
}
