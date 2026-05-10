---
"volume-master": minor
---

Replace raw gain with a proper audio processing chain

The volume boost was previously just a linear gain multiplier on the audio signal. Above 100% this caused harsh digital clipping because the amplified waveform exceeded the 0dBFS ceiling.

The new chain: `Source → GainNode → DynamicsCompressorNode (limiter) → WaveShaperNode (soft-clip) → Destination`

- Added a dynamics compressor that kicks in at -6dB with a 12:1 ratio, preventing hard clipping while letting the signal get louder
- Added a waveshaper with a smooth tanh-like soft saturation curve and 4x oversampling, so driven signals saturate pleasantly instead of distorting
- Switched from linear gain mapping to a perceptual curve (`(v/100)^1.6` above unity) so the slider feels more natural and matches how humans perceive loudness
- Below 100% the mapping stays linear (same as before)
