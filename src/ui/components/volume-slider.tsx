import { VOLUME_MAX, VOLUME_MIN } from "@/config";

interface Props {
  onChange: (value: number) => void;
  value: number;
}

const THUMB_CLASSES = [
  "appearance-none",
  "h-1.5",
  "w-full",
  "rounded-full",
  "focus:outline-none",
  "focus-visible:outline-2",
  "focus-visible:outline-accent",
  "focus-visible:outline-offset-4",
  "[&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:size-4",
  "[&::-webkit-slider-thumb]:cursor-grab",
  "[&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-fg",
  "[&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-accent-strong",
  "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(14,165,233,0.15)]",
  "[&:active::-webkit-slider-thumb]:cursor-grabbing",
  "[&::-moz-range-thumb]:size-3.5",
  "[&::-moz-range-thumb]:bg-fg",
  "[&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-accent-strong",
  "[&::-moz-range-thumb]:rounded-full",
].join(" ");

export function VolumeSlider({ value, onChange }: Props) {
  const pct = ((value - VOLUME_MIN) / (VOLUME_MAX - VOLUME_MIN)) * 100;
  const isBoosted = value > 100;

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    const delta = e.deltaY < 0 ? 10 : -10;
    const next = Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, value + delta));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`font-bold text-3xl tabular-nums tracking-tight ${
          isBoosted ? "text-warn" : "text-fg"
        }`}
      >
        {value}%
      </span>
      <input
        aria-label="Volume"
        className={THUMB_CLASSES}
        max={VOLUME_MAX}
        min={VOLUME_MIN}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        onWheel={handleWheel}
        step={1}
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${pct}%, var(--color-elev-2) ${pct}%, var(--color-elev-2) 100%)`,
        }}
        type="range"
        value={value}
      />
      <div className="flex justify-between font-mono text-[10px] text-fg-mute tabular-nums">
        <span>0%</span>
        <span>600%</span>
      </div>
    </div>
  );
}
