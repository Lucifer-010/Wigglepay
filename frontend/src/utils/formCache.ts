/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal Form Caching & Recovery Utility for WigglePay
 * Automatically persists user input to localStorage across page reloads
 */

export function loadFormCache<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`wp_cache_${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed };
  } catch (e) {
    console.warn(`[FormCache] Failed to load cache for ${key}:`, e);
    return fallback;
  }
}

export function saveFormCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`wp_cache_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`[FormCache] Failed to save cache for ${key}:`, e);
  }
}

export function clearFormCache(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`wp_cache_${key}`);
  } catch (e) {
    console.warn(`[FormCache] Failed to clear cache for ${key}:`, e);
  }
}

