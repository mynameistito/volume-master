// Thin send/listen wrappers around `browser.runtime.sendMessage` /
// `browser.tabs.sendMessage`. The handler signature uses our typed protocol
// + `Result` so callers get exhaustive narrowing.
import { browser } from "wxt/browser";
import { type AnyMsg, decodeMessage } from "@/messaging/protocol";

export interface SendError {
  cause: unknown;
  code: "send";
}

/** Send a runtime message (popup ↔ background). */
export function send<R = unknown>(msg: AnyMsg): Promise<R | undefined> {
  return browser.runtime.sendMessage(msg) as Promise<R | undefined>;
}

/** Send a message to a specific tab's content script. */
export function sendToTab<R = unknown>(
  tabId: number,
  msg: AnyMsg
): Promise<R | undefined> {
  return browser.tabs.sendMessage(tabId, msg) as Promise<R | undefined>;
}

/**
 * Register a typed message listener. Returns an unsubscribe function.
 * Handlers should return synchronously when possible; an async handler must
 * return a Promise (Chrome's MV3 listener contract).
 */
export function onMessage(
  handler: (
    msg: AnyMsg,
    sender: chrome.runtime.MessageSender
  ) => unknown | Promise<unknown>
): () => void {
  const listener = (
    raw: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ): boolean => {
    const decoded = decodeMessage(raw);
    if (decoded.isErr()) {
      sendResponse({ status: "err", error: decoded.error });
      return false;
    }
    const result = handler(decoded.value, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch((cause: unknown) => {
        sendResponse({ status: "err", error: { code: "send", cause } });
      });
      return true; // tell Chrome we'll respond asynchronously
    }
    sendResponse(result);
    return false;
  };
  browser.runtime.onMessage.addListener(listener);
  return () => browser.runtime.onMessage.removeListener(listener);
}
