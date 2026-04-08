"use client";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  disabled?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  disabled,
}: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-xs text-zinc-500 w-10 text-right font-mono">
        {formatTime(currentTime)}
      </span>
      {/* Outer div has extra padding for easier clicking */}
      <div
        className={`flex-1 py-2 ${disabled ? "cursor-default" : "cursor-pointer"} group`}
        onClick={handleClick}
      >
        <div className="h-1.5 bg-zinc-700 rounded-full relative">
          <div
            className="h-full bg-violet-500 rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            {!disabled && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-zinc-500 w-10 font-mono">
        {formatTime(duration)}
      </span>
    </div>
  );
}
