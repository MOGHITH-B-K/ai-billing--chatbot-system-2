// Cache utility for optimizing API calls and data fetching

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class DataCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  set<T>(key: string, data: T, expiresIn: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    const isExpired = now - item.timestamp > item.expiresIn;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  clear(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(keyPattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const dataCache = new DataCache();

// Fetch with cache
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit,
  cacheTime: number = 60000
): Promise<T> {
  const cacheKey = `${url}_${JSON.stringify(options || {})}`;
  
  // Check cache first
  const cachedData = dataCache.get<T>(cacheKey);
  if (cachedData !== null) {
    return cachedData;
  }
  
  // Fetch fresh data
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Store in cache
  dataCache.set(cacheKey, data, cacheTime);
  
  return data;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Batch requests
export class RequestBatcher {
  private pending: Map<string, Promise<any>> = new Map();
  
  async batch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }
    
    // Create new request
    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
}

export const requestBatcher = new RequestBatcher();

// Lazy load image utility
export function lazyLoadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

// Memory optimization - clear old cache entries
setInterval(() => {
  // This runs in browser environment only
  if (typeof window !== 'undefined') {
    // Force cache validation
    dataCache.clear();
  }
}, 5 * 60 * 1000); // Clear cache every 5 minutes
