import { beforeEach, describe, expect, test } from "bun:test";
import { fakeBrowser, resetBrowserStub } from "@tests/setup";
import { onMessage, send, sendToTab } from "@/messaging/bus";
import type { AnyMsg } from "@/messaging/protocol";

beforeEach(() => {
  resetBrowserStub();
});

describe("send / sendToTab", () => {
  test("send forwards to browser.runtime.sendMessage and returns its result", async () => {
    const fb = fakeBrowser();
    const received: unknown[] = [];
    fb.runtime.sendMessage = (m) => {
      received.push(m);
      return Promise.resolve({ ok: true });
    };
    const msg: AnyMsg = { kind: "vm/get-tabs" };
    const result = await send(msg);
    expect(received).toEqual([msg]);
    expect(result).toEqual({ ok: true });
  });

  test("sendToTab passes tabId through", async () => {
    const fb = fakeBrowser();
    const calls: [number, unknown][] = [];
    fb.tabs.sendMessage = (id, m) => {
      calls.push([id, m]);
      return Promise.resolve("pong");
    };
    const msg: AnyMsg = {
      kind: "vm/volume-changed",
      tabId: 9,
      volume: 200,
    };
    const r = await sendToTab(9, msg);
    expect(calls).toEqual([[9, msg]]);
    expect(r).toBe("pong");
  });
});

describe("onMessage", () => {
  test("decodes valid msg, returns sync handler result", () => {
    const off = onMessage(() => ({ status: "ok" }));
    const fb = fakeBrowser();
    const listener = fb.__runtimeListeners[0];
    expect(listener).toBeDefined();
    let response: unknown;
    const ret = listener?.(
      { kind: "vm/get-tabs" } satisfies AnyMsg,
      {},
      (r) => {
        response = r;
      }
    );
    expect(ret).toBe(false);
    expect(response).toEqual({ status: "ok" });
    off();
    expect(fb.__runtimeListeners).toHaveLength(0);
  });

  test("async handler: returns true and resolves via sendResponse", async () => {
    onMessage(() => Promise.resolve({ async: true }));
    const fb = fakeBrowser();
    let response: unknown;
    const ret = fb.__runtimeListeners[0]?.(
      { kind: "vm/get-tabs" } satisfies AnyMsg,
      {},
      (r) => {
        response = r;
      }
    );
    expect(ret).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(response).toEqual({ async: true });
  });

  test("async handler rejection → err envelope", async () => {
    onMessage(() => Promise.reject(new Error("boom")));
    const fb = fakeBrowser();
    let response: unknown;
    fb.__runtimeListeners[0]?.(
      { kind: "vm/get-tabs" } satisfies AnyMsg,
      {},
      (r) => {
        response = r;
      }
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(response).toMatchObject({ status: "err" });
  });

  test("invalid msg → decode error envelope, no handler call", () => {
    let called = 0;
    onMessage(() => {
      called++;
    });
    const fb = fakeBrowser();
    let response: unknown;
    fb.__runtimeListeners[0]?.({ kind: "bogus" }, {}, (r) => {
      response = r;
    });
    expect(called).toBe(0);
    expect(response).toMatchObject({ status: "err" });
  });
});
