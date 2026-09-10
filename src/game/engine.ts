import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SoundKit } from "./audio";

export interface GameResult {
  score: number;
  best: number;
  newBest: boolean;
}

export interface PowerUpState {
  shield: boolean;
  magnetTime: number;
  boostTime: number;
}

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onGameOver: (result: GameResult) => void;
  onCombo?: (combo: number, timePercent: number) => void;
  onPowerUps?: (state: PowerUpState) => void;
}

export const BEST_KEY = "vortex.best.v1";
export const MUTE_KEY = "vortex.muted.v1";

const TUNNEL_RADIUS = 12;
const SHIP_RADIUS = 10.5;
const TUNNEL_LENGTH = 300;
const SEGMENTS = 32;
const WARP_COUNT = 90;

interface Obstacle {
  mesh: THREE.Mesh;
  angle: number;
  z: number;
  type: "wall" | "gem" | "shield" | "magnet" | "boost";
  active: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
}

export class VortexEngine {
  readonly sound = new SoundKit();

  private container: HTMLElement;
  private cb: EngineCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;

  private ship!: THREE.Mesh;
  private shipMaterial!: THREE.MeshBasicMaterial;
  private shipShield!: THREE.Mesh;
  private tunnel1!: THREE.Mesh;
  private tunnel2!: THREE.Mesh;

