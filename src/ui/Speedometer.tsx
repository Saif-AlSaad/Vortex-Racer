import React from "react";
import { FlameIcon, GaugeIcon } from "./Icons";

interface SpeedometerProps {
  speed: number;
  distance: number;
  isBoosting: boolean;
  className?: string;
}

export default function Speedometer({
  speed,
  distance,
  isBoosting,
  className = "",
}: SpeedometerProps) {
  // Speed mapped to 0..1 ratio (min 30 to max ~180 km/h)
  const minSpeed = 30;
  const maxSpeed = 180;
  const speedRatio = Math.max(0, Math.min(1, (speed - minSpeed) / (maxSpeed - minSpeed)));

  // SVG Arc calculations
  // Radius = 44, circumference = 2 * PI * 44 ≈ 276.46
  // Arc angle span = 240 degrees (2/3 of circle)
  // Arc length = 276.46 * (240 / 360) ≈ 184.3
  const circumference = 276.46;
  const arcLength = 184.3;
  const strokeOffset = arcLength * (1 - speedRatio);

  // Dynamic color palette based on speed / boost
  const isRedline = isBoosting || speed >= 135;
  const isHigh = speed >= 85 && !isRedline;

  const accentColor = isRedline
    ? "text-pink drop-shadow-[0_0_12px_rgba(255,0,85,0.9)]"
    : isHigh
    ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"
    : "text-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]";

  const strokeColor = isRedline
    ? "#ff0055"
    : isHigh
    ? "#f59e0b"
    : "#00f0ff";

  return (
    <div
      className={`pointer-events-none relative flex flex-col items-center select-none ${className}`}
      aria-label={`Velocity: ${speed} kilometers per hour, Distance: ${distance} meters`}
    >
      {/* Outer Cockpit Instrument Shell */}
      <div className="relative flex flex-col items-center rounded-2xl border border-cyan/20 bg-ink/80 px-3 py-2 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {/* Cockpit corner accents */}
        <div className="absolute -top-1 -left-1 size-2 border-t-2 border-l-2 border-cyan/80" />
        <div className="absolute -top-1 -right-1 size-2 border-t-2 border-r-2 border-cyan/80" />
        <div className="absolute -bottom-1 -left-1 size-2 border-b-2 border-l-2 border-cyan/80" />
        <div className="absolute -bottom-1 -right-1 size-2 border-b-2 border-r-2 border-cyan/80" />

        {/* Gauge Header */}
        <div className="flex w-full items-center justify-between gap-2 px-1 pb-1">
          <div className="flex items-center gap-1 text-[9px] font-bold tracking-widest text-cyan/70">
            <GaugeIcon className="size-3 text-cyan" />
            <span>VELOCITY</span>
          </div>

          {isRedline && (
            <div className="animate-pulse flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-pink/25 border border-pink text-[8px] font-arcade text-pink shadow-[0_0_10px_#ff0055]">
              <FlameIcon className="size-2.5 text-pink" />
              <span>OVERDRIVE</span>
            </div>
          )}
        </div>

        {/* Circular Dial & Center Readout */}
        <div className="relative size-24 sm:size-28 flex items-center justify-center">
          <svg className="size-full -rotate-[210deg] transform" viewBox="0 0 120 120">
            {/* Background Arc Track */}
            <circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke="#0f0926"
              strokeWidth="7"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Tick grid marks background */}
            <circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke="rgba(0, 240, 255, 0.15)"
              strokeWidth="7"
              strokeDasharray="2 6"
              strokeLinecap="butt"
            />
            {/* Dynamic Active Velocity Arc */}
            <circle
              cx="60"
              cy="60"
              r="44"
              fill="none"
              stroke={strokeColor}
              strokeWidth="7.5"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset,stroke] duration-150 ease-out"
              style={{
                filter: isRedline
                  ? "drop-shadow(0 0 8px #ff0055)"
                  : isHigh
                  ? "drop-shadow(0 0 6px #f59e0b)"
                  : "drop-shadow(0 0 6px #00f0ff)",
              }}
            />
          </svg>

          {/* Center Digital Speed Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span
              className={`font-arcade text-2xl sm:text-3xl leading-none tracking-tight transition-colors duration-200 ${accentColor}`}
            >
              {speed}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-paper/60 mt-0.5">
              KM/H
            </span>
          </div>
        </div>

        {/* Distance Odometer Readout */}
        <div className="mt-1 flex w-full items-center justify-between border-t border-cyan/15 pt-1.5 px-1 font-mono text-[9px] sm:text-[10px] text-cyan/90">
          <span className="tracking-wider text-cyan/50 font-bold">DIST:</span>
          <span className="font-arcade tracking-wider text-cyan">{distance.toLocaleString()} M</span>
        </div>
      </div>
    </div>
  );
}
