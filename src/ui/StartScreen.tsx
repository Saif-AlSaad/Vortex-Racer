import { useState, useEffect } from "react";
import { FullscreenEnterIcon, FullscreenExitIcon, SpeakerOffIcon, SpeakerOnIcon } from "./Icons";

interface StartScreenProps {
  best: number;
  muted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onStart: () => void;
}

export default function StartScreen({
  best,
  muted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onStart,
}: StartScreenProps) {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-7 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="animate-title-drop">
          <div className="mb-2 inline-block bg-purple px-2.5 py-0.5 font-arcade text-paper text-[10px] sm:text-xs shadow-[0_0_10px_#7000ff]">
            NEON · HIGHSPEED · DODGE
          </div>
          <h1
            className="font-arcade leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(2.4rem, 9vw, 6.5rem)" }}
          >
            <span className="neon-text-pink block">VORTEX</span>
            <span className="neon-text-cyan block mt-0.5">RACER</span>
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2.5">
          {/* Top action buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="grid size-10 place-items-center neon-border-purple bg-ink/90 text-purple hover:bg-purple/20 transition-colors"
            >
              {isFullscreen ? <FullscreenExitIcon className="size-5" /> : <FullscreenEnterIcon className="size-5" />}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              title={muted ? "Unmute" : "Mute"}
              className="btn-arcade pointer-events-auto grid size-10 place-items-center neon-border-pink bg-ink/90 text-pink"
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          </div>

          {best > 0 && (
            <div className="rotate-1 neon-border-cyan bg-ink/90 px-3 py-1.5 text-right sm:px-4 sm:py-2">
              <div className="text-cyan/60 text-[9px] sm:text-[10px] font-bold tracking-[0.22em]">BEST</div>
              <div className="font-arcade text-cyan text-2xl leading-tight sm:text-3xl">{best}</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content & Briefing */}
      <div className="flex flex-col items-start justify-between gap-3.5 pt-2 sm:flex-row sm:items-end">
        <div
          className="animate-fade-up pointer-events-none max-w-md neon-border-pink bg-ink/90 p-3.5 sm:p-5 text-paper backdrop-blur-xs"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="font-arcade text-pink text-xs sm:text-sm tracking-wide">MISSION BRIEFING</div>
          <ul className="mt-2.5 space-y-2 text-[12px] sm:text-[13px] leading-snug">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                <strong className="font-semibold text-cyan">Touch Left/Right pads, drag screen, or tilt phone</strong> to steer around the tunnel.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                Avoid <strong className="font-semibold text-pink">red obstacles</strong> unless using <strong className="text-orange-400">Hyper Boost</strong> to ram through!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                Grab <strong className="font-semibold text-cyan">cyan gems</strong> in quick succession for up to <strong className="text-pink">x5 Combo</strong>!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                Equip <strong className="text-emerald-400">🛡️ Shield</strong>, <strong className="text-amber-400">🧲 Magnet</strong>, and <strong className="text-orange-400">🚀 Boost</strong> power-ups!
              </span>
            </li>
          </ul>
        </div>

        {/* Start Button Area */}
        <div className="animate-fade-up flex flex-col items-start gap-2 sm:items-end" style={{ animationDelay: "0.28s" }}>
          <button
            type="button"
            onClick={onStart}
            className="btn-arcade pointer-events-auto bg-cyan px-9 py-3.5 sm:px-12 sm:py-4 font-arcade text-ink text-2xl sm:text-3xl leading-none shadow-[0_0_25px_#00f0ff] hover:bg-white hover:text-cyan active:scale-95"
          >
            START
          </button>
          <span className="text-cyan text-[10px] sm:text-[11px] font-bold tracking-[0.2em] opacity-80">
            {isTouch ? "TAP START TO PLAY" : "OR PRESS SPACE"}
          </span>
        </div>
      </div>
    </div>
  );
}