  // Warp starfield streaks
  private warpLines!: THREE.LineSegments;
  private warpPositions!: Float32Array;

  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];

  // Geometries & Materials
  private obsGeo = new THREE.BoxGeometry(2, 2, 2);
  private obsMat = new THREE.MeshBasicMaterial({ color: 0xff003c });
  private gemGeo = new THREE.OctahedronGeometry(1.2);
  private gemMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
  private shieldGeo = new THREE.IcosahedronGeometry(1.2);
  private shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true });
  private magnetGeo = new THREE.TorusGeometry(1.0, 0.35, 8, 16);
  private magnetMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
  private boostGeo = new THREE.DodecahedronGeometry(1.2);
  private boostMat = new THREE.MeshBasicMaterial({ color: 0xff3300, wireframe: true });
  private sparkGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

  private phase: "menu" | "playing" | "over" = "menu";
  private score = 0;
  private speed = 0;
  private baseSpeed = 40;
  private shipAngle = Math.PI / 2;
  private targetAngle = Math.PI / 2;
  private worldZ = 0;
  private baseFov = 75;

  // Power-Ups & Combo Multipliers
  private shieldActive = false;
  private magnetTimer = 0;
  private boostTimer = 0;
  private graceTimer = 0;
  private combo = 1;
  private comboTimer = 0;
  private readonly COMBO_DURATION = 2.6;

  private shake = 0;
  private lastTime = performance.now();
  private raf = 0;
  private disposed = false;
  private ro: ResizeObserver;

  // Inputs
  private pointerDown = false;
  private activePointerId: number | null = null;
  private lastPointerX = 0;
  private keys = { left: false, right: false, touchLeft: false, touchRight: false };

  // Mobile features
  private wakeLock: any = null;
  private tiltEnabled = false;
  private orientationListenerAttached = false;

  constructor(container: HTMLElement, cb: EngineCallbacks) {
    this.container = container;
    this.cb = cb;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 400);

    // Post-processing
    const renderScene = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.5,
      0.4,
      0.1
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    this.scene.fog = new THREE.Fog(0x050014, 50, TUNNEL_LENGTH * 0.8);

    this.buildWorld();
    this.buildWarpStarfield();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();

    this.setupInputs();
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private buildWorld() {
    // Tunnel
    const geo = new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, TUNNEL_LENGTH, SEGMENTS, 40, true);
    geo.rotateX(Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x7000ff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    this.tunnel1 = new THREE.Mesh(geo, mat);
    this.tunnel2 = new THREE.Mesh(geo, mat);
    this.tunnel1.position.z = -TUNNEL_LENGTH / 2;
    this.tunnel2.position.z = -TUNNEL_LENGTH * 1.5;
    this.scene.add(this.tunnel1);
    this.scene.add(this.tunnel2);

    // Ship
    const shipGeo = new THREE.ConeGeometry(1, 3, 4);
    shipGeo.rotateX(-Math.PI / 2);
    this.shipMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    this.ship = new THREE.Mesh(shipGeo, this.shipMaterial);

    // Engine glow
    const glowGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff00aa, wireframe: true });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.z = 1.5;
    this.ship.add(glow);

    // Ship Shield Dome
    const shieldDomeGeo = new THREE.IcosahedronGeometry(2.3, 1);
    const shieldDomeMat = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    this.shipShield = new THREE.Mesh(shieldDomeGeo, shieldDomeMat);
    this.shipShield.visible = false;
    this.ship.add(this.shipShield);

    this.scene.add(this.ship);
    this.updateShipPosition();
  }

  private buildWarpStarfield() {
    this.warpPositions = new Float32Array(WARP_COUNT * 6);
    for (let i = 0; i < WARP_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * (TUNNEL_RADIUS - 3);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -Math.random() * TUNNEL_LENGTH;

      this.warpPositions[i * 6] = x;
      this.warpPositions[i * 6 + 1] = y;
      this.warpPositions[i * 6 + 2] = z;
      this.warpPositions[i * 6 + 3] = x;
      this.warpPositions[i * 6 + 4] = y;
      this.warpPositions[i * 6 + 5] = z - 3;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.warpPositions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
    });
    this.warpLines = new THREE.LineSegments(geo, mat);
    this.scene.add(this.warpLines);
  }

  private setupInputs() {
    this.container.addEventListener("pointerdown", (e) => {
      this.sound.ensure();
      const target = e.target as HTMLElement | null;
      if (target?.closest("button, [data-no-drag]")) return;
      this.pointerDown = true;
      this.activePointerId = e.pointerId;
      this.lastPointerX = e.clientX;
    });

    window.addEventListener("pointermove", (e) => {
      if (!this.pointerDown || this.phase === "over" || e.pointerId !== this.activePointerId) return;
      const dx = e.clientX - this.lastPointerX;
      this.targetAngle -= dx * 0.007;
      this.lastPointerX = e.clientX;
    });

    const endPointer = (e: PointerEvent) => {
      if (e.pointerId === this.activePointerId) {
        this.pointerDown = false;
        this.activePointerId = null;
      }
    };
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);

    window.addEventListener("keydown", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = true;
    });
    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.keys.right = false;
    });
  }

  private updateShipPosition() {
    this.ship.position.x = Math.cos(this.shipAngle) * SHIP_RADIUS;
    this.ship.position.y = Math.sin(this.shipAngle) * SHIP_RADIUS;
    this.ship.position.z = 0;

    // Point ship forward and lean into turns
    this.ship.rotation.z = this.shipAngle - Math.PI / 2;
    const turnDelta = this.targetAngle - this.shipAngle;
    this.ship.rotation.y = THREE.MathUtils.clamp(-turnDelta * 2, -0.5, 0.5);

    // Rotate shield if active
    if (this.shieldActive) {
      this.shipShield.rotation.y += 0.04;
      this.shipShield.rotation.x += 0.02;
    }

    // Camera follows ship near center
    const camRadius = 4;
    const targetCamX = Math.cos(this.shipAngle) * camRadius;
    const targetCamY = Math.sin(this.shipAngle) * camRadius;

    // Shake
    let sx = 0,
      sy = 0,
      sz = 0;
    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.5;
      sx = (Math.random() - 0.5) * s;
      sy = (Math.random() - 0.5) * s;
      sz = (Math.random() - 0.5) * s;
    }

    const camZDist = 12 + (this.boostTimer > 0 ? 3.5 : 0);

    this.camera.position.set(
      THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.1) + sx,
      THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.1) + sy,
      camZDist + sz
    );
    this.camera.lookAt(
      Math.cos(this.shipAngle) * SHIP_RADIUS * 0.3,
      Math.sin(this.shipAngle) * SHIP_RADIUS * 0.3,
      -50
    );
  }

  private spawnObstacle(z: number) {
    const roll = Math.random();
    let type: "wall" | "gem" | "shield" | "magnet" | "boost" = "wall";
    let geo: THREE.BufferGeometry = this.obsGeo;
    let mat: THREE.Material = this.obsMat;

    if (roll > 0.46 && roll <= 0.8) {
      type = "gem";
      geo = this.gemGeo;
      mat = this.gemMat;
    } else if (roll > 0.8 && roll <= 0.87) {
      type = "shield";
      geo = this.shieldGeo;
      mat = this.shieldMat;
    } else if (roll > 0.87 && roll <= 0.94) {
      type = "magnet";
      geo = this.magnetGeo;
      mat = this.magnetMat;
    } else if (roll > 0.94) {
      type = "boost";
      geo = this.boostGeo;
      mat = this.boostMat;
    }

    const angle = Math.random() * Math.PI * 2;
    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.set(Math.cos(angle) * SHIP_RADIUS, Math.sin(angle) * SHIP_RADIUS, z);
    mesh.rotation.z = angle;
    mesh.rotation.x = Math.random() * Math.PI;

    this.scene.add(mesh);
    this.obstacles.push({
      mesh,
      angle,
      z,
      type,
      active: true,
    });
  }

  private burst(x: number, y: number, z: number, color: number, count: number) {
    const mat = new THREE.MeshBasicMaterial({ color });
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40,
        vz: (Math.random() - 0.5) * 40 + this.speed,
        life: 1,
        max: 1,
      });
    }
  }

  private resetWorld() {
    this.obstacles.forEach((o) => this.scene.remove(o.mesh));
    this.obstacles = [];
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
    this.worldZ = 0;
    this.tunnel1.position.z = -TUNNEL_LENGTH / 2;
    this.tunnel2.position.z = -TUNNEL_LENGTH * 1.5;

    // Reset power-ups & combo
    this.shieldActive = false;
    this.shipShield.visible = false;
    this.magnetTimer = 0;
    this.boostTimer = 0;
    this.graceTimer = 0;
    this.combo = 1;
    this.comboTimer = 0;

    // Initial spawn
    for (let i = 0; i < 20; i++) {
      this.spawnObstacle(-50 - i * 30);
    }

    this.shipAngle = Math.PI / 2;
    this.targetAngle = Math.PI / 2;
    this.shipMaterial.color.setHex(0x00f0ff);
    this.ship.visible = true;

    this.cb.onCombo?.(1, 0);
    this.cb.onPowerUps?.({ shield: false, magnetTime: 0, boostTime: 0 });
  }

  // ---- API ----

  steerLeft(active: boolean) {
    this.keys.touchLeft = active;
    if (active) {
      this.sound.ensure();
      this.vibrate(12);
    }
  }

  steerRight(active: boolean) {
    this.keys.touchRight = active;
    if (active) {
      this.sound.ensure();
      this.vibrate(12);
    }
  }

  steerDelta(delta: number) {
    this.targetAngle -= delta;
  }

  setTiltEnabled(enabled: boolean) {
    this.tiltEnabled = enabled;
    if (typeof window === "undefined") return;
    if (enabled && !this.orientationListenerAttached) {
      window.addEventListener("deviceorientation", this.handleDeviceOrientation);
      this.orientationListenerAttached = true;
    } else if (!enabled && this.orientationListenerAttached) {
      window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
      this.orientationListenerAttached = false;
    }
  }

  getTiltEnabled(): boolean {
    return this.tiltEnabled;
  }

  private vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  private async requestWakeLock() {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request("screen");
      } catch {}
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        void this.wakeLock.release();
      } catch {}
      this.wakeLock = null;
    }
  }

  private handleVisibilityChange = () => {
    const isVisible = document.visibilityState === "visible";
    this.sound.handleVisibilityChange(isVisible);
    if (isVisible && this.phase === "playing") {
      void this.requestWakeLock();
    } else {
      this.releaseWakeLock();
    }
  };

  private handleDeviceOrientation = (e: DeviceOrientationEvent) => {
    if (!this.tiltEnabled || this.phase !== "playing") return;
    let tilt = 0;
    const orientation = window.screen?.orientation?.type || "";
    if (orientation.includes("landscape-secondary")) {
      tilt = -(e.beta ?? 0);
    } else if (orientation.includes("landscape")) {
      tilt = e.beta ?? 0;
    } else {
      tilt = e.gamma ?? 0;
    }
    if (Math.abs(tilt) > 2.5) {
      const steerSpeed = (tilt / 30) * 3.6;
      this.targetAngle -= steerSpeed * 0.016;
    }
  };

  startGame() {
    this.sound.ensure();
    this.resetWorld();
    this.score = 0;
    this.speed = this.baseSpeed;
    this.phase = "playing";
    this.cb.onScore(this.score);
    this.sound.startMusic();
    void this.requestWakeLock();
  }

  toMenu() {
    this.resetWorld();
    this.phase = "menu";
    this.speed = this.baseSpeed * 0.5;
    this.sound.stopEngine();
    this.sound.stopMusic();
    this.releaseWakeLock();
  }

  setMuted(m: boolean) {
    this.sound.setMuted(m);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.sound.dispose();
    this.renderer.dispose();
    this.releaseWakeLock();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    if (this.orientationListenerAttached) {
      window.removeEventListener("deviceorientation", this.handleDeviceOrientation);
      this.orientationListenerAttached = false;
    }
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    const aspect = w / h;
    this.camera.aspect = aspect;

    // Dynamic FOV base
    if (aspect < 1) {
      this.baseFov = 75 + Math.min(22, (1 - aspect) * 25);
    } else {
      this.baseFov = 75;
    }
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Active power-up timers
    if (this.phase === "playing") {
      if (this.magnetTimer > 0) this.magnetTimer = Math.max(0, this.magnetTimer - dt);
      if (this.boostTimer > 0) this.boostTimer = Math.max(0, this.boostTimer - dt);
      if (this.graceTimer > 0) this.graceTimer = Math.max(0, this.graceTimer - dt);

      // Combo timer decay
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        this.cb.onCombo?.(this.combo, Math.max(0, this.comboTimer / this.COMBO_DURATION));
        if (this.comboTimer <= 0 && this.combo > 1) {
          this.combo = 1;
          this.cb.onCombo?.(1, 0);
        }
      }

      // Update UI powerup state
      this.cb.onPowerUps?.({
        shield: this.shieldActive,
        magnetTime: this.magnetTimer,
        boostTime: this.boostTimer,
      });
    }

    // Movement
    if (this.phase !== "over") {
      const turningLeft = this.keys.left || this.keys.touchLeft;
      const turningRight = this.keys.right || this.keys.touchRight;
      if (turningLeft) this.targetAngle += 3.4 * dt;
      if (turningRight) this.targetAngle -= 3.4 * dt;

      // Keep angles in check
      this.targetAngle = this.targetAngle % (Math.PI * 2);

      // Smooth interpolation for shortest path
      let diff = this.targetAngle - this.shipAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.shipAngle += diff * 10 * dt;
    }

    this.updateShipPosition();

    // Move world
    const effectiveSpeed = this.speed + (this.boostTimer > 0 ? 55 : 0);
    const moveZ = effectiveSpeed * dt;
    this.worldZ += moveZ;

    // Tunnel wrap
    this.tunnel1.position.z += moveZ;
    this.tunnel2.position.z += moveZ;
    if (this.tunnel1.position.z > TUNNEL_LENGTH / 2) {
      this.tunnel1.position.z = this.tunnel2.position.z - TUNNEL_LENGTH;
    }
    if (this.tunnel2.position.z > TUNNEL_LENGTH / 2) {
      this.tunnel2.position.z = this.tunnel1.position.z - TUNNEL_LENGTH;
    }

    // Warp Starfield Animation
    const streakLength = Math.max(3, effectiveSpeed * 0.14 + (this.boostTimer > 0 ? 12 : 0));
    for (let i = 0; i < WARP_COUNT; i++) {
      const idx = i * 6;
      this.warpPositions[idx + 2] += moveZ * 1.5;
      this.warpPositions[idx + 5] = this.warpPositions[idx + 2] - streakLength;

      if (this.warpPositions[idx + 2] > 15) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 2.5 + Math.random() * (TUNNEL_RADIUS - 3.5);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = -TUNNEL_LENGTH * 0.85 - Math.random() * 30;

        this.warpPositions[idx] = x;
        this.warpPositions[idx + 1] = y;
        this.warpPositions[idx + 2] = z;
        this.warpPositions[idx + 3] = x;
        this.warpPositions[idx + 4] = y;
        this.warpPositions[idx + 5] = z - streakLength;
      }
    }
    this.warpLines.geometry.attributes.position.needsUpdate = true;

    // Dynamic Camera FOV Warp on Speed
    const targetFov =
      this.baseFov +
      Math.min(16, (effectiveSpeed - this.baseSpeed) * 0.1) +
      (this.boostTimer > 0 ? 12 : 0);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
    this.camera.updateProjectionMatrix();

    // Audio engine pitch
    if (this.phase === "playing") {
      const normSpeed = (effectiveSpeed - this.baseSpeed) / 150;
      this.sound.setEngineSpeed(Math.min(1.2, normSpeed), this.boostTimer > 0);
    }

    // Magnet: pull gems towards ship
    if (this.phase === "playing" && this.magnetTimer > 0) {
      for (const obs of this.obstacles) {
        if (obs.active && obs.type === "gem" && obs.z > -55 && obs.z < 5) {
          let diff = this.shipAngle - obs.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          obs.angle += diff * 8 * dt;
          obs.mesh.position.x = Math.cos(obs.angle) * SHIP_RADIUS;
          obs.mesh.position.y = Math.sin(obs.angle) * SHIP_RADIUS;
          obs.mesh.rotation.z = obs.angle;
        }
      }
    }

    // Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;
      obs.z += moveZ;

      if (obs.type === "gem" || obs.type === "shield" || obs.type === "magnet" || obs.type === "boost") {
        obs.mesh.rotation.x += 2 * dt;
        obs.mesh.rotation.y += 3 * dt;
      }

      // Collision
      if (this.phase === "playing" && obs.active && obs.z > -1 && obs.z < 2) {
        let aDiff = Math.abs(obs.angle - this.shipAngle);
        while (aDiff > Math.PI) aDiff -= Math.PI * 2;
        aDiff = Math.abs(aDiff);

        if (aDiff < 0.26) {
          obs.active = false;
          this.scene.remove(obs.mesh);

          if (obs.type === "gem") {
            // Gem Combo Multiplier!
            this.comboTimer = this.COMBO_DURATION;
            this.combo = Math.min(5, this.combo + 1);
            const points = 10 * this.combo;
            this.score += points;
            this.speed += 1.4;
            this.cb.onScore(this.score);
            this.cb.onCombo?.(this.combo, 1);
            this.sound.collect(this.combo);
            this.vibrate(16);
            this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0x00f0ff, 15);
          } else if (obs.type === "shield") {
            // Plasma Shield Power-Up
            this.shieldActive = true;
            this.shipShield.visible = true;
            this.sound.powerupShield();
            this.vibrate([20, 30, 60]);
            this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0x00ff88, 22);
          } else if (obs.type === "magnet") {
            // Vortex Magnet Power-Up
            this.magnetTimer = 6.0;
            this.sound.powerupMagnet();
            this.vibrate([20, 50]);
            this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0xffcc00, 22);
          } else if (obs.type === "boost") {
            // Hyper Boost Power-Up
            this.boostTimer = 4.0;
            this.sound.powerupBoost();
            this.vibrate([40, 40, 90]);
            this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0xff3300, 35);
          } else {
            // Wall Collision
            if (this.boostTimer > 0) {
              // Ram through wall while in hyper boost!
              this.sound.ramObstacle();
              this.vibrate(25);
              this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0xff003c, 30);
              this.score += 25;
              this.cb.onScore(this.score);
            } else if (this.graceTimer > 0) {
              // Protected by grace period
            } else if (this.shieldActive) {
              // Shield absorbs impact!
              this.shieldActive = false;
              this.shipShield.visible = false;
              this.graceTimer = 0.65;
              this.shake = 0.55;
              this.sound.shieldBreak();
              this.vibrate([40, 80]);
              this.burst(this.ship.position.x, this.ship.position.y, 0, 0x00ffaa, 35);
            } else {
              // Fatal crash
              this.sound.crash();
              this.vibrate([45, 50, 110]);
              this.releaseWakeLock();
              this.shake = 1;
              this.phase = "over";
              this.ship.visible = false;
              this.burst(this.ship.position.x, this.ship.position.y, 0, 0xff00aa, 40);

              const prevBest = Number(localStorage.getItem(BEST_KEY) || 0);
              const newBest = this.score > prevBest;
              const best = Math.max(prevBest, this.score);
              if (newBest) localStorage.setItem(BEST_KEY, String(best));

              this.cb.onGameOver({ score: this.score, best, newBest });
            }
          }
        }
      }

      // Remove behind camera and spawn new
      if (obs.z > 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
        if (this.phase !== "over") {
          let minZ = 0;
          this.obstacles.forEach((o) => {
            if (o.z < minZ) minZ = o.z;
          });
          this.spawnObstacle(minZ - 20 - Math.random() * 20);
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        const mat = p.mesh.material as THREE.Material;
        mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.mesh.scale.setScalar(p.life / p.max);
    }

    // Camera shake decay
    this.shake = Math.max(0, this.shake - dt * 2);

    // Render
    this.composer.render();
  };
}
