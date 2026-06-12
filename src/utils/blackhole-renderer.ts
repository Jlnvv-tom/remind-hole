interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
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
  private animationId = 0;
  private _progress = 0;
  private collapsing = false;

  constructor(private config: BlackHoleRendererConfig) {
    this.ctx = config.canvas.getContext("2d")!;
    this.width = config.canvas.width;
    this.height = config.canvas.height;
    this.initStars();
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

  setProgress(progress: number) {
    this._progress = Math.min(1, Math.max(0, progress));
  }

  get progress() {
    return this._progress;
  }

  private getCurrentRadius(): number {
    const maxRadius =
      Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
    const minRadius = 5;
    const eased = this._progress * this._progress; // easeInQuad
    return minRadius + (maxRadius - minRadius) * eased;
  }

  render(timestamp: number) {
    const { ctx, width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    const radius = this.getCurrentRadius();

    ctx.clearRect(0, 0, width, height);

    // Layer 1: 星空背景
    this.renderStars(timestamp, cx, cy, radius);

    // Layer 2: 引力透镜
    this.renderGravitationalLensing(cx, cy, radius);

    // Layer 3: 吸积盘
    this.renderAccretionDisk(cx, cy, radius, timestamp);

    // Layer 4: 事件视界
    this.renderEventHorizon(cx, cy, radius);

    // Layer 5: 光环
    this.renderPhotonRing(cx, cy, radius, timestamp);

    // 铺满后显示文字
    if (this._progress >= 0.9) {
      this.renderWarningText(cx, cy);
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
    gradient.addColorStop(0, "rgba(255, 100, 0, 0)");
    gradient.addColorStop(0.3, "rgba(255, 120, 20, 0.4)");
    gradient.addColorStop(0.6, "rgba(255, 80, 0, 0.6)");
    gradient.addColorStop(0.8, "rgba(255, 50, 0, 0.3)");
    gradient.addColorStop(1, "rgba(255, 30, 0, 0)");

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

  private renderWarningText(cx: number, cy: number) {
    const alpha = Math.min(1, (this._progress - 0.9) / 0.1);
    this.ctx.save();
    this.ctx.font = 'bold 48px "SF Pro Display", system-ui, sans-serif';
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    this.ctx.fillText("🚶 起来活动一下！", cx, cy - 30);
    this.ctx.font = '20px "SF Pro Display", system-ui, sans-serif';
    this.ctx.fillStyle = `rgba(200, 200, 200, ${alpha * 0.7})`;
    this.ctx.fillText("点击任意位置关闭黑洞", cx, cy + 20);
    this.ctx.restore();
  }

  /** 坍缩动画 */
  collapse(onComplete: () => void) {
    if (this.collapsing) return;
    this.collapsing = true;

    let p = this._progress;
    const step = () => {
      p -= 0.04;
      if (p <= 0) {
        this._progress = 0;
        this.collapsing = false;
        onComplete();
        return;
      }
      this._progress = p;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
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
