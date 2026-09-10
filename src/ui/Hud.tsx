import {
  FullscreenEnterIcon,
  FullscreenExitIcon,
  GyroIcon,
  SpeakerOffIcon,
  SpeakerOnIcon,
  SteerLeftIcon,
  SteerRightIcon,
} from "./Icons";

interface HudProps {
  score: number;
  best: number;
  showHint: boolean;
  muted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  tiltEnabled: boolean;
  onToggleTilt: () => void;
  onSteerLeft: (active: boolean) => void;
  onSteerRight: (active: boolean) => void;
}

export default function Hud({
  score,
  best,
  showHint,
  muted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  tiltEnabled,
  onToggleTilt,
  onSteerLeft,
  onSteerRight,
}: HudProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between">
        {/* Best Score Badge */}
        <div className="-rotate-2 neon-border-cyan bg-ink/85 px-3 py-1.5 backdrop-blur-xs">
          <div className="text-cyan/60 text-[10px] font-bold tracking-[0.22em]">BEST</div>
          <div className="font-arcade text-cyan text-xl leading-tight">{best}</div>
        </div>

        {/* Current Score */}
        <div className="flex flex-col items-center">
          <div
            key={score}
            className="animate-score-pop font-arcade neon-text-cyan leading-none"
            style={{ fontSize: "clamp(2.8rem, 8vw, 5rem)" }}
          >
            {score}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Gyro/Tilt Toggle */}
          <button
            type="button"
            data-no-drag="true"
            onClick={onToggleTilt}
            aria-label={tiltEnabled ? "Disable tilt steering" : "Enable tilt steering"}
            title={tiltEnabled ? "Tilt steering ON" : "Tilt steering OFF"}
            className={`grid size-11 place-items-center transition-colors backdrop-blur-xs ${
              tiltEnabled
                ? "neon-border-cyan bg-cyan/25 text-cyan"
                : "neon-border-cyan bg-ink/85 text-cyan/60 hover:text-cyan hover:bg-cyan/15"
            }`}
          >
            <GyroIcon className="size-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            data-no-drag="true"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="grid size-11 place-items-center neon-border-purple bg-ink/85 text-purple hover:bg-purple/20 transition-colors backdrop-blur-xs"
          >
            {isFullscreen ? <FullscreenExitIcon className="size-5" /> : <FullscreenEnterIcon className="size-5" />}
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            data-no-drag="true"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Unmute" : "Mute"}
            className="grid size-11 place-items-center neon-border-pink bg-ink/85 text-pink hover:bg-pink/20 transition-colors backdrop-blur-xs"
          >
            {muted ? <SpeakerOffIcon className="size-5" /> : <SpeakerOnIcon className="size-5" />}
          </button>
        </div>
      </div>

      {/* Middle Hint */}
      {showHint && (
        <div className="flex justify-center pb-2">
          <div className="animate-hint neon-border-cyan bg-ink/85 px-4 py-2 text-cyan/95 text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-center backdrop-blur-xs shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            HOLD SIDES OR SWIPE TO STEER
          </div>
        </div>
      )}

      {/* Bottom Virtual Steering Controls */}
      <div className="flex items-end justify-between pb-1 sm:pb-3">
        {/* Steer Left Touch Pad */}
        <button
          type="button"
          data-no-drag="true"
          aria-label="Steer Left"
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerLeft(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onSteerLeft(false);
          }}
          onPointerLeave={() => onSteerLeft(false)}
          onPointerCancel={() => onSteerLeft(false)}
          className="pointer-events-auto flex size-20 sm:size-24 flex-col items-center justify-center rounded-2xl neon-border-cyan bg-ink/80 text-cyan backdrop-blur-xs transition-all active:scale-95 active:bg-cyan/35 shadow-[0_0_18px_rgba(0,240,255,0.4)]"
        >
          <SteerLeftIcon className="size-8 sm:size-10" />
          <span className="font-arcade text-[10px] sm:text-xs tracking-widest mt-0.5">LEFT</span>
        </button>

        {/* Steer Right Touch Pad */}
        <button
          type="button"
          data-no-drag="true"
          aria-label="Steer Right"
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerRight(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            onSteerRight(false);
          }}
          onPointerLeave={() => onSteerRight(false)}
          onPointerCancel={() => onSteerRight(false)}
          className="pointer-events-auto flex size-20 sm:size-24 flex-col items-center justify-center rounded-2xl neon-border-pink bg-ink/80 text-pink backdrop-blur-xs transition-all active:scale-95 active:bg-pink/35 shadow-[0_0_18px_rgba(255,0,85,0.4)]"
        >
          <SteerRightIcon className="size-8 sm:size-10" />
          <span className="font-arcade text-[10px] sm:text-xs tracking-widest mt-0.5">RIGHT</span>
        </button>
      </div>
    </div>
  );
}
