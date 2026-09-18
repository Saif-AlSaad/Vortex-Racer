import { useState, useEffect, useCallback } from "react";
import type { GameResult } from "../game/engine";
import {
  CheckIcon,
  CopyIcon,
  FlameIcon,
  GaugeIcon,
  ReplayIcon,
  RocketIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from "./Icons";

interface GameOverScreenProps {
  result: GameResult;
  onRetry: () => void;
  onMenu: () => void;
}

function getRank(score: number, distance: number) {
  if (score >= 1200 || distance >= 3000) {
    return {
      grade: "S",
      title: "CYBER ACE",
      color: "text-amber-400 border-amber-400 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.6)]",
    };
  }
  if (score >= 700 || distance >= 1800) {
    return {
      grade: "A",
      title: "VORTEX ELITE",
      color: "text-pink border-pink bg-pink/15 shadow-[0_0_18px_rgba(255,0,85,0.6)]",
    };
  }
  if (score >= 350 || distance >= 900) {
    return {
      grade: "B",
      title: "INTERCEPTOR",
      color: "text-purple border-purple bg-purple/15 shadow-[0_0_15px_rgba(112,0,255,0.6)]",
    };
  }
  return {
    grade: "C",
    title: "CADET",
    color: "text-cyan border-cyan bg-cyan/15 shadow-[0_0_15px_rgba(0,240,255,0.5)]",
  };
}

export default function GameOverScreen({ result, onRetry, onMenu }: GameOverScreenProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const rank = getRank(result.score, result.distance);

  const copyFlightLog = useCallback(() => {
    const text = [
      "⚡ VORTEX RACER // FLIGHT LOG ⚡",
      `🏆 Score: ${result.score}${result.newBest ? " (NEW BEST!)" : ""}`,
      `🎖️ Rank: [${rank.grade}] ${rank.title}`,
      `📍 Distance: ${result.distance.toLocaleString()} M`,
      `🚀 Top Velocity: ${result.topSpeed} KM/H`,
      `🔥 Max Combo: x${result.maxCombo}`,
      `💎 Gems: ${result.gemsCollected} | 💥 Walls Smashed: ${result.wallsSmashed}`,
      "🎮 Play: https://saif-alsaad.github.io/Vortex-Racer/",
    ].join("\n");

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }).catch(() => {});
    }
  }, [result, rank]);

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-ink/90 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="animate-fade-in absolute inset-0" aria-hidden />

      <div className="animate-fade-up relative w-full max-w-lg neon-border-pink bg-ink/95 p-4 sm:p-7 shadow-[0_0_35px_rgba(255,0,85,0.3)] my-auto">
        {/* Cockpit corner ticks */}
        <div className="absolute -top-1 -left-1 size-3 border-t-2 border-l-2 border-pink" />
        <div className="absolute -top-1 -right-1 size-3 border-t-2 border-r-2 border-pink" />
        <div className="absolute -bottom-1 -left-1 size-3 border-b-2 border-l-2 border-pink" />
        <div className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-pink" />

        {/* New Best Badge */}
        {result.newBest && (
          <div className="absolute -right-2 -top-3 sm:-right-3 sm:-top-4 flex items-center gap-1.5 bg-cyan px-3 py-1 font-arcade text-ink text-xs sm:text-sm shadow-[0_0_15px_#00f0ff] animate-bounce">
            <StarIcon className="size-3.5 sm:size-4" /> NEW BEST!
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-pink/30 pb-2.5">
          <div>
            <div className="text-[9px] font-mono tracking-[0.25em] text-pink/70">
              MISSION DEBRIEF // TELEMETRY
            </div>
            <div className="font-arcade text-pink text-base sm:text-lg neon-text-pink leading-tight">
              CRITICAL FAILURE
            </div>
          </div>

          {/* Rank Badge */}
          <div
            className={`flex items-center gap-2 border px-2.5 py-1 rounded-md ${rank.color}`}
            title={`Pilot Grade: ${rank.grade} - ${rank.title}`}
          >
            <TrophyIcon className="size-4 shrink-0" />
            <div className="flex flex-col text-right">
              <span className="font-arcade text-xs sm:text-sm leading-none">{rank.grade}-RANK</span>
              <span className="text-[8px] font-mono font-bold tracking-wider opacity-80">
                {rank.title}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Scores Row */}
        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 items-end">
          <div>
            <div className="text-cyan/70 text-[9px] sm:text-[10px] font-bold tracking-[0.22em]">
              FINAL SCORE
            </div>
            <div
              className="font-arcade neon-text-cyan leading-none mt-0.5"
              style={{ fontSize: "clamp(2.4rem, 10vw, 3.8rem)" }}
            >
              {result.score}
            </div>
          </div>

          <div className="text-right border-l border-purple/30 pl-3">
            <div className="text-purple/80 text-[9px] sm:text-[10px] font-bold tracking-[0.22em]">
              BEST RECORD
            </div>
            <div
              className={`font-arcade text-2xl sm:text-3xl leading-none mt-1 ${
                result.newBest ? "text-cyan neon-text-cyan" : "text-paper"
              }`}
            >
              {result.best}
            </div>
          </div>
        </div>

        {/* Flight Telemetry Black Box Grid */}
        <div className="mt-4 sm:mt-5">
          <div className="text-[9px] font-mono tracking-widest text-cyan/60 mb-1.5 flex items-center gap-1.5">
            <span className="inline-block size-1.5 bg-cyan rounded-full animate-ping" />
            <span>BLACK BOX FLIGHT LOG</span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* Distance */}
            <div className="flex flex-col rounded-lg border border-cyan/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan/70 font-semibold tracking-wider">
                DISTANCE
              </span>
              <span className="font-arcade text-xs sm:text-sm text-cyan mt-0.5">
                {result.distance.toLocaleString()} M
              </span>
            </div>

            {/* Top Velocity */}
            <div className="flex flex-col rounded-lg border border-amber-400/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-amber-300/70 font-semibold tracking-wider flex items-center gap-1">
                <GaugeIcon className="size-2.5" /> TOP SPEED
              </span>
              <span className="font-arcade text-xs sm:text-sm text-amber-300 mt-0.5">
                {result.topSpeed} KM/H
              </span>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col rounded-lg border border-pink/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-pink/70 font-semibold tracking-wider flex items-center gap-1">
                <FlameIcon className="size-2.5" /> MAX COMBO
              </span>
              <span className="font-arcade text-xs sm:text-sm text-pink mt-0.5">
                x{result.maxCombo}
              </span>
            </div>

            {/* Gems Harvested */}
            <div className="flex flex-col rounded-lg border border-cyan/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-cyan/70 font-semibold tracking-wider">
                GEMS CAUGHT
              </span>
              <span className="font-arcade text-xs sm:text-sm text-paper mt-0.5">
                {result.gemsCollected}
              </span>
            </div>

            {/* Walls Smashed */}
            <div className="flex flex-col rounded-lg border border-orange-500/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-orange-400/70 font-semibold tracking-wider flex items-center gap-1">
                <RocketIcon className="size-2.5" /> SMASHED
              </span>
              <span className="font-arcade text-xs sm:text-sm text-orange-400 mt-0.5">
                {result.wallsSmashed}
              </span>
            </div>

            {/* Power-Ups */}
            <div className="flex flex-col rounded-lg border border-emerald-400/25 bg-ink/80 p-2 backdrop-blur-xs">
              <span className="text-[8px] sm:text-[9px] font-mono text-emerald-400/70 font-semibold tracking-wider flex items-center gap-1">
                <ShieldIcon className="size-2.5" /> POWER-UPS
              </span>
              <span className="font-arcade text-xs sm:text-sm text-emerald-300 mt-0.5">
                {result.powerUpsUsed}
              </span>
            </div>
          </div>
        </div>

        {/* Share Flight Log Button */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={copyFlightLog}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-mono font-bold tracking-wider transition-all active:scale-98 ${
              copied
                ? "border-emerald-400 bg-emerald-400/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)]"
                : "border-cyan/40 bg-ink/90 text-cyan/90 hover:bg-cyan/15 hover:border-cyan"
            }`}
          >
            {copied ? (
              <>
                <CheckIcon className="size-4 text-emerald-400" />
                <span>FLIGHT LOG COPIED TO CLIPBOARD!</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-4 text-cyan" />
                <span>COPY FLIGHT LOG / SHARE STATS</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="btn-arcade flex items-center gap-2.5 bg-pink px-6 py-3.5 font-arcade text-white text-base sm:text-lg leading-none shadow-[0_0_18px_#ff0055] hover:bg-white hover:text-pink active:scale-95"
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
            <span className="ml-auto text-cyan/40 text-[10px] font-bold tracking-[0.2em]">
              SPACE = RETRY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
