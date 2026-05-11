// Per-page audio processing graph.
//
// Two modes:
//   ≤100%  — native path. We set `el.volume = v/100`. No AudioContext is
//            created and no `MediaElementSource` is attached, so the page's
//            audio is bit-identical to no extension installed.
//   >100%  — boost path. We lazily build an AudioContext on the first boost
//            request, route every tracked media element through a gain →
//            compressor chain, and resume the context on user gesture.
//
// Why two modes: `createMediaElementSource` reroutes the element's audio
// exclusively through the AudioContext. If the context is suspended (Chrome's
// autoplay policy until first user gesture) the element plays silently — so
// we must avoid attaching until boosting is actually requested. The compressor
// also colours the signal even at unity gain, so keeping it out of the path at
// ≤100% preserves native fidelity.
//
// Cross-browser: pure WebAudio, no `tabCapture` / offscreen / getUserMedia.
// Limitation: doesn't capture audio from non-element WebAudio sources owned by
// the page itself. Acceptable for the v1 rewrite — covers HTML5 video/audio,
// YouTube, Twitch, etc.

const TRACKED = new WeakSet<HTMLMediaElement>();
const TRACKED_LIST: WeakRef<HTMLMediaElement>[] = [];
const SOURCED = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface GraphState {
  compressor: DynamicsCompressorNode;
  ctx: AudioContext;
  gain: GainNode;
  /** Current gain percentage (0-VOLUME_MAX). */
  volume: number;
}

let state: GraphState | null = null;
let currentPercent = 100;
let gestureHooked = false;

// Compressor params for the two modes. `ratio: 1` makes the compressor a
// mathematical pass-through regardless of threshold, so we can leave the node
// in the signal path while in bypass mode without colouring the audio.
const LIMITER_ACTIVE = {
  threshold: -3,
  knee: 6,
  ratio: 4,
  attack: 0.003,
  release: 0.1,
};
const LIMITER_BYPASS = {
  threshold: 0,
  knee: 0,
  ratio: 1,
  attack: 0.003,
  release: 0.1,
};

function applyLimiter(c: DynamicsCompressorNode, on: boolean): void {
  const p = on ? LIMITER_ACTIVE : LIMITER_BYPASS;
  c.threshold.value = p.threshold;
  c.knee.value = p.knee;
  c.ratio.value = p.ratio;
  c.attack.value = p.attack;
  c.release.value = p.release;
}

function makeGraph(ctx: AudioContext): GraphState {
  const gain = ctx.createGain();
  gain.gain.value = 1;

  const compressor = ctx.createDynamicsCompressor();
  applyLimiter(compressor, currentPercent > 100);

  gain.connect(compressor);
  compressor.connect(ctx.destination);

  return { ctx, gain, compressor, volume: currentPercent };
}

function ensureGraph(): GraphState {
  if (state) {
    return state;
  }
  const ctx = new AudioContext();
  state = makeGraph(ctx);
  hookGestureResume();
  return state;
}

function hookGestureResume(): void {
  if (gestureHooked || typeof document === "undefined") {
    return;
  }
  gestureHooked = true;
  const resume = () => {
    if (state && state.ctx.state === "suspended") {
      state.ctx.resume().catch(() => undefined);
    }
  };
  const opts: AddEventListenerOptions = { capture: true, passive: true };
  for (const ev of ["pointerdown", "keydown", "touchstart"] as const) {
    document.addEventListener(ev, resume, opts);
  }
}

function applyToElement(el: HTMLMediaElement, volumePercent: number): void {
  if (volumePercent > 100) {
    // Boost path — ensure the element is wired into the graph, and let the
    // GainNode do the work. Element volume stays at 1 so we don't double-scale.
    attachToGraph(el);
    try {
      el.volume = 1;
    } catch {
      // Some elements (cast/MSE) reject volume writes — ignore.
    }
    return;
  }
  // Bypass path — native element volume. If the element was previously
  // attached to the graph, the gain node has already been set to 1 below in
  // `setGain`, so `el.volume` is the only scaling factor.
  try {
    el.volume = Math.max(0, volumePercent / 100);
  } catch {
    // ignore
  }
}

function attachToGraph(el: HTMLMediaElement): void {
  if (SOURCED.has(el)) {
    return;
  }
  const { ctx, gain } = ensureGraph();
  try {
    const src = ctx.createMediaElementSource(el);
    src.connect(gain);
    SOURCED.set(el, src);
  } catch {
    // Cross-origin without CORS, or already attached by another consumer.
    // Element keeps its native volume path.
  }
}

/** Register a media element. Applies the current volume immediately. */
export function attach(el: HTMLMediaElement): void {
  if (TRACKED.has(el)) {
    return;
  }
  TRACKED.add(el);
  TRACKED_LIST.push(new WeakRef(el));
  applyToElement(el, currentPercent);
}

export function findMediaElements(
  root: ParentNode = document
): HTMLMediaElement[] {
  return Array.from(root.querySelectorAll<HTMLMediaElement>("audio, video"));
}

export function setGain(volumePercent: number): void {
  const sanitized = Number.isFinite(volumePercent)
    ? Math.max(0, volumePercent)
    : 0;
  currentPercent = sanitized;

  if (sanitized > 100) {
    const s = ensureGraph();
    s.volume = sanitized;
    s.gain.gain.value = sanitized / 100;
    applyLimiter(s.compressor, true);
    if (s.ctx.state === "suspended") {
      s.ctx.resume().catch(() => undefined);
    }
  } else if (state) {
    // Returning to bypass while elements remain wired to the graph: unity
    // gain + neutralised compressor (ratio=1) so the chain is a pass-through.
    // `el.volume` provides the scaling.
    state.volume = sanitized;
    state.gain.gain.value = 1;
    applyLimiter(state.compressor, false);
  }

  // Re-apply to every tracked element. Drops refs whose target has been GC'd.
  const live: WeakRef<HTMLMediaElement>[] = [];
  for (const ref of TRACKED_LIST) {
    const el = ref.deref();
    if (!el) {
      continue;
    }
    applyToElement(el, sanitized);
    live.push(ref);
  }
  TRACKED_LIST.length = 0;
  TRACKED_LIST.push(...live);
}

export function currentVolume(): number {
  return state?.volume ?? currentPercent;
}

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

export function __resetGraph(): void {
  state = null;
  currentPercent = 100;
  gestureHooked = false;
  TRACKED_LIST.length = 0;
}
