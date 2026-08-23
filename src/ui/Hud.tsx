import { SpeakerOffIcon, SpeakerOnIcon } from "./Icons";

interface HudProps {
  score: number;
  best: number;
  showHint: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export default function Hud({ score, best, showHint, muted, onToggleMute }: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-x-0 top-3 flex flex-col items-center sm:top-5">
        <div
          key={score}
          className="animate-score-pop font-arcade neon-text-cyan leading-none"
          style={{ fontSize: "clamp(3rem, 10vw, 5.5rem)" }}
        >
          {score}
        </div>
      </div>

      <div className="absolute left-3 top-3 -rotate-2 neon-border-cyan bg-ink/85 px-3 py-1.5 sm:left-5 sm:top-5">
        <div className="text-cyan/60 text-[10px] font-bold tracking-[0.22em]">BEST</div>
        <div className="font-arcade text-cyan text-xl leading-tight">{best}</div>
      </div>

      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        className="pointer-events-auto absolute right-3 top-3 grid size-11 place-items-center neon-border-pink bg-ink/85 text-pink transition-colors hover:bg-pink/20 sm:right-5 sm:top-5"
      >
        {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
      </button>

      {showHint && (
        <div className="absolute inset-x-0 bottom-10 flex justify-center sm:bottom-12">
          <div className="animate-hint neon-border-cyan bg-ink/75 px-4 py-2 text-cyan/90 text-[11px] font-semibold tracking-[0.24em]">
            DRAG OR ⬅ / ➡ TO STEER
          </div>
        </div>
      )}
    </div>
  );
}
