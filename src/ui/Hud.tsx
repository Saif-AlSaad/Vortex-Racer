import type { PowerUpState, TelemetryData } from "../game/engine";
import Speedometer from "./Speedometer";
import {
  BoltIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  GyroIcon,
  HazardIcon,
  MagnetIcon,
  RocketIcon,
  ShieldIcon,
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
  combo: number;
  comboPercent: number;
  powerUps: PowerUpState;
  telemetry: TelemetryData;
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
  combo,
  comboPercent,
  powerUps,
  telemetry,
}: HudProps) {
  const hasActivePowerUp =
    powerUps.shield || powerUps.magnetTime > 0 || powerUps.boostTime > 0;
  const hazard = telemetry.proximityWarning;


  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden">
      {/* Sci-Fi Cockpit Reticle & Border Accents */}
      <div className="pointer-events-none absolute inset-2 sm:inset-4 border border-cyan/10 rounded-2xl sm:rounded-3xl">
        {/* Top Left Bracket */}
        <div className="absolute -top-1 -left-1 size-4 sm:size-6 border-t-2 border-l-2 border-cyan shadow-[0_0_8px_#00f0ff]" />
        <div className="absolute top-1 left-5 sm:left-7 text-[8px] font-mono text-cyan/50 tracking-widest hidden sm:block">
          SYS:ACTIVE // NAV-LOCK
        </div>

        {/* Top Right Bracket */}
        <div className="absolute -top-1 -right-1 size-4 sm:size-6 border-t-2 border-r-2 border-purple shadow-[0_0_8px_#7000ff]" />
        <div className="absolute top-1 right-5 sm:right-7 text-[8px] font-mono text-purple/50 tracking-widest hidden sm:block">
          SECTOR-01 // FLOW
        </div>

        {/* Bottom Left Bracket */}
        <div className="absolute -bottom-1 -left-1 size-4 sm:size-6 border-b-2 border-l-2 border-cyan shadow-[0_0_8px_#00f0ff]" />

        {/* Bottom Right Bracket */}
        <div className="absolute -bottom-1 -right-1 size-4 sm:size-6 border-b-2 border-r-2 border-pink shadow-[0_0_8px_#ff0055]" />
      </div>

      {/* Tactical Hazard Proximity Warning */}
      {hazard && (
        <div className="animate-hazard pointer-events-none absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-xl border-2 border-pink bg-ink/90 px-3.5 py-1.5 sm:px-4 sm:py-2 text-pink shadow-[0_0_25px_#ff0055] backdrop-blur-md">
          <HazardIcon className="size-4 sm:size-5 text-pink shrink-0" />
          <div className="flex flex-col items-center">
            <span className="font-arcade text-[10px] sm:text-xs tracking-wider">
              {hazard.direction === "center"
                ? "⚠ IMPACT WARNING"
                : hazard.direction === "left"
                ? "◀ OBSTACLE LEFT"
                : "OBSTACLE RIGHT ▶"}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-paper/80">
              RANGE: {hazard.distance}M ·{" "}
              {hazard.direction === "center"
                ? "EVADE NOW"
                : hazard.direction === "left"
                ? "STEER RIGHT"
                : "STEER LEFT"}
            </span>
          </div>
        </div>
      )}

      {/* Top Section */}
      <div className="relative z-10 flex flex-col gap-2.5">
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

        {/* Dynamic Status: Combo Multiplier & Active Power-Ups */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {/* Combo Multiplier Badge */}
          {combo > 1 && (
            <div className="animate-score-pop flex flex-col items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 bg-ink/90 rounded-full backdrop-blur-xs shadow-[0_0_15px_#00f0ff] ${
                  combo >= 5
                    ? "border-2 border-pink text-pink shadow-[0_0_20px_#ff0055]"
                    : "neon-border-cyan text-cyan"
                }`}
              >
                <BoltIcon className="size-4 animate-pulse" />
                <span className="font-arcade text-xs sm:text-sm tracking-wider">
                  x{combo} {combo >= 5 ? "MAX COMBO!" : "COMBO"}
                </span>
              </div>
              <div className="w-24 h-1.5 bg-ink/80 rounded-full mt-1 overflow-hidden border border-cyan/40">
                <div
                  className={`h-full transition-all duration-75 ease-linear ${
                    combo >= 5 ? "bg-pink shadow-[0_0_8px_#ff0055]" : "bg-cyan shadow-[0_0_8px_#00f0ff]"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(1, comboPercent)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Active Power-Ups Badges */}
          {hasActivePowerUp && (
            <div className="flex items-center gap-2">
              {/* Plasma Shield */}
              {powerUps.shield && (
                <div className="animate-fade-in flex items-center gap-1.5 px-2.5 py-1 rounded-md border-2 border-emerald-400 bg-ink/90 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] backdrop-blur-xs">
                  <ShieldIcon className="size-4 animate-pulse text-emerald-400" />
                  <span className="font-arcade text-[10px] sm:text-xs tracking-wide">SHIELD</span>
                </div>
              )}

              {/* Vortex Magnet */}
              {powerUps.magnetTime > 0 && (
                <div className="animate-fade-in flex items-center gap-1.5 px-2.5 py-1 rounded-md border-2 border-amber-400 bg-ink/90 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)] backdrop-blur-xs">
                  <MagnetIcon className="size-4 animate-spin text-amber-400" style={{ animationDuration: "3s" }} />
                  <span className="font-arcade text-[10px] sm:text-xs tracking-wide">
                    MAGNET {powerUps.magnetTime.toFixed(1)}s
                  </span>
                </div>
              )}

              {/* Hyper Boost */}
              {powerUps.boostTime > 0 && (
                <div className="animate-fade-in flex items-center gap-1.5 px-2.5 py-1 rounded-md border-2 border-orange-500 bg-ink/90 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.8)] backdrop-blur-xs">
                  <RocketIcon className="size-4 text-orange-400 animate-bounce" />
                  <span className="font-arcade text-[10px] sm:text-xs tracking-wide">
                    HYPER BOOST {powerUps.boostTime.toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Hint */}
      {showHint && (
        <div className="relative z-10 flex justify-center pb-2">
          <div className="animate-hint neon-border-cyan bg-ink/85 px-4 py-2 text-cyan/95 text-[11px] sm:text-xs font-semibold tracking-[0.24em] text-center backdrop-blur-xs shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            HOLD SIDES OR SWIPE TO STEER
          </div>
        </div>
      )}

      {/* Bottom Cockpit Steering Controls & Speedometer */}
      <div className="relative z-10 flex items-end justify-between gap-2 pb-1 sm:pb-3">
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
          className="pointer-events-auto flex size-18 sm:size-24 shrink-0 flex-col items-center justify-center rounded-2xl neon-border-cyan bg-ink/80 text-cyan backdrop-blur-xs transition-all active:scale-95 active:bg-cyan/35 shadow-[0_0_18px_rgba(0,240,255,0.4)]"
        >
          <SteerLeftIcon className="size-7 sm:size-10" />
          <span className="font-arcade text-[9px] sm:text-xs tracking-widest mt-0.5">LEFT</span>
        </button>

        {/* Center Cockpit Speedometer Gauge */}
        <Speedometer
          speed={telemetry.speed}
          distance={telemetry.distance}
          isBoosting={telemetry.isBoosting}
          className="pb-0.5"
        />

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
          className="pointer-events-auto flex size-18 sm:size-24 shrink-0 flex-col items-center justify-center rounded-2xl neon-border-pink bg-ink/80 text-pink backdrop-blur-xs transition-all active:scale-95 active:bg-pink/35 shadow-[0_0_18px_rgba(255,0,85,0.4)]"
        >
          <SteerRightIcon className="size-7 sm:size-10" />
          <span className="font-arcade text-[9px] sm:text-xs tracking-widest mt-0.5">RIGHT</span>
        </button>
      </div>
    </div>
  );
}
