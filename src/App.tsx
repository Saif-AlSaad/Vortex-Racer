import { useCallback, useEffect, useRef, useState } from "react";
import {
  BEST_KEY,
  MUTE_KEY,
  VortexEngine,
  type GameResult,
  type PowerUpState,
  type TelemetryData,
} from "./game/engine";
import Hud from "./ui/Hud";
import StartScreen from "./ui/StartScreen";
import GameOverScreen from "./ui/GameOverScreen";
import PauseMenu from "./ui/PauseMenu";

type Phase = "menu" | "playing" | "over";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VortexEngine | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const [result, setResult] = useState<GameResult | null>(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === "1");
  const [showHint, setShowHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && Boolean(document.fullscreenElement)
  );
  const [tiltEnabled, setTiltEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Hyperspeed: Combo and Power-Up states
  const [combo, setCombo] = useState(1);
  const [comboPercent, setComboPercent] = useState(0);
  const [powerUps, setPowerUps] = useState<PowerUpState>({
    shield: false,
    magnetTime: 0,
    boostTime: 0,
  });

  // Cockpit Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 40,
    baseSpeed: 40,
    distance: 0,
    isBoosting: false,
    proximityWarning: null,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const engine = new VortexEngine(el, {
      onScore: (s: number) => {
        setScore(s);
        if (s > 0) setShowHint(false);
      },
      onGameOver: (r: GameResult) => {
        setResult(r);
        setBest(r.best);
        setIsPaused(false);
        setPhase("over");
      },
      onCombo: (c: number, percent: number) => {
        setCombo(c);
        setComboPercent(percent);
      },
      onPowerUps: (pu: PowerUpState) => {
        setPowerUps(pu);
      },
      onTelemetry: (t: TelemetryData) => {
        setTelemetry(t);
      },
    });
    engine.setMuted(localStorage.getItem(MUTE_KEY) === "1");
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    engineRef.current?.startGame();
    setPhase("playing");
    setIsPaused(false);
    setScore(0);
    setResult(null);
    setShowHint(true);
    setCombo(1);
    setComboPercent(0);
    setPowerUps({ shield: false, magnetTime: 0, boostTime: 0 });
    setTelemetry({
      speed: 40,
      baseSpeed: 40,
      distance: 0,
      isBoosting: false,
      proximityWarning: null,
    });
  }, []);

  const toMenu = useCallback(() => {
    engineRef.current?.toMenu();
    setIsPaused(false);
    setPhase("menu");
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resumeGame();
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    if (phase !== "playing") return;
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        engineRef.current?.pauseGame();
      } else {
        engineRef.current?.resumeGame();
      }
      return next;
    });
  }, [phase]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      engineRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleTilt = useCallback(() => {
    setTiltEnabled((prev) => {
      const next = !prev;
      engineRef.current?.setTiltEnabled(next);
      return next;
    });
  }, []);

  const steerLeft = useCallback((active: boolean) => {
    engineRef.current?.steerLeft(active);
  }, []);

  const steerRight = useCallback((active: boolean) => {
    engineRef.current?.steerRight(active);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === "BUTTON") return;
      if (e.code === "Escape" || e.code === "KeyP") {
        if (phase === "playing") {
          e.preventDefault();
          togglePause();
          return;
        }
      }
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (isPaused) {
        e.preventDefault();
        resume();
        return;
      }
      if (phase === "menu" || phase === "over") {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, isPaused, start, resume, togglePause]);

  return (
    <div ref={containerRef} className="relative h-dvh w-screen touch-none overflow-hidden select-none bg-ink">
      {phase !== "menu" && (
        <Hud
          score={score}
          best={best}
          showHint={showHint && phase === "playing"}
          muted={muted}
          onToggleMute={toggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          tiltEnabled={tiltEnabled}
          onToggleTilt={toggleTilt}
          onSteerLeft={steerLeft}
          onSteerRight={steerRight}
          combo={combo}
          comboPercent={comboPercent}
          powerUps={powerUps}
          telemetry={telemetry}
          isPaused={isPaused}
          onTogglePause={togglePause}
        />
      )}

      {phase === "playing" && isPaused && (
        <PauseMenu
          score={score}
          best={best}
          distance={telemetry.distance}
          onResume={resume}
          onRestart={start}
          onMenu={toMenu}
        />
      )}

      {phase === "menu" && (
        <StartScreen
          best={best}
          muted={muted}
          onToggleMute={toggleMute}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onStart={start}
        />
      )}

      {phase === "over" && result && (
        <GameOverScreen result={result} onRetry={start} onMenu={toMenu} />
      )}
    </div>
  );
}
