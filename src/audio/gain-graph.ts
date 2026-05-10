// Per-page audio processing graph.
//
// Signal chain:
//   MediaElementSource → GainNode → DynamicsCompressorNode → WaveShaperNode (soft-clip) → Destination
//
// The gain uses a perceptual loudness curve so the slider feels natural.
// The compressor prevents harsh digital clipping at high boost levels.
// The waveshaper applies soft saturation that sounds pleasant when driven hard.
//
// Cross-browser: pure WebAudio, no `tabCapture` / offscreen / getUserMedia.
// Limitation: doesn't capture audio from non-element sources (WebAudio APIs
// initiated by the page itself). Acceptable for the v1 rewrite — covered the
// 99% case (HTML5 video/audio, YouTube, Twitch, etc.).

const SOURCED = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface GraphState {
  compressor: DynamicsCompressorNode;
  ctx: AudioContext;
  gain: GainNode;
  /** Current gain percentage (0-VOLUME_MAX). */
  volume: number;
  waveshaper: WaveShaperNode;
}

let state: GraphState | null = null;

const CURVE_SAMPLES = 8192;

function makeSoftClipCurve(): Float32Array {
  const curve = new Float32Array(CURVE_SAMPLES);
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = ((Math.PI + 2) * x) / (Math.PI + 2 * Math.abs(x));
  }
  return curve;
}

function makeGraph(ctx: AudioContext): GraphState {
  const gain = ctx.createGain();
  gain.gain.value = 1;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -6;
  compressor.knee.value = 12;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;

  const waveshaper = ctx.createWaveShaper();
  waveshaper.curve = makeSoftClipCurve() as Float32Array<ArrayBuffer>;
  waveshaper.oversample = "4x";

  gain.connect(compressor);
  compressor.connect(waveshaper);
  waveshaper.connect(ctx.destination);

  return { ctx, gain, compressor, waveshaper, volume: 100 };
}

function ensureGraph(): GraphState {
  if (state) {
    return state;
  }
  const ctx = new AudioContext();
  state = makeGraph(ctx);
  return state;
}

function volumeToGain(volumePercent: number): number {
  if (volumePercent <= 100) {
    return volumePercent / 100;
  }
  return (volumePercent / 100) ** 1.6;
}

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

export function findMediaElements(
  root: ParentNode = document
): HTMLMediaElement[] {
  return Array.from(root.querySelectorAll<HTMLMediaElement>("audio, video"));
}

export function setGain(volumePercent: number): void {
  const s = ensureGraph();
  s.volume = volumePercent;
  s.gain.gain.value = volumeToGain(volumePercent);
  if (s.ctx.state === "suspended") {
    s.ctx.resume().catch(() => undefined);
  }
}

export function currentVolume(): number {
  return state?.volume ?? 100;
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
}
