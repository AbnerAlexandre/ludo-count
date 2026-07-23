import { Injectable } from '@angular/core';

/** Thin, safe wrapper over localStorage so services persist the active match. */
@Injectable({ providedIn: 'root' })
export class Persistence {
  private readonly prefix = 'ludocount:';

  load<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  save<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      /* storage full / unavailable — non-fatal, match still lives in memory */
    }
  }

  clear(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
  }
}
