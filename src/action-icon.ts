// Per-tab toolbar icon overlay. When a tab's volume differs from the default,
// draw the volume percent on top of the base icon so the pinned toolbar icon
// hints at the active boost/mute.
import { browser } from "wxt/browser";
import { VOLUME_DEFAULT } from "@/config";
import type { VolumePercent } from "@/types";

const SIZES = [16, 32] as const;
type IconSize = (typeof SIZES)[number];

const baseBitmaps = new Map<IconSize, Promise<ImageBitmap>>();
let canvasCache: OffscreenCanvas | undefined;

function loadBase(size: IconSize): Promise<ImageBitmap> {
  let p = baseBitmaps.get(size);
  if (!p) {
    p = fetch(browser.runtime.getURL(`/icon/icon-${size}.png`))
      .then((r) => r.blob())
      .then((b) => createImageBitmap(b));
    baseBitmaps.set(size, p);
    p.catch(() => baseBitmaps.delete(size));
  }
  return p;
}

export function label(volume: VolumePercent): string {
  if (volume === 0) {
    return "M";
  }
  if (volume >= 1000) {
    return "999+";
  }
  return String(volume);
}

export function fontSizeFor(size: IconSize, textLen: number): number {
  const short = textLen <= 2;
  if (size === 16) {
    return short ? 9 : 7;
  }
  return short ? 15 : 12;
}

export function fillColor(_volume: VolumePercent): string {
  return "#ffffff";
}

export function pillColor(volume: VolumePercent): string {
  if (volume === 0) {
    return "#dc2626";
  }
  if (volume > 100) {
    return "#d97706";
  }
  return "#1E9BF0";
}

function roundedRectPath(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function getCanvas(size: number): OffscreenCanvas {
  if (!canvasCache || canvasCache.width !== size) {
    canvasCache = new OffscreenCanvas(size, size);
  }
  return canvasCache;
}

async function renderImageData(
  size: IconSize,
  volume: VolumePercent
): Promise<ImageData> {
  const base = await loadBase(size);
  const canvas = getCanvas(size);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("no 2d ctx");
  }
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(base, 0, 0, size, size);

  const text = label(volume);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const padX = Math.max(1, Math.round(size / 16));
  const padY = Math.max(1, Math.round(size / 16));
  const margin = Math.max(1, Math.round(size / 32));
  const maxPillW = size - margin * 2;

  let fontPx = fontSizeFor(size, text.length);
  ctx.font = `700 ${fontPx}px "Segoe UI", system-ui, sans-serif`;
  let textW = Math.ceil(ctx.measureText(text).width);
  while (textW + padX * 2 > maxPillW && fontPx > 6) {
    fontPx -= 1;
    ctx.font = `700 ${fontPx}px "Segoe UI", system-ui, sans-serif`;
    textW = Math.ceil(ctx.measureText(text).width);
  }

  const pillH = fontPx + padY * 2;
  const pillW = Math.min(textW + padX * 2, maxPillW);
  const pillX = size - pillW - margin;
  const pillY = size - pillH - margin;

  roundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = pillColor(volume);
  ctx.fill();

  ctx.fillStyle = fillColor(volume);
  ctx.fillText(text, pillX + pillW / 2, pillY + pillH / 2);

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Update the toolbar icon for a tab. When volume === default, restore the
 * plain icon; otherwise overlay the percent. Errors are swallowed because
 * the icon is purely cosmetic.
 */
async function isActive(tabId: number): Promise<boolean> {
  try {
    const tab = await browser.tabs.get(tabId);
    return tab.active === true;
  } catch {
    return false;
  }
}

export async function updateActionIcon(
  tabId: number,
  volume: VolumePercent
): Promise<void> {
  const action = browser.action;
  if (!action?.setIcon) {
    return;
  }
  if (!(await isActive(tabId))) {
    return;
  }

  try {
    if (volume === VOLUME_DEFAULT) {
      await action.setIcon({
        tabId,
        path: {
          16: "/icon/icon-16.png",
          32: "/icon/icon-32.png",
          48: "/icon/icon-48.png",
          128: "/icon/icon-128.png",
        },
      });
      return;
    }

    const entries = await Promise.all(
      SIZES.map(async (s) => [s, await renderImageData(s, volume)] as const)
    );
    const imageData: Record<number, ImageData> = {};
    for (const [s, data] of entries) {
      imageData[s] = data;
    }
    await action.setIcon({ tabId, imageData });
  } catch {
    // ignore
  }
}
