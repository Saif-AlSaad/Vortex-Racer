import { useEffect, useState } from "react";
import { PlayIcon, ReplayIcon } from "./Icons";

interface PauseMenuProps {
  score: number;
  best: number;
  distance: number;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export default function PauseMenu({
  score,
  best,
  distance,
  onResume,
  onRestart,
  onMenu,
}: PauseMenuProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-ink/80 p-4 backdrop-blur-md select-none">
      <div className="animate-fade-in absolute inset-0" aria-hidden />

      <div className="animate-fade-up relative w-full max-w-sm neon-border-purple bg-ink/95 p-5 sm:p-7 shadow-[0_0_30px_rgba(112,0,255,0.4)]">
        {/* Cockpit corner ticks */}
        <div className="absolute -top-1 -left-1 size-3 border-t-2 border-l-2 border-purple" />
        <div className="absolute -top-1 -right-1 size-3 border-t-2 border-r-2 border-purple" />
        <div className="absolute -bottom-1 -left-1 size-3 border-b-2 border-l-2 border-purple" />
        <div className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-purple" />

        {/* Title */}
        <div className="text-center">
          <div className="inline-block bg-purple/25 border border-purple px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.25em] text-purple shadow-[0_0_10px_rgba(112,0,255,0.5)]">
            SYSTEM FROZEN
          </div>
          <h2 className="font-arcade text-cyan text-xl sm:text-2xl neon-text-cyan mt-1.5 leading-tight">
            PAUSED
          </h2>
        </div>

        {/* Flight Snapshot */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-purple/30 py-3 text-center">
          <div>
            <div className="text-[9px] font-mono text-cyan/70 font-semibold tracking-wider">
              SCORE
            </div>
            <div className="font-arcade text-lg text-cyan mt-0.5">{score}</div>
          </div>

          <div>
            <div className="text-[9px] font-mono text-paper/60 font-semibold tracking-wider">
              BEST
            </div>
            <div className="font-arcade text-lg text-paper mt-0.5">{best}</div>
          </div>

          <div>
            <div className="text-[9px] font-mono text-amber-400/70 font-semibold tracking-wider">
              DISTANCE
            </div>
            <div className="font-arcade text-lg text-amber-300 mt-0.5">
              {distance}M
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          {/* Resume Button */}
          <button
            type="button"
            onClick={onResume}
            className="btn-arcade flex items-center justify-center gap-2 bg-cyan px-5 py-3.5 font-arcade text-ink text-base shadow-[0_0_18px_#00f0ff] hover:bg-white hover:text-cyan active:scale-95"
          >
            <PlayIcon className="size-4" /> RESUME
          </button>

          {/* Restart Button */}
          <button
            type="button"
            onClick={onRestart}
            className="btn-arcade flex items-center justify-center gap-2 border-2 border-pink bg-ink px-5 py-3 font-arcade text-pink text-sm shadow-[0_0_12px_rgba(255,0,85,0.4)] hover:bg-pink hover:text-white active:scale-95 transition-colors"
          >
            <ReplayIcon className="size-4" /> RESTART
          </button>

          {/* Abort to Menu */}
          <button
            type="button"
            onClick={onMenu}
            className="btn-arcade flex items-center justify-center gap-2 border border-cyan/40 bg-ink/90 px-4 py-2.5 font-arcade text-cyan/80 text-xs hover:border-cyan hover:text-cyan active:scale-95 transition-colors"
          >
            ABORT TO MENU
          </button>
        </div>

        {!isTouch && (
          <div className="mt-3.5 text-center text-[9px] font-mono text-cyan/40 tracking-widest">
            PRESS ESC OR P TO RESUME
          </div>
        )}
      </div>
    </div>
  );
}
