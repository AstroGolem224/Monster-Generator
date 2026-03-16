/**
 * Ember Particle System
 * Background atmospheric effect for PRISM Hub branding
 */

export class EmberParticles {
  constructor() {
    this.canvas = document.getElementById('ember-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.animationId = null;

    // Ember theme colors
    this.colors = [
      '212,82,10',   // Ember Orange
      '201,151,42',  // Ember Gold
      '255,123,46',  // Rune Glow
      '255,180,80'   // Light Amber
    ];

    this.resize();
    this.init();

    // Handle resize
    window.addEventListener('resize', () => this.resize());

    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (this.prefersReducedMotion) {
      this.canvas.style.display = 'none';
      return;
    }

    // Check for mobile
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (this.isMobile) {
      this.canvas.style.display = 'none';
      return;
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    // Create 120 particles
    const particleCount = 120;
    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(isBig = false) {
    const isBigParticle = isBig || Math.random() < 0.08;

    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      radius: isBigParticle 
        ? 2 + Math.random() * 3 
        : 0.3 + Math.random() * 1.5,
      speedY: -(0.2 + Math.random() * 0.7), // Upward movement
      speedX: (Math.random() - 0.5) * 0.5, // Horizontal drift
      opacity: 0.25 + Math.random() * 0.6,
      twinkle: 0.01 + Math.random() * 0.03,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      isBig: isBigParticle,
      phase: Math.random() * Math.PI * 2
    };
  }

  start() {
    if (this.isRunning || this.prefersReducedMotion || this.isMobile) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      // Update position
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.phase) * 0.2;
      p.phase += 0.01;

      // Twinkle effect
      p.opacity += Math.sin(Date.now() * 0.001 * p.twinkle) * 0.01;
      p.opacity = Math.max(0.2, Math.min(0.85, p.opacity));

      // Fade out near top
      let drawOpacity = p.opacity;
      if (p.y < 120) {
        drawOpacity *= p.y / 120;
      }

      // Reset if off screen
      if (p.y < -20) {
        p.y = this.canvas.height + 20;
        p.x = Math.random() * this.canvas.width;
      }

      // Horizontal wrap
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;

      // Draw particle
      this.drawParticle(p, drawOpacity);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawParticle(p, opacity) {
    // Core dot
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
    this.ctx.fill();

    // Glow halo for big particles
    if (p.isBig) {
      const gradient = this.ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.radius * 5
      );
      gradient.addColorStop(0, `rgba(${p.color}, ${opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(${p.color}, 0)`);
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius * 5, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }

    // Upward streak
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineTo(p.x - p.speedX * 3, p.y - p.speedY * 8);
    this.ctx.strokeStyle = `rgba(${p.color}, ${opacity * 0.35})`;
    this.ctx.lineWidth = p.radius * 0.6;
    this.ctx.stroke();
  }
}

// Export singleton
export const emberParticles = new EmberParticles();
