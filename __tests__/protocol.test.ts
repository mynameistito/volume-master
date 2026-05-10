import { describe, expect, it } from "bun:test";
import { decodeMessage } from "@/messaging/protocol";

describe("decodeMessage", () => {
  it("accepts vm/get-tabs", () => {
    const r = decodeMessage({ kind: "vm/get-tabs" });
    expect(r.isOk()).toBe(true);
    if (r.isOk()) {
      expect(r.value.kind).toBe("vm/get-tabs");
    }
  });

  it("accepts vm/set-volume with tabId + volume", () => {
    const r = decodeMessage({ kind: "vm/set-volume", tabId: 7, volume: 250 });
    expect(r.isOk()).toBe(true);
    if (r.isOk() && r.value.kind === "vm/set-volume") {
      expect(r.value.tabId).toBe(7);
      expect(r.value.volume).toBe(250);
    }
  });

  it("rejects vm/set-volume missing volume", () => {
    const r = decodeMessage({ kind: "vm/set-volume", tabId: 1 });
    expect(r.isErr()).toBe(true);
  });

  it("rejects unknown kind", () => {
    const r = decodeMessage({ kind: "garbage" });
    expect(r.isErr()).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(decodeMessage(null).isErr()).toBe(true);
    expect(decodeMessage("hi").isErr()).toBe(true);
    expect(decodeMessage(42).isErr()).toBe(true);
  });
});
