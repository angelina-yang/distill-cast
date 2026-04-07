"use client";

interface HeaderProps {
  onClear?: () => void;
  showClear: boolean;
}

export function Header({ onClear, showClear }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4">
      <div>
        <h1 className="text-xl font-bold text-white">Distill Cast</h1>
        <p className="text-sm text-zinc-500">
          Turn articles and videos into audio briefings
        </p>
      </div>
      {showClear && onClear && (
        <button
          onClick={onClear}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          New Briefing
        </button>
      )}
    </header>
  );
}
