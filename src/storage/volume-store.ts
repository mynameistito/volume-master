// Per-tab volume persistence backed by `browser.storage.session` (so it lives
// for the browser session but resets on restart — matches user expectations:
// closing the browser resets gains). Falls back to in-memory if unavailable
// (tests, environments without WebExtensions storage).
import { browser } from "wxt/browser";
import {
  STORAGE_VOLUME_PREFIX,
  VOLUME_DEFAULT,
  VOLUME_MAX,
  VOLUME_MIN,
} from "@/config";
import type { VolumePercent } from "@/types";

interface StorageArea {
  get: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
  remove: (keys: string | string[]) => Promise<void>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

const memory = new Map<string, number>();

function listKeys(keys: string | string[] | null): string[] {
  if (keys == null) {
    return [...memory.keys()];
  }
  return Array.isArray(keys) ? keys : [keys];
}

const memoryArea: StorageArea = {
  get: (keys) => {
    const out: Record<string, unknown> = {};
    for (const k of listKeys(keys)) {
      const v = memory.get(k);
      if (v !== undefined) {
        out[k] = v;
      }
    }
    return Promise.resolve(out);
  },
  set: (items) => {
    for (const [k, v] of Object.entries(items)) {
      memory.set(k, v as number);
    }
    return Promise.resolve();
  },
  remove: (keys) => {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) {
      memory.delete(k);
    }
    return Promise.resolve();
  },
};

function area(): StorageArea {
  // `browser.storage.session` is only available in MV3-capable browsers and
  // not in the test environment.
  return (browser.storage?.session as StorageArea | undefined) ?? memoryArea;
}

const keyFor = (tabId: number) => `${STORAGE_VOLUME_PREFIX}${tabId}`;

/** Clamp a volume to the allowed range. NaN / non-finite → default. */
export function clampVolume(v: number): VolumePercent {
  if (!Number.isFinite(v)) {
    return VOLUME_DEFAULT;
  }
  return Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, Math.round(v)));
}

export async function getVolume(tabId: number): Promise<VolumePercent> {
  const key = keyFor(tabId);
  const got = await area().get(key);
  const raw = got[key];
  return typeof raw === "number" ? clampVolume(raw) : VOLUME_DEFAULT;
}

export async function setVolume(
  tabId: number,
  volume: VolumePercent
): Promise<VolumePercent> {
  const v = clampVolume(volume);
  await area().set({ [keyFor(tabId)]: v });
  return v;
}

export async function removeVolume(tabId: number): Promise<void> {
  await area().remove(keyFor(tabId));
}

/** Test helper — resets the in-memory fallback area. */
export function __resetMemoryStore(): void {
  memory.clear();
}
