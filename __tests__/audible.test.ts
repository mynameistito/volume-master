import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { __resetMemoryStore, setVolume } from "@/storage/volume-store";
import { listAudibleTabs, listManagedTabs } from "@/tabs/audible";
import { resetBrowserStub, setFakeTabs } from "../tests/setup";

beforeEach(() => {
  __resetMemoryStore();
  resetBrowserStub();
});
afterEach(() => {
  resetBrowserStub();
});

describe("listAudibleTabs", () => {
  it("returns only audible tabs hydrated with their volume", async () => {
    setFakeTabs([
      { id: 1, title: "music", audible: true },
      { id: 2, title: "silent", audible: false },
    ]);
    await setVolume(1, 250);
    const out = await listAudibleTabs();
    expect(out.length).toBe(1);
    expect(out[0]?.tabId).toBe(1);
    expect(out[0]?.volume).toBe(250);
  });
});

describe("listManagedTabs", () => {
  it("includes silent tabs with non-default volumes", async () => {
    setFakeTabs([
      { id: 1, audible: true },
      { id: 2, audible: false },
      { id: 3, audible: false },
    ]);
    await setVolume(2, 350);
    const out = await listManagedTabs();
    const ids = out.map((t) => t.tabId).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2]);
  });
});
