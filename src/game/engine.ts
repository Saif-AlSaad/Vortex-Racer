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

export interface EngineCallbacks {
  onScore: (score: number) => void;
  onGameOver: (result: GameResult) => void;
}

export const BEST_KEY = "vortex.best.v1";
export const MUTE_KEY = "vortex.muted.v1";

const TUNNEL_RADIUS = 12;
const SHIP_RADIUS = 10.5;
const TUNNEL_LENGTH = 300;
const SEGMENTS = 32;

interface Obstacle {
  mesh: THREE.Mesh;
  angle: number;
  z: number;
  type: "wall" | "gem";
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
  private tunnel1!: THREE.Mesh;
  private tunnel2!: THREE.Mesh;

  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private obsGeo = new THREE.BoxGeometry(2, 2, 2);
  private obsMat = new THREE.MeshBasicMaterial({ color: 0xff003c });
  private gemGeo = new THREE.OctahedronGeometry(1.2);
  private gemMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
  private sparkGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);

  private phase: "menu" | "playing" | "over" = "menu";
  private score = 0;
  private speed = 0;
  private baseSpeed = 40;
  private shipAngle = Math.PI / 2;
  private targetAngle = Math.PI / 2;
  private worldZ = 0;
  
  private shake = 0;
  private lastTime = performance.now();
  private raf = 0;
  private disposed = false;
  private ro: ResizeObserver;

  // Inputs
  private pointerDown = false;
  private lastPointerX = 0;
  private keys = { left: false, right: false };

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
      1.5, // strength
      0.4, // radius
      0.1  // threshold
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);

    this.scene.fog = new THREE.Fog(0x050014, 50, TUNNEL_LENGTH * 0.8);

    this.buildWorld();

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    
    this.setupInputs();

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
      opacity: 0.3 
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
    
    this.scene.add(this.ship);
    this.updateShipPosition();
  }

  private setupInputs() {
    this.container.addEventListener("pointerdown", (e) => {
      this.pointerDown = true;
      this.lastPointerX = e.clientX;
      this.sound.ensure();
    });
    window.addEventListener("pointermove", (e) => {
      if (!this.pointerDown || this.phase === "over") return;
      const dx = e.clientX - this.lastPointerX;
      this.targetAngle -= dx * 0.008;
      this.lastPointerX = e.clientX;
    });
    window.addEventListener("pointerup", () => {
      this.pointerDown = false;
    });
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
    
    // Camera follows ship but stays near center
    const camRadius = 4;
    const targetCamX = Math.cos(this.shipAngle) * camRadius;
    const targetCamY = Math.sin(this.shipAngle) * camRadius;
    
    // Add shake
    let sx = 0, sy = 0, sz = 0;
    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.5;
      sx = (Math.random() - 0.5) * s;
      sy = (Math.random() - 0.5) * s;
      sz = (Math.random() - 0.5) * s;
    }
    
    this.camera.position.set(
      THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 0.1) + sx,
      THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 0.1) + sy,
      12 + sz
    );
    this.camera.lookAt(
      Math.cos(this.shipAngle) * SHIP_RADIUS * 0.3,
      Math.sin(this.shipAngle) * SHIP_RADIUS * 0.3,
      -50
    );
  }

  private spawnObstacle(z: number) {
    const isGem = Math.random() > 0.75;
    const angle = Math.random() * Math.PI * 2;
    
    const mesh = new THREE.Mesh(
      isGem ? this.gemGeo : this.obsGeo,
      isGem ? this.gemMat : this.obsMat
    );
    
    mesh.position.set(
      Math.cos(angle) * SHIP_RADIUS,
      Math.sin(angle) * SHIP_RADIUS,
      z
    );
    
    mesh.rotation.z = angle;
    mesh.rotation.x = Math.random() * Math.PI;
    
    this.scene.add(mesh);
    this.obstacles.push({
      mesh,
      angle,
      z,
      type: isGem ? "gem" : "wall",
      active: true
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
        max: 1
      });
    }
  }

  private resetWorld() {
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.obstacles = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    this.worldZ = 0;
    this.tunnel1.position.z = -TUNNEL_LENGTH / 2;
    this.tunnel2.position.z = -TUNNEL_LENGTH * 1.5;
    
    // Initial spawn
    for (let i = 0; i < 20; i++) {
      this.spawnObstacle(-50 - i * 30);
    }
    
    this.shipAngle = Math.PI / 2;
    this.targetAngle = Math.PI / 2;
    this.shipMaterial.color.setHex(0x00f0ff);
    this.ship.visible = true;
  }

  // ---- API ----

  startGame() {
    this.sound.ensure();
    this.resetWorld();
    this.score = 0;
    this.speed = this.baseSpeed;
    this.phase = "playing";
    this.cb.onScore(this.score);
  }

  toMenu() {
    this.resetWorld();
    this.phase = "menu";
    this.speed = this.baseSpeed * 0.5;
    this.sound.stopEngine();
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
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Movement
    if (this.phase !== "over") {
      if (this.keys.left) this.targetAngle += 3 * dt;
      if (this.keys.right) this.targetAngle -= 3 * dt;
      
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
    const moveZ = this.speed * dt;
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

    // Audio engine pitch
    if (this.phase === "playing") {
      const normSpeed = (this.speed - this.baseSpeed) / 150;
      this.sound.setEngineSpeed(Math.min(1, normSpeed));
    }

    // Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;
      obs.z += moveZ;
      
      if (obs.type === "gem") {
        obs.mesh.rotation.x += 2 * dt;
        obs.mesh.rotation.y += 3 * dt;
      }

      // Collision
      if (this.phase === "playing" && obs.active && obs.z > -1 && obs.z < 2) {
        // Check angle diff
        let aDiff = Math.abs(obs.angle - this.shipAngle);
        while (aDiff > Math.PI) aDiff -= Math.PI * 2;
        aDiff = Math.abs(aDiff);
        
        if (aDiff < 0.25) { // Hit!
          obs.active = false;
          if (obs.type === "gem") {
            this.sound.collect();
            this.scene.remove(obs.mesh);
            this.score += 10;
            this.speed += 2; // Speed up
            this.cb.onScore(this.score);
            this.burst(obs.mesh.position.x, obs.mesh.position.y, obs.z, 0x00f0ff, 15);
          } else {
            // Crash
            this.sound.crash();
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

      // Remove behind camera and spawn new
      if (obs.z > 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
        if (this.phase !== "over") {
          // Find min Z to spawn ahead
          let minZ = 0;
          this.obstacles.forEach(o => { if (o.z < minZ) minZ = o.z; });
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
