import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

beforeAll(() => {
  GlobalRegistrator.register();
});
afterAll(async () => {
  await GlobalRegistrator.unregister();
});

let lastGainNode: StubGainNode;
let lastCompressor: StubDynamicsCompressor;
let lastWaveshaper: StubWaveShaper;
let mediaSourceCallCount = 0;

class StubAudioParam {
  value = 1;
}
class StubGainNode {
  gain = new StubAudioParam();
  connect = () => undefined;
}
class StubDynamicsCompressor {
  threshold = new StubAudioParam();
  knee = new StubAudioParam();
  ratio = new StubAudioParam();
  attack = new StubAudioParam();
  release = new StubAudioParam();
  connect = () => undefined;
}
class StubWaveShaper {
  curve: Float32Array | null = null;
  oversample: OverSampleType = "none";
  connect = () => undefined;
}
class StubSource {
  connect = () => undefined;
}
class StubAudioContext {
  state: "suspended" | "running" = "running";
  destination = {};
  resume = () => Promise.resolve();
  createGain = () => {
    lastGainNode = new StubGainNode();
    return lastGainNode;
  };
  createDynamicsCompressor = () => {
    lastCompressor = new StubDynamicsCompressor();
    return lastCompressor;
  };
  createWaveShaper = () => {
    lastWaveshaper = new StubWaveShaper();
    return lastWaveshaper;
  };
  createMediaElementSource = (_el: unknown) => {
    mediaSourceCallCount++;
    return new StubSource();
  };
}

beforeAll(() => {
  (
    globalThis as unknown as { AudioContext: typeof StubAudioContext }
  ).AudioContext = StubAudioContext;
});

afterEach(async () => {
  const mod = await import("@/audio/gain-graph");
  mod.__resetGraph();
  mediaSourceCallCount = 0;
});

describe("gain-graph", () => {
  it("setGain stores the percent and uses perceptual curve above 100%", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(200);
    expect(currentVolume()).toBe(200);
    expect(lastGainNode?.gain?.value).toBeCloseTo(2 ** 1.6, 10);
  });

  it("setGain below 100% uses linear mapping", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(50);
    expect(currentVolume()).toBe(50);
    expect(lastGainNode?.gain?.value).toBe(0.5);
  });

  it("setGain at 100% is unity gain", async () => {
    const { setGain } = await import("@/audio/gain-graph");
    setGain(100);
    expect(lastGainNode?.gain?.value).toBe(1);
  });

  it("setGain clamps negative values to 0", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(-10);
    expect(currentVolume()).toBe(0);
    expect(lastGainNode?.gain?.value).toBe(0);
  });

  it("setGain sanitizes NaN and Infinity to 0", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(Number.NaN);
    expect(currentVolume()).toBe(0);
    expect(lastGainNode?.gain?.value).toBe(0);

    setGain(Number.POSITIVE_INFINITY);
    expect(currentVolume()).toBe(0);
    expect(lastGainNode?.gain?.value).toBe(0);
  });

  it("builds compressor with correct settings", async () => {
    const { setGain } = await import("@/audio/gain-graph");
    setGain(100);
    expect(lastCompressor.threshold.value).toBe(-6);
    expect(lastCompressor.knee.value).toBe(12);
    expect(lastCompressor.ratio.value).toBe(12);
    expect(lastCompressor.attack.value).toBe(0.003);
    expect(lastCompressor.release.value).toBe(0.15);
  });

  it("builds waveshaper with soft-clip curve and 4x oversample", async () => {
    const { setGain } = await import("@/audio/gain-graph");
    setGain(100);
    const curve = lastWaveshaper.curve;
    expect(curve).not.toBeNull();
    if (curve) {
      expect(curve.length).toBe(8192);
    }
    expect(lastWaveshaper.oversample).toBe("4x");
  });

  it("findMediaElements returns audio + video", async () => {
    document.body.innerHTML = `
      <audio></audio>
      <video></video>
      <div></div>
    `;
    const { findMediaElements } = await import("@/audio/gain-graph");
    expect(findMediaElements().length).toBe(2);
  });

  it("attach is idempotent on the same element", async () => {
    const { attach } = await import("@/audio/gain-graph");
    const el = document.createElement("audio") as unknown as HTMLMediaElement;
    attach(el);
    attach(el);
    expect(mediaSourceCallCount).toBe(1);
  });
});
