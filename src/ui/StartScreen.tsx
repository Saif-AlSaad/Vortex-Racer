import { SpeakerOffIcon, SpeakerOnIcon, StarIcon } from "./Icons";

interface StartScreenProps {
  best: number;
  muted: boolean;
  onToggleMute: () => void;
  onStart: () => void;
}

export default function StartScreen({ best, muted, onToggleMute, onStart }: StartScreenProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="animate-title-drop">
          <div className="mb-3 inline-block bg-purple px-3 py-1 font-arcade text-paper text-[11px] sm:text-xs shadow-[0_0_10px_#7000ff]">
            NEON · HIGHSPEED · DODGE
          </div>
          <h1
            className="font-arcade leading-[0.82] tracking-tight"
            style={{ fontSize: "clamp(3rem, 12vw, 8rem)" }}
          >
            <span className="neon-text-pink block">VORTEX</span>
            <span className="neon-text-cyan block mt-1">RACER</span>
          </h1>
        </div>

        {best > 0 && (
          <div className="mt-1 rotate-2 neon-border-cyan bg-ink/90 px-4 py-2.5 text-right sm:mt-2">
            <div className="text-cyan/60 text-[10px] font-bold tracking-[0.24em]">BEST</div>
            <div className="font-arcade text-cyan text-3xl leading-tight sm:text-4xl">{best}</div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div
          className="animate-fade-up pointer-events-none max-w-md neon-border-pink bg-ink/90 p-4 text-paper sm:p-5"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="font-arcade text-pink text-sm tracking-wide">MISSION</div>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-snug sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                <strong className="font-semibold text-cyan">Drag horizontally or use arrow keys</strong> to rotate the tunnel.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                Avoid <strong className="font-semibold text-pink">red obstacles</strong>. Hit one and your ship explodes.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 text-pink">❖</span>
              <span>
                Collect <strong className="font-semibold text-cyan">cyan gems</strong> for points and speed boosts!
              </span>
            </li>
          </ul>
        </div>

        <div className="animate-fade-up flex flex-col items-start gap-3 sm:items-end" style={{ animationDelay: "0.28s" }}>
          <button
            type="button"
            onClick={onStart}
            className="btn-arcade pointer-events-auto bg-cyan px-10 py-4 font-arcade text-ink text-2xl leading-none shadow-[0_0_20px_#00f0ff] hover:bg-white hover:text-cyan sm:px-12 sm:text-3xl"
          >
            START
          </button>
          <div className="flex items-center gap-3">
            <span className="text-cyan text-[11px] font-bold tracking-[0.2em] opacity-80">
              OR PRESS SPACE
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute sound" : "Mute sound"}
              className="btn-arcade pointer-events-auto grid size-10 place-items-center neon-border-pink bg-ink/90 text-pink"
            >
              {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
