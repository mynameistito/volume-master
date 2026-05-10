// Single source of truth for runtime constants.
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 600;
export const VOLUME_DEFAULT = 100;

// Quick-select preset buttons rendered in the popup.
export const VOLUME_PRESETS = [0, 50, 100, 200, 400, 600] as const;

// Storage namespaces.
export const STORAGE_VOLUME_PREFIX = "vm:volume:";
export const STORAGE_KEY_LAST_TAB = "vm:last-tab";
