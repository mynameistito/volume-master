import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { fakeBrowser, resetBrowserStub } from "@tests/setup";
import {
  fillColor,
  fontSizeFor,
  label,
  pillColor,
  updateActionIcon,
} from "@/action-icon";

describe("action-icon helpers", () => {
  test("label maps mute and clamps over-range", () => {
    expect(label(0)).toBe("M");
    expect(label(100)).toBe("100");
    expect(label(600)).toBe("600");
    expect(label(1500)).toBe("999+");
  });

  test("fontSizeFor scales by icon size and text length", () => {
    expect(fontSizeFor(16, 2)).toBe(9);
    expect(fontSizeFor(16, 3)).toBe(7);
    expect(fontSizeFor(32, 2)).toBe(15);
    expect(fontSizeFor(32, 4)).toBe(12);
  });

  test("fillColor: always white (pill text)", () => {
    expect(fillColor(0)).toBe("#ffffff");
    expect(fillColor(50)).toBe("#ffffff");
    expect(fillColor(100)).toBe("#ffffff");
    expect(fillColor(600)).toBe("#ffffff");
  });

  test("pillColor: mute red, boost amber, normal brand-blue", () => {
    expect(pillColor(0)).toBe("#dc2626");
    expect(pillColor(50)).toBe("#1E9BF0");
    expect(pillColor(100)).toBe("#1E9BF0");
    expect(pillColor(101)).toBe("#d97706");
    expect(pillColor(600)).toBe("#d97706");
  });
});

interface CtxRec {
  fillStyle: string;
  font: string;
  lineWidth: number;
  strokeStyle: string;
  textAlign: string;
  textBaseline: string;
}

function installCanvasStubs(): () => void {
  const g = globalThis as Record<string, unknown>;
  const origFetch = g.fetch;
  const origOC = g.OffscreenCanvas;
  const origCIB = g.createImageBitmap;

  g.fetch = () =>
    Promise.resolve({ blob: () => Promise.resolve(new Blob()) } as Response);
  g.createImageBitmap = () => Promise.resolve({} as ImageBitmap);
  class FakeOC {
    width: number;
    height: number;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
    }
    getContext(): CtxRec & {
      arcTo: () => void;
      beginPath: () => void;
      clearRect: () => void;
      closePath: () => void;
      drawImage: () => void;
      fill: () => void;
      fillText: () => void;
      getImageData: () => ImageData;
      measureText: (t: string) => { width: number };
      moveTo: () => void;
      strokeText: () => void;
    } {
      const w = this.width;
      const h = this.height;
      return {
        arcTo: () => undefined,
        beginPath: () => undefined,
        clearRect: () => undefined,
        closePath: () => undefined,
        drawImage: () => undefined,
        fill: () => undefined,
        fillStyle: "",
        fillText: () => undefined,
        font: "",
        getImageData: () =>
          ({
            data: new Uint8ClampedArray(w * h * 4),
            height: h,
            width: w,
          }) as ImageData,
        lineWidth: 0,
        measureText: (t: string) => ({ width: t.length * 6 }),
        moveTo: () => undefined,
        strokeStyle: "",
        strokeText: () => undefined,
        textAlign: "",
        textBaseline: "",
      };
    }
  }
  g.OffscreenCanvas = FakeOC as unknown as typeof OffscreenCanvas;

  return () => {
    g.fetch = origFetch;
    g.OffscreenCanvas = origOC;
    g.createImageBitmap = origCIB;
  };
}

describe("updateActionIcon", () => {
  let restore: () => void;

  beforeEach(() => {
    resetBrowserStub();
    restore = installCanvasStubs();
  });
  afterEach(() => {
    restore();
  });

  test("inactive tab → no setIcon call", async () => {
    const fb = fakeBrowser();
    fb.__tabs.push({ id: 7, audible: true });
    // active flag not set → false
    await updateActionIcon(7, 150);
    expect(fb.__setIconCalls).toHaveLength(0);
  });

  test("missing tab → no setIcon call, no throw", async () => {
    const fb = fakeBrowser();
    await updateActionIcon(999, 150);
    expect(fb.__setIconCalls).toHaveLength(0);
  });

  test("active tab + default volume → restores plain icon via path", async () => {
    const fb = fakeBrowser();
    fb.__tabs.push({ id: 1, active: true });
    await updateActionIcon(1, 100);
    expect(fb.__setIconCalls).toHaveLength(1);
    const c = fb.__setIconCalls[0];
    if (!c) {
      throw new Error("expected a setIcon call");
    }
    expect(c.tabId).toBe(1);
    expect(c.path).toBeDefined();
    expect(c.imageData).toBeUndefined();
  });

  test("failed base-icon fetch is swallowed and cache entry cleared", async () => {
    const fb = fakeBrowser();
    fb.__tabs.push({ id: 3, active: true });
    const g = globalThis as Record<string, unknown>;
    const origFetch = g.fetch;
    g.fetch = () => Promise.reject(new Error("boom"));
    try {
      await updateActionIcon(3, 200);
    } finally {
      g.fetch = origFetch;
    }
    expect(fb.__setIconCalls).toHaveLength(0);
  });

  test("active tab + custom volume → setIcon with imageData", async () => {
    const fb = fakeBrowser();
    fb.__tabs.push({ id: 2, active: true });
    await updateActionIcon(2, 250);
    expect(fb.__setIconCalls).toHaveLength(1);
    const c = fb.__setIconCalls[0];
    if (!c) {
      throw new Error("expected a setIcon call");
    }
    expect(c.tabId).toBe(2);
    expect(c.imageData).toBeDefined();
    expect(Object.keys(c.imageData ?? {}).sort()).toEqual(["16", "32"]);
  });

  test("missing browser.action.setIcon → no-op", async () => {
    const fb = fakeBrowser() as unknown as {
      action?: { setIcon?: unknown };
    };
    const orig = fb.action?.setIcon;
    if (fb.action) {
      fb.action.setIcon = undefined;
    }
    try {
      await updateActionIcon(1, 200);
    } finally {
      if (fb.action) {
        fb.action.setIcon = orig;
      }
    }
    expect(fakeBrowser().__setIconCalls).toHaveLength(0);
  });

  test("getContext returning null is swallowed", async () => {
    const fb = fakeBrowser();
    fb.__tabs.push({ id: 5, active: true });
    const g = globalThis as Record<string, unknown>;
    const origOC = g.OffscreenCanvas;
    class NullCtxOC {
      width: number;
      height: number;
      constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
      }
      getContext(): null {
        return null;
      }
    }
    g.OffscreenCanvas = NullCtxOC as unknown as typeof OffscreenCanvas;
    try {
      await updateActionIcon(5, 250);
    } finally {
      g.OffscreenCanvas = origOC;
    }
    // try/catch swallows the throw → no setIcon call
    expect(fb.__setIconCalls).toHaveLength(0);
  });
});
