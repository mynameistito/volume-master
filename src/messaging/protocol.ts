// Typed message protocol exchanged between popup ↔ background ↔ content script.
//
// Every payload is shape-validated at runtime via `decode*`. We intentionally
// avoid a heavy schema lib — the surface is tiny and the validators stay
// readable. Errors come back as `Result.err(...)` so callers can branch
// without try/catch noise.
import { type Err, type Ok, Result } from "better-result";
import type { TabAudio, VolumePercent } from "@/types";

export type MsgKind =
  | "vm/get-tabs"
  | "vm/get-volume"
  | "vm/set-volume"
  | "vm/volume-changed";

/** Popup → background: list audible / capturing tabs. */
export interface GetTabsMsg {
  kind: "vm/get-tabs";
}
export interface GetTabsRes {
  tabs: TabAudio[];
}

/** Popup → background: read current volume for a tab. */
export interface GetVolumeMsg {
  kind: "vm/get-volume";
  tabId: number;
}
export interface GetVolumeRes {
  tabId: number;
  volume: VolumePercent;
}

/** Popup → background → content: set tab gain. */
export interface SetVolumeMsg {
  kind: "vm/set-volume";
  tabId: number;
  volume: VolumePercent;
}
export interface SetVolumeRes {
  tabId: number;
  volume: VolumePercent;
}

/** Background → content: broadcast new volume after storage write. */
export interface VolumeChangedMsg {
  kind: "vm/volume-changed";
  tabId: number;
  volume: VolumePercent;
}

export type AnyMsg =
  | GetTabsMsg
  | GetVolumeMsg
  | SetVolumeMsg
  | VolumeChangedMsg;

export interface DecodeError {
  code: "decode";
  got: unknown;
  reason: string;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const fail = (reason: string, got: unknown): Err<never, DecodeError> =>
  Result.err({ code: "decode", reason, got });

/** Validates an unknown payload as an `AnyMsg`. */
export function decodeMessage(
  raw: unknown
): Ok<AnyMsg, DecodeError> | Err<never, DecodeError> {
  if (!isObject(raw)) {
    return fail("not an object", raw);
  }
  const kind = raw.kind;
  if (typeof kind !== "string") {
    return fail("missing kind", raw);
  }

  switch (kind as MsgKind) {
    case "vm/get-tabs":
      return Result.ok<AnyMsg, DecodeError>({ kind: "vm/get-tabs" });

    case "vm/get-volume":
      if (!isFiniteNumber(raw.tabId)) {
        return fail("tabId not number", raw);
      }
      return Result.ok<AnyMsg, DecodeError>({
        kind: "vm/get-volume",
        tabId: raw.tabId,
      });

    case "vm/set-volume":
    case "vm/volume-changed": {
      if (!isFiniteNumber(raw.tabId)) {
        return fail("tabId not number", raw);
      }
      if (!isFiniteNumber(raw.volume)) {
        return fail("volume not number", raw);
      }
      return Result.ok<AnyMsg, DecodeError>({
        kind: kind as "vm/set-volume" | "vm/volume-changed",
        tabId: raw.tabId,
        volume: raw.volume,
      });
    }

    default:
      return fail(`unknown kind: ${kind}`, raw);
  }
}
