import { promises as fs } from 'fs';
import path from 'path';
import { CACHE_DIR, CACHE_TTL_MS } from '@/lib/api/config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Get the cache directory path (relative to project root)
function getCacheDir(): string {
  return path.join(process.cwd(), CACHE_DIR);
}

// Ensure cache directory exists
async function ensureCacheDir(): Promise<void> {
  const cacheDir = getCacheDir();
  try {
    await fs.access(cacheDir);
  } catch {
    await fs.mkdir(cacheDir, { recursive: true });
  }
}

// Generate cache file path from key
function getCacheFilePath(key: string): string {
  // Sanitize key for filesystem
  const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(getCacheDir(), `${sanitizedKey}.json`);
}

/**
 * Get cached data by key
 * Returns null if cache miss or expired
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const filePath = getCacheFilePath(key);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(fileContent);

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      // Clean up expired cache
      await fs.unlink(filePath).catch(() => {});
      return null;
    }

    return entry.data;
  } catch {
    // File doesn't exist or read error
    return null;
  }
}

/**
 * Set cache data with optional TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttlMs Time-to-live in milliseconds (defaults to CACHE_TTL_MS)
 */
export async function setCache<T>(
  key: string,
  data: T,
  ttlMs: number = CACHE_TTL_MS
): Promise<void> {
  try {
    await ensureCacheDir();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    const filePath = getCacheFilePath(key);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Cache write error for key "${key}":`, error);
    // Don't throw - caching failures shouldn't break the app
  }
}

/**
 * Invalidate (delete) cache by key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    const filePath = getCacheFilePath(key);
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, that's fine
  }
}

/**
 * Invalidate all cache entries matching a pattern
 * @param pattern Regex pattern to match keys
 */
export async function invalidateCachePattern(pattern: RegExp): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    const files = await fs.readdir(cacheDir);

    for (const file of files) {
      if (file.endsWith('.json') && pattern.test(file)) {
        await fs.unlink(path.join(cacheDir, file)).catch(() => {});
      }
    }
  } catch {
    // Directory doesn't exist or read error
  }
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  try {
    const cacheDir = getCacheDir();
    const files = await fs.readdir(cacheDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(cacheDir, file)).catch(() => {});
      }
    }
  } catch {
    // Directory doesn't exist or read error
  }
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats(): Promise<{
  entries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> {
  try {
    const cacheDir = getCacheDir();
    const files = await fs.readdir(cacheDir);
    let totalSize = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    let entries = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(cacheDir, file);
        const stat = await fs.stat(filePath);
        totalSize += stat.size;
        entries++;

        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const entry = JSON.parse(content) as CacheEntry<unknown>;

          if (oldestEntry === null || entry.timestamp < oldestEntry) {
            oldestEntry = entry.timestamp;
          }
          if (newestEntry === null || entry.timestamp > newestEntry) {
            newestEntry = entry.timestamp;
          }
        } catch {
          // Skip invalid cache files
        }
      }
    }

    return { entries, totalSize, oldestEntry, newestEntry };
  } catch {
    return { entries: 0, totalSize: 0, oldestEntry: null, newestEntry: null };
  }
}
