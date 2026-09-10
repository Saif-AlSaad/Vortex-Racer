import { useState, useEffect } from "react";
import type { GameResult } from "../game/engine";
import { ReplayIcon, StarIcon } from "./Icons";

interface GameOverScreenProps {
  result: GameResult;
  onRetry: () => void;
  onMenu: () => void;
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="border-l-2 border-purple/30 px-3 sm:px-4 first:border-l-0 first:pl-0">
      <div className="text-purple text-[10px] font-bold tracking-[0.22em]">{label}</div>
      <div className={`font-arcade text-2xl leading-tight sm:text-3xl ${accent ? "text-cyan" : "text-paper"}`}>
        {value}
      </div>
    </div>
  );
}

export default function GameOverScreen({ result, onRetry, onMenu }: GameOverScreenProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/85 p-4 backdrop-blur-sm">
      <div className="animate-fade-in absolute inset-0" aria-hidden />
      <div className="animate-fade-up relative w-full max-w-md neon-border-pink bg-ink p-5 sm:p-8">
        {result.newBest && (
          <div className="absolute -right-2 -top-3 sm:-right-3 sm:-top-4 flex items-center gap-1.5 bg-cyan px-3 py-1 font-arcade text-ink text-xs sm:text-sm shadow-[0_0_15px_#00f0ff]">
            <StarIcon className="size-3.5 sm:size-4" /> NEW BEST
          </div>
        )}

        <div className="font-arcade text-pink text-base sm:text-lg neon-text-pink">
          CRITICAL FAILURE
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="text-cyan/60 text-[10px] font-bold tracking-[0.24em]">FINAL SCORE</div>
          <div
            className="font-arcade neon-text-cyan leading-none"
            style={{ fontSize: "clamp(3.2rem, 13vw, 5rem)" }}
          >
            {result.score}
          </div>
        </div>

        <div className="mt-4 sm:mt-5 flex divide-x-0">
          <Stat label="BEST RECORD" value={result.best} accent={result.newBest} />
        </div>

        <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="btn-arcade flex items-center gap-2.5 bg-pink px-6 py-3.5 font-arcade text-white text-base sm:text-lg leading-none shadow-[0_0_15px_#ff0055] hover:bg-white hover:text-pink active:scale-95"
          >
            <ReplayIcon className="size-5" /> REBOOT
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="btn-arcade neon-border-cyan px-5 py-3 font-arcade text-cyan text-sm sm:text-base leading-none transition-colors hover:bg-cyan hover:text-ink active:scale-95"
          >
            MENU
          </button>
          {!isTouch && (
            <span className="ml-auto text-cyan/40 text-[10px] font-bold tracking-[0.2em]">SPACE = RETRY</span>
          )}
        </div>
      </div>
    </div>
  );
}
