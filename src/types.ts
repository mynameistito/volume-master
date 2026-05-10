// Domain types shared across background, content, and popup contexts.

/** Volume gain expressed as a percentage. 100 = unity, 600 = max boost. */
export type VolumePercent = number;

/** Per-tab record displayed in the popup tab list. */
export interface TabAudio {
  audible: boolean;
  favIconUrl?: string;
  tabId: number;
  title: string;
  url: string;
  /** Currently applied gain. Falls back to {@link VOLUME_DEFAULT} if absent. */
  volume: VolumePercent;
}
