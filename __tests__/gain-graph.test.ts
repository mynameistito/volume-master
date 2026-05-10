import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

beforeAll(() => {
  GlobalRegistrator.register();
});
afterAll(async () => {
  await GlobalRegistrator.unregister();
});

let lastGainNode: StubGainNode;
let mediaSourceCallCount = 0;

class StubAudioParam {
  value = 1;
}
class StubGainNode {
  gain = new StubAudioParam();
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
  it("setGain stores the percent and converts to unit gain", async () => {
    const { setGain, currentVolume } = await import("@/audio/gain-graph");
    setGain(250);
    expect(currentVolume()).toBe(250);
    expect(lastGainNode?.gain?.value).toBe(2.5);
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
