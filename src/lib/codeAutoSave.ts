/**
 * AlgoArena Code Editor Local Storage Auto-Save Manager
 * Preserves user code drafts and language buffers across page refreshes, accidental reloads,
 * and browser tab closures.
 */

export const AUTOSAVE_STORAGE_PREFIX = 'algoarena_autosave_';
export const LATEST_AUTOSAVE_KEY = 'algoarena_autosave_latest';

export interface AutoSavedDraft {
  roomId: string;
  problemTitle?: string;
  language: string;
  code: string;
  codeBuffers: Record<string, string>;
  timestamp: number;
  savedAt: string;
  lineCount: number;
  charCount: number;
}

/**
 * Format relative time for auto-save notifications (e.g. 'Just now', '12s ago', '2m ago')
 */
export function formatAutoSaveTime(timestamp: number): string {
  try {
    const diffMs = Math.max(0, Date.now() - timestamp);
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

/**
 * Retrieve saved code draft for a specific room or fallback to latest draft
 */
export function getAutoSavedDraft(roomId?: string): AutoSavedDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try room-specific draft
    if (roomId) {
      const roomKey = `${AUTOSAVE_STORAGE_PREFIX}${roomId}`;
      const raw = localStorage.getItem(roomKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AutoSavedDraft;
        if (parsed && typeof parsed.code === 'string') {
          return parsed;
        }
      }
    }

    // 2. Fallback to latest draft if matches or if no room specified
    const latestRaw = localStorage.getItem(LATEST_AUTOSAVE_KEY);
    if (latestRaw) {
      const parsed = JSON.parse(latestRaw) as AutoSavedDraft;
      if (parsed && typeof parsed.code === 'string') {
        if (!roomId || parsed.roomId === roomId) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[AutoSave] Failed to read draft from localStorage:', err);
  }

  return null;
}

/**
 * Save code draft to local storage
 */
export function saveAutoSaveDraft(payload: {
  roomId?: string;
  problemTitle?: string;
  language: string;
  code: string;
  codeBuffers: Record<string, string>;
}): AutoSavedDraft | null {
  if (typeof window === 'undefined') return null;

  const roomId = payload.roomId || 'default_session';
  const now = Date.now();
  const draft: AutoSavedDraft = {
    roomId,
    problemTitle: payload.problemTitle,
    language: payload.language,
    code: payload.code,
    codeBuffers: {
      ...payload.codeBuffers,
      [payload.language]: payload.code,
    },
    timestamp: now,
    savedAt: new Date(now).toISOString(),
    lineCount: payload.code.split('\n').length,
    charCount: payload.code.length,
  };

  try {
    const serialized = JSON.stringify(draft);
    
    // Save under room-specific key
    localStorage.setItem(`${AUTOSAVE_STORAGE_PREFIX}${roomId}`, serialized);
    
    // Also save under latest pointer
    localStorage.setItem(LATEST_AUTOSAVE_KEY, serialized);

    return draft;
  } catch (err: any) {
    // Handle QuotaExceededError by purging old entries and retrying once
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      try {
        purgeExpiredAutoSaves(1); // Purge anything older than 1 day
        const serialized = JSON.stringify(draft);
        localStorage.setItem(`${AUTOSAVE_STORAGE_PREFIX}${roomId}`, serialized);
        localStorage.setItem(LATEST_AUTOSAVE_KEY, serialized);
        return draft;
      } catch (retryErr) {
        console.warn('[AutoSave] Quota exceeded, unable to save draft:', retryErr);
      }
    } else {
      console.warn('[AutoSave] Failed to save draft to localStorage:', err);
    }
    return null;
  }
}

/**
 * Remove saved draft for a room (e.g. after resetting template or finishing match)
 */
export function clearAutoSaveDraft(roomId?: string): void {
  if (typeof window === 'undefined') return;

  try {
    if (roomId) {
      localStorage.removeItem(`${AUTOSAVE_STORAGE_PREFIX}${roomId}`);
    }
    
    const latestRaw = localStorage.getItem(LATEST_AUTOSAVE_KEY);
    if (latestRaw) {
      const parsed = JSON.parse(latestRaw) as AutoSavedDraft;
      if (!roomId || parsed.roomId === roomId) {
        localStorage.removeItem(LATEST_AUTOSAVE_KEY);
      }
    }
  } catch (err) {
    console.warn('[AutoSave] Failed to clear draft:', err);
  }
}

/**
 * Purge old auto-saves older than maxAgeDays (default 7 days)
 */
export function purgeExpiredAutoSaves(maxAgeDays = 7): void {
  if (typeof window === 'undefined') return;

  try {
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(AUTOSAVE_STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as AutoSavedDraft;
            if (parsed.timestamp && parsed.timestamp < cutoff) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[AutoSave] Error during cache cleanup:', err);
  }
}
