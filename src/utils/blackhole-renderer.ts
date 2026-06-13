interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
}

interface DustParticle {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  opacity: number;
}

interface Ripple {
  startTime: number;
  duration: number;
}

interface BlackHoleRendererConfig {
  canvas: HTMLCanvasElement;
  starCount: number;
}

export class BlackHoleRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private stars: Star[] = [];
  private dustParticles: DustParticle[] = [];
  private ripples: Ripple[] = [];
  private animationId = 0;
  private _progress = 0;
  private collapsing = false;
  private alertLevel: string = "green";
  // private _startTime = 0;
  private whiteFlashAlpha = 0;
  private hasFlashed = false;
  private shakeOffset = { x: 0, y: 0 };

  constructor(private config: BlackHoleRendererConfig) {
    this.ctx = config.canvas.getContext("2d")!;
    this.width = config.canvas.width;
    this.height = config.canvas.height;
    this.initStars();
    this.initDustParticles();
    // this._startTime = performance.now();
  }

  private initStars() {
    this.stars = Array.from({ length: this.config.starCount }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.6 + 0.4,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
    }));
  }

  private initDustParticles() {
    this.dustParticles = Array.from({ length: 30 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 200 + 50,
      speed: Math.random() * 0.003 + 0.001,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }

  setProgress(progress: number) {
    const prev = this._progress;
    this._progress = Math.min(1, Math.max(0, progress));

    // Trigger ripple on significant progress change
    if (prev < 0.01 && this._progress >= 0.01) {
      this.addRipple();
    }

    // Trigger white flash when fully filled
    if (this._progress >= 0.98 && !this.hasFlashed) {
      this.flashWhite();
      this.hasFlashed = true;
    }
  }

  get progress() {
    return this._progress;
  }

  setAlertLevel(level: string) {
    this.alertLevel = level;
  }

  private getCurrentRadius(): number {
    const maxRadius =
      Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
    const minRadius = 5;
    const eased = this._progress * this._progress;
    return minRadius + (maxRadius - minRadius) * eased;
  }

  /** Get color for accretion disk based on progress (blue → orange) */
  getDiskColor(progress: number): string {
    // Early: blue-ish (100, 150, 255)
    // Late: red-orange (255, 80, 0)
    const r = Math.round(100 + (255 - 100) * progress);
    const g = Math.round(150 + (80 - 150) * progress);
    const b = Math.round(255 + (0 - 255) * progress);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /** Get disk color with alpha */
  private getDiskColorAlpha(progress: number, alpha: number): string {
    const r = Math.round(100 + (255 - 100) * progress);
    const g = Math.round(150 + (80 - 150) * progress);
    const b = Math.round(255 + (0 - 255) * progress);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private addRipple() {
    this.ripples.push({
      startTime: performance.now(),
      duration: 2000,
    });
  }

  flashWhite() {
    this.whiteFlashAlpha = 1.0;
    // Shake effect
    const shakeFrames = 10;
    let frame = 0;
    const shake = () => {
      if (frame >= shakeFrames) {
        this.shakeOffset = { x: 0, y: 0 };
        return;
      }
      const intensity = (1 - frame / shakeFrames) * 8;
      this.shakeOffset = {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
      };
      frame++;
      requestAnimationFrame(shake);
    };
    requestAnimationFrame(shake);
  }

  render(timestamp: number, _alertLevel?: string) {
    const level = _alertLevel ?? this.alertLevel;
    this.alertLevel = level;

    const { ctx, width, height } = this;
    const cx = width / 2 + this.shakeOffset.x;
    const cy = height / 2 + this.shakeOffset.y;
    const radius = this.getCurrentRadius();

    // Apply breathing effect
    const breathRadius = this.renderBreathing(cx, cy, radius, timestamp);

    ctx.clearRect(0, 0, width, height);

    // Layer 1: 星空背景
    this.renderStars(timestamp, cx, cy, breathRadius);

    // Layer 1.5: 星尘粒子
    this.renderDustParticles(cx, cy, breathRadius, timestamp);

    // Layer 1.6: 时空涟漪
    this.renderRipples(cx, cy, timestamp);

    // Layer 2: 引力透镜
    this.renderGravitationalLensing(cx, cy, breathRadius);

    // Layer 3: 吸积盘 (with color temperature)
    this.renderAccretionDisk(cx, cy, breathRadius, timestamp);

    // Layer 4: 事件视界
    this.renderEventHorizon(cx, cy, breathRadius);

    // Layer 5: 光环
    this.renderPhotonRing(cx, cy, breathRadius, timestamp);

    // White flash overlay
    if (this.whiteFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteFlashAlpha})`;
      ctx.fillRect(0, 0, width, height);
      this.whiteFlashAlpha -= 0.02;
      if (this.whiteFlashAlpha < 0) this.whiteFlashAlpha = 0;
    }
  }

  private renderStars(
    time: number,
    cx: number,
    cy: number,
    bhRadius: number
  ) {
    for (const star of this.stars) {
      const dx = star.x - cx;
      const dy = star.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bhRadius * 0.8) continue;

      let renderX = star.x;
      let renderY = star.y;
      if (dist < bhRadius * 2) {
        const pull =
          1 - (dist - bhRadius * 0.8) / (bhRadius * 1.2);
        renderX = star.x + (cx - star.x) * pull * 0.3;
        renderY = star.y + (cy - star.y) * pull * 0.3;
      }

      const twinkle = Math.sin(time * star.twinkleSpeed) * 0.3 + 0.7;
      const alpha = star.brightness * twinkle;
      this.ctx.beginPath();
      this.ctx.arc(renderX, renderY, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }
  }

  /** 星尘粒子：30个微小粒子螺旋坠入黑洞 */
  renderDustParticles(
    cx: number,
    cy: number,
    radius: number,
    _timestamp: number
  ) {
    if (radius < 15) return;

    const ctx = this.ctx;
    for (const particle of this.dustParticles) {
      // Spiral inward
      particle.angle += particle.speed;
      particle.dist -= 0.3;

      // Reset if too close
      if (particle.dist < radius * 0.5) {
        particle.dist = radius * 2 + Math.random() * 100;
        particle.angle = Math.random() * Math.PI * 2;
        particle.opacity = Math.random() * 0.5 + 0.3;
      }

      const x = cx + Math.cos(particle.angle) * particle.dist;
      const y = cy + Math.sin(particle.angle) * particle.dist;

      // Fade as they get closer
      const fadeStart = radius * 1.5;
      const fadeEnd = radius * 0.6;
      const fadeDist = particle.dist;
      let alpha = particle.opacity;
      if (fadeDist < fadeStart) {
        alpha *= Math.max(0, (fadeDist - fadeEnd) / (fadeStart - fadeEnd));
      }

      if (alpha <= 0) continue;

      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = this.getDiskColorAlpha(this._progress, alpha);
      ctx.fill();
    }
  }

  /** 时空涟漪：黑洞出现时从中心扩散3圈波纹 */
  renderRipples(cx: number, cy: number, _timestamp: number) {
    const ctx = this.ctx;
    // Clean up old ripples
    this.ripples = this.ripples.filter(
      (r) => _timestamp - r.startTime < r.duration
    );

    for (const ripple of this.ripples) {
      const elapsed = _timestamp - ripple.startTime;
      const progress = elapsed / ripple.duration;

      // 3 concentric rings
      for (let i = 0; i < 3; i++) {
        const ringProgress = Math.min(1, progress + i * 0.15);
        const ringRadius = ringProgress * Math.max(this.width, this.height) * 0.4;
        const alpha = (1 - ringProgress) * 0.15;

        if (alpha <= 0) continue;

        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.getDiskColorAlpha(this._progress, alpha);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  /** 黑洞呼吸：事件视界半径 ±3% 缓慢缩放 */
  renderBreathing(
    _cx: number,
    _cy: number,
    radius: number,
    timestamp: number
  ): number {
    const breathAmplitude = 0.03;
    const breathSpeed = 0.001;
    const breathFactor =
      1 + Math.sin(timestamp * breathSpeed) * breathAmplitude;
    return radius * breathFactor;
  }

  private renderGravitationalLensing(
    cx: number,
    cy: number,
    radius: number
  ) {
    if (radius < 30) return;
    const gradient = this.ctx.createRadialGradient(
      cx,
      cy,
      radius * 0.95,
      cx,
      cy,
      radius * 1.4
    );
    gradient.addColorStop(0, "rgba(100, 50, 200, 0)");
    gradient.addColorStop(0.4, "rgba(120, 60, 220, 0.15)");
    gradient.addColorStop(0.7, "rgba(80, 40, 180, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private renderAccretionDisk(
    cx: number,
    cy: number,
    radius: number,
    time: number
  ) {
    if (radius < 20) return;
    this.ctx.save();
    this.ctx.translate(cx, cy);

    const diskOuterRadius = radius * 1.3;
    const diskInnerRadius = radius * 0.9;
    const rotation = time * 0.001;

    this.ctx.rotate(rotation);
    this.ctx.scale(1, 0.3);

    const gradient = this.ctx.createRadialGradient(
      0,
      0,
      diskInnerRadius,
      0,
      0,
      diskOuterRadius
    );

    // Use color temperature based on progress
    const p = this._progress;
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.3, this.getDiskColorAlpha(p, 0.4));
    gradient.addColorStop(0.6, this.getDiskColorAlpha(p, 0.6));
    gradient.addColorStop(0.8, this.getDiskColorAlpha(p, 0.3));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.beginPath();
    this.ctx.arc(0, 0, diskOuterRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderEventHorizon(cx: number, cy: number, radius: number) {
    const gradient = this.ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      radius
    );
    gradient.addColorStop(0, "#000000");
    gradient.addColorStop(0.7, "#000000");
    gradient.addColorStop(0.85, "rgba(20, 0, 40, 0.9)");
    gradient.addColorStop(0.95, "rgba(30, 0, 60, 0.5)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private renderPhotonRing(
    cx: number,
    cy: number,
    radius: number,
    time: number
  ) {
    if (radius < 15) return;
    const ringRadius = radius * 1.05;
    const glow = Math.sin(time * 0.003) * 0.2 + 0.6;

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(255, 140, 0, ${glow})`;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = "rgba(255, 100, 0, 0.8)";
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  /** 坍缩动画 - 支持强制关闭 */
  collapse(onComplete: () => void, force: boolean = false) {
    if (this.collapsing) return;
    this.collapsing = true;
    this._forceCollapse = force;

    let p = this._progress;
    const step = () => {
      p -= 0.04;
      if (p <= 0) {
        this._progress = 0;
        this.collapsing = false;
        this.hasFlashed = false;
        onComplete();
        return;
      }
      this._progress = p;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private _forceCollapse = false;

  get isCollapsing() {
    return this.collapsing;
  }

  get isForceCollapsing() {
    return this._forceCollapse;
  }

  start() {
    const loop = (timestamp: number) => {
      this.render(timestamp);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animationId);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initStars();
  }
}
