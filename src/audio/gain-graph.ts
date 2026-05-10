// Per-page gain graph. Wraps every <audio>/<video> element in a
// MediaElementAudioSourceNode → GainNode → AudioContext.destination chain.
//
// Cross-browser: pure WebAudio, no `tabCapture` / offscreen / getUserMedia.
// Limitation: doesn't capture audio from non-element sources (WebAudio APIs
// initiated by the page itself). Acceptable for the v1 rewrite — covered the
// 99% case (HTML5 video/audio, YouTube, Twitch, etc.).

const SOURCED = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface GraphState {
  ctx: AudioContext;
  gain: GainNode;
  /** Current gain percentage (0-VOLUME_MAX). */
  volume: number;
}

let state: GraphState | null = null;

/** Lazily create the AudioContext + GainNode singleton for this page. */
function ensureGraph(): GraphState {
  if (state) {
    return state;
  }
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 1;
  gain.connect(ctx.destination);
  state = { ctx, gain, volume: 100 };
  return state;
}

/** Wires a single media element into the gain graph (idempotent per element). */
export function attach(el: HTMLMediaElement): void {
  if (SOURCED.has(el)) {
    return;
  }
  const { ctx, gain } = ensureGraph();
  try {
    const src = ctx.createMediaElementSource(el);
    src.connect(gain);
    SOURCED.set(el, src);
  } catch {
    // Some elements (e.g. cross-origin without CORS) throw. Swallow silently;
    // the element will simply play at its native volume.
  }
}

/** Discover all <audio>/<video> currently in the document. */
export function findMediaElements(
  root: ParentNode = document
): HTMLMediaElement[] {
  return Array.from(root.querySelectorAll<HTMLMediaElement>("audio, video"));
}

/** Sets the gain in percent (100 = unity). Resumes a suspended context. */
export function setGain(volumePercent: number): void {
  const s = ensureGraph();
  s.volume = volumePercent;
  s.gain.gain.value = volumePercent / 100;
  if (s.ctx.state === "suspended") {
    s.ctx.resume().catch(() => undefined);
  }
}

/** Returns the last applied gain (defaults to 100 before any setGain call). */
export function currentVolume(): number {
  return state?.volume ?? 100;
}

/** Watches the DOM and attaches new media elements as they appear. */
export function observe(target: Node = document): MutationObserver {
  const obs = new MutationObserver((records) => {
    for (const rec of records) {
      for (const node of rec.addedNodes) {
        if (node instanceof HTMLMediaElement) {
          attach(node);
        } else if (node instanceof Element) {
          for (const el of node.querySelectorAll<HTMLMediaElement>(
            "audio, video"
          )) {
            attach(el);
          }
        }
      }
    }
  });
  obs.observe(target, { childList: true, subtree: true });
  return obs;
}

/** Test helper — drops the singleton so a fresh AudioContext can be created. */
export function __resetGraph(): void {
  state = null;
}
