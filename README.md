# VORTEX RACER

A neon, arcade-style endless tunnel racer built with **React + Three.js**. Pilot your ship through an infinite wireframe vortex, dodge red obstacles, and collect cyan gems to chase the high score — all rendered with retro synthwave visuals, bloom glow, and procedural sound.

🎮 **Play it live:** [https://saif-alsaad.github.io/Vortex-Racer/](https://saif-alsaad.github.io/Vortex-Racer/)

---

## Gameplay

| Element | Description |
|---|---|
| 🚀 **Your ship** | A cyan cone hugging the inner wall of a spinning neon tunnel. |
| 🧱 **Red obstacles** | Solid crimson cubes. Touch one → your ship explodes → game over. |
| 💎 **Cyan gems** | Wireframe octahedrons worth **+10 points each**, plus a small speed boost. |
| ⚡ **Speed** | Starts at 40 u/s and ramps up forever — every gem makes you faster. |
| 🏆 **Best score** | Saved in `localStorage` so it survives page reloads. |

## Controls

| Input | Action |
|---|---|
| **Drag horizontally** (mouse / touch) | Steer around the tunnel wall |
| **← / →** or **A / D** | Keyboard steering |
| **Space** or **Enter** | Start / restart from menu & game-over screens |
| **Speaker button** | Toggle mute (persisted) |

## Tech Stack

- **[Vite](https://vite.dev/)** — dev server & build tool
- **[React 19](https://react.dev/)** + **TypeScript** — UI layer
- **[Three.js](https://threejs.org/)** — 3D rendering (`WebGLRenderer`, `EffectComposer`, `UnrealBloomPass`)
- **[Tailwind CSS 4](https://tailwindcss.com/)** — HUD & screen styling
- **Web Audio API** — 100% procedural sound effects (no audio files)
- **`vite-plugin-singlefile`** — bundles everything into one self-contained `index.html`

---

## Project Structure

```
VORTEX RACER/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI: builds & deploys to GitHub Pages on every push to main
├── src/
│   ├── App.tsx                 # Root component: game phase state machine (menu → playing → over),
│   │                           #   engine lifecycle, score/best/mute state, keyboard shortcuts
│   ├── main.tsx                # React entry point, mounts <App />
│   ├── index.css               # Tailwind import + custom theme (neon colors, arcade font,
│   │                           #   animations: score-pop, title-drop, fade-up, hint pulse)
│   ├── game/
│   │   ├── engine.ts           # ★ Core 3D game engine (see below)
│   │   └── audio.ts            # Procedural sound engine using Web Audio API (see below)
│   ├── ui/
│   │   ├── StartScreen.tsx     # Animated title screen: logo, mission briefing, best score, START
│   │   ├── Hud.tsx             # In-game overlay: big animated score, best badge, mute button, hint
│   │   ├── GameOverScreen.tsx  # "CRITICAL FAILURE" panel: final score, NEW BEST badge, retry/menu
│   │   └── Icons.tsx           # Inline SVG icon components (speaker, replay, star)
│   └── utils/
│       └── cn.ts               # className merge helper (clsx + tailwind-merge)
├── index.html                  # HTML shell; loads Google Fonts "Press Start 2P"
├── vite.config.ts              # Vite config: React, Tailwind, single-file plugin, Pages base path
├── tsconfig.json               # TypeScript settings ("@" path alias → ./src)
└── package.json                # Scripts: dev / build / preview
```

## Functionality Breakdown

### `src/game/engine.ts` — `VortexEngine` class

The heart of the game. Owns the entire Three.js scene and runs its own `requestAnimationFrame` loop, completely decoupled from React (React only receives events via callbacks).

**World construction (`buildWorld`)**
- Two long wireframe cylinders (300 units, radius 12) form the endless tunnel — they leapfrog each other forward and wrap around when they pass the camera, creating infinite flight.
- The ship is a 4-sided cone pinned to radius 10.5 inside the tunnel, with a pink wireframe cube as engine glow.
- Purple fog fades the far end of the tunnel; `UnrealBloomPass` adds neon glow.

**Ship movement**
- The ship's position is defined by an **angle** on the tunnel wall, not x/y.
- Input sets a `targetAngle`; the actual angle smoothly interpolates toward it (shortest-path wrap-around math), while the ship leans into turns.

**Camera**
- Trails near the tunnel center, lerps toward the ship's side of the tube, looks ahead into the distance — plus decaying random shake on crash.

**Obstacles & gems**
- Spawned ahead of the camera at random angles (25% chance gem).
- Collision test = angular difference between obstacle angle and ship angle (< ~0.25 rad) when the object passes z ≈ 0.
- Gems: +10 score, speed +2, cyan particle burst, chime. Walls: explosion, screen shake, game over.
- Objects behind the camera are recycled — a new one spawns ahead, keeping memory flat forever.

**Particles**
- Simple pooled cubes with velocity + lifespan, scaled down as they die. Used for gem pickups (cyan) and death explosions (magenta).

**Game state & persistence**
- Phases: `menu` (slow ambient drift), `playing`, `over`.
- Best score persisted under `localStorage["vortex.best.v1"]`; mute flag under `"vortex.muted.v1"`.
- Public API: `startGame()`, `toMenu()`, `setMuted()`, `dispose()`.

### `src/game/audio.ts` — `SoundKit` class

Zero asset files — every sound is synthesized at runtime with oscillators and noise buffers:
- **Engine hum** — a sawtooth oscillator whose pitch/volume track current game speed.
- **Gem chime** — two rising sine sweeps.
- **Crash** — filtered white-noise burst + descending sawtooth.
- **UI hover/click** — short square blips.
- Master gain handles mute with smooth ramping; context auto-resumes on first interaction (browser autoplay policy).

### `src/App.tsx`

Thin React shell around the engine:
- Renders `<canvas>` container + overlays per phase.
- Wires callbacks: `onScore` → HUD, `onGameOver` → result screen.
- Space/Enter starts or restarts the game from any non-playing phase.

---

## Getting Started

```bash
# install dependencies
npm install

# start dev server (http://localhost:5173)
npm run dev

# type-check-free production build → dist/index.html (single file)
npm run build

# preview the production build locally
npm run preview
```

## Deployment

Deploys automatically to **GitHub Pages** via `.github/workflows/deploy.yml` on every push to `main`. Requires Pages source set to **GitHub Actions** in repo Settings.

## Author

*Saif Al Saad* <br>
Bsc in *Software Engineering* <br>
Daffodil International University
*Built with ❤️, neon, and far too much bloom.*
