import { afterEach, describe, expect, it } from "bun:test";
import { VOLUME_DEFAULT, VOLUME_MAX } from "@/config";
import {
  __resetMemoryStore,
  clampVolume,
  getVolume,
  removeVolume,
  setVolume,
} from "@/storage/volume-store";
import { resetBrowserStub } from "../../../tests/setup";

afterEach(() => {
  __resetMemoryStore();
  resetBrowserStub();
});

describe("clampVolume", () => {
  it("clamps below 0 to 0", () => {
    expect(clampVolume(-50)).toBe(0);
  });
  it("clamps above max to max", () => {
    expect(clampVolume(9999)).toBe(VOLUME_MAX);
  });
  it("rounds fractional values", () => {
    expect(clampVolume(133.7)).toBe(134);
  });
  it("returns default for NaN / Infinity", () => {
    expect(clampVolume(Number.NaN)).toBe(VOLUME_DEFAULT);
    expect(clampVolume(Number.POSITIVE_INFINITY)).toBe(VOLUME_DEFAULT);
  });
});

describe("volume-store", () => {
  it("returns default when unset", async () => {
    expect(await getVolume(1)).toBe(VOLUME_DEFAULT);
  });

  it("round-trips a value, clamped", async () => {
    const stored = await setVolume(42, 750);
    expect(stored).toBe(VOLUME_MAX);
    expect(await getVolume(42)).toBe(VOLUME_MAX);
  });

  it("removes a value", async () => {
    await setVolume(7, 200);
    await removeVolume(7);
    expect(await getVolume(7)).toBe(VOLUME_DEFAULT);
  });
});
