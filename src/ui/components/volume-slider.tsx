import { VOLUME_MAX, VOLUME_MIN } from "@/config";

interface Props {
  onChange: (value: number) => void;
  value: number;
}

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
        className="vm-range"
        max={VOLUME_MAX}
        min={VOLUME_MIN}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        onWheel={handleWheel}
        step={1}
        style={{ ["--vm-fill" as string]: `${pct}%` }}
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
