import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

beforeAll(() => {
  GlobalRegistrator.register();
});
afterAll(async () => {
  await GlobalRegistrator.unregister();
});

let lastGainNode: StubGainNode | undefined;
let lastCompressor: StubDynamicsCompressor | undefined;
let mediaSourceCallCount = 0;
let ctxCtorCount = 0;

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
class StubSource {
  connect = () => undefined;
}
class StubAudioContext {
  state: "suspended" | "running" = "running";
  destination = {};
  constructor() {
    ctxCtorCount++;
  }
  resume = () => Promise.resolve();
  createGain = () => {
    lastGainNode = new StubGainNode();
    return lastGainNode;
  };
  createDynamicsCompressor = () => {
    lastCompressor = new StubDynamicsCompressor();
    return lastCompressor;
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
  ctxCtorCount = 0;
  lastGainNode = undefined;
  lastCompressor = undefined;
});

function makeMedia(): HTMLMediaElement {
  const el = document.createElement("audio") as HTMLMediaElement;
  // happy-dom doesn't define `volume` writably by default — make it a plain
  // property the implementation can write to.
  Object.defineProperty(el, "volume", { value: 1, writable: true });
  return el;
}

describe("gain-graph", () => {
  it("setGain ≤100% does NOT create an AudioContext (bypass mode)", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(50);
    expect(currentVolume()).toBe(50);
    expect(ctxCtorCount).toBe(0);
    expect(lastGainNode).toBeUndefined();
  });

  it("setGain ≤100% applies native el.volume on tracked elements", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    const el = makeMedia();
    attach(el);
    setGain(50);
    expect(el.volume).toBe(0.5);
    expect(mediaSourceCallCount).toBe(0);
  });

  it("setGain at 100% leaves volume at 1 and skips the graph", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    const el = makeMedia();
    attach(el);
    setGain(100);
    expect(el.volume).toBe(1);
    expect(ctxCtorCount).toBe(0);
  });

  it("setGain >100% builds graph with linear gain and pins el.volume to 1", async () => {
    const { attach, setGain, currentVolume } = await import(
      "@/audio/gain-graph"
    );
    const el = makeMedia();
    attach(el);
    setGain(300);
    expect(currentVolume()).toBe(300);
    expect(ctxCtorCount).toBe(1);
    expect(lastGainNode?.gain.value).toBe(3);
    expect(mediaSourceCallCount).toBe(1);
    expect(el.volume).toBe(1);
  });

  it("setGain 600% applies 6x linear gain (no perceptual curve)", async () => {
    const { setGain } = await import("@/audio/gain-graph");
    setGain(600);
    expect(lastGainNode?.gain.value).toBe(6);
  });

  it("returning >100% → ≤100% restores native scaling and unity gain", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    const el = makeMedia();
    attach(el);
    setGain(400);
    expect(el.volume).toBe(1);
    expect(lastGainNode?.gain.value).toBe(4);
    setGain(50);
    expect(el.volume).toBe(0.5);
    expect(lastGainNode?.gain.value).toBe(1);
  });

  it("setGain clamps negative values to 0", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    const el = makeMedia();
    const { attach } = await import("@/audio/gain-graph");
    attach(el);
    setGain(-10);
    expect(currentVolume()).toBe(0);
    expect(el.volume).toBe(0);
  });

  it("setGain sanitizes NaN and Infinity to 0", async () => {
    const { setGain, currentVolume, attach } = await import(
      "@/audio/gain-graph"
    );
    const el = makeMedia();
    attach(el);
    setGain(Number.NaN);
    expect(currentVolume()).toBe(0);
    expect(el.volume).toBe(0);

    setGain(Number.POSITIVE_INFINITY);
    expect(currentVolume()).toBe(0);
    expect(el.volume).toBe(0);
  });

  it("compressor uses gentle limiter settings (only built on boost)", async () => {
    const { setGain } = await import("@/audio/gain-graph");
    setGain(200);
    expect(lastCompressor?.threshold.value).toBe(-3);
    expect(lastCompressor?.knee.value).toBe(6);
    expect(lastCompressor?.ratio.value).toBe(4);
    expect(lastCompressor?.attack.value).toBe(0.003);
    expect(lastCompressor?.release.value).toBe(0.1);
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

  it("attach is idempotent; createMediaElementSource fires at most once", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    const el = makeMedia();
    attach(el);
    attach(el);
    setGain(200);
    setGain(300);
    expect(mediaSourceCallCount).toBe(1);
  });

  it("setGain >100% resumes a suspended AudioContext", async () => {
    let resumed = 0;
    class SuspendedCtx extends StubAudioContext {
      override state: "suspended" | "running" = "suspended";
      override resume = () => {
        resumed++;
        return Promise.resolve();
      };
    }
    (
      globalThis as unknown as { AudioContext: typeof StubAudioContext }
    ).AudioContext = SuspendedCtx;
    const { setGain } = await import("@/audio/gain-graph");
    setGain(200);
    expect(resumed).toBe(1);
    (
      globalThis as unknown as { AudioContext: typeof StubAudioContext }
    ).AudioContext = StubAudioContext;
  });

  it("setGain >100% swallows AudioContext.resume() rejection", async () => {
    class RejectCtx extends StubAudioContext {
      override state: "suspended" | "running" = "suspended";
      override resume = () => Promise.reject(new Error("denied"));
    }
    (
      globalThis as unknown as { AudioContext: typeof StubAudioContext }
    ).AudioContext = RejectCtx;
    const { setGain } = await import("@/audio/gain-graph");
    setGain(200);
    await new Promise((r) => setTimeout(r, 0));
    (
      globalThis as unknown as { AudioContext: typeof StubAudioContext }
    ).AudioContext = StubAudioContext;
  });

  it("attach after setGain applies the current volume immediately", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    setGain(75);
    const el = makeMedia();
    attach(el);
    expect(el.volume).toBe(0.75);
  });

  it("attach after boost wires the late element into the graph", async () => {
    const { attach, setGain } = await import("@/audio/gain-graph");
    setGain(250);
    const el = makeMedia();
    attach(el);
    expect(mediaSourceCallCount).toBe(1);
    expect(el.volume).toBe(1);
  });

  it("observe attaches to media nodes added later", async () => {
    document.body.innerHTML = "";
    const { observe, setGain } = await import("@/audio/gain-graph");
    setGain(200); // ensure boost mode so attach -> createMediaElementSource
    const obs = observe(document.body);
    const audio = makeMedia();
    document.body.appendChild(audio);
    const wrapper = document.createElement("div");
    const nested = makeMedia();
    wrapper.appendChild(nested);
    document.body.appendChild(wrapper);
    await new Promise((r) => setTimeout(r, 0));
    obs.disconnect();
    expect(mediaSourceCallCount).toBeGreaterThanOrEqual(2);
  });
});
