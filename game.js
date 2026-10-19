/* =====================================================================
   The Lost Temple — runner engine (plain canvas, no libraries)
   ===================================================================== */
(function (global) {
  'use strict';

  const H = 400;           // logical height; everything is drawn in these units
  const GROUND = 316;      // y of the path surface
  const GRAVITY = 0.62;
  const JUMP_V = -12.4;
  const ROOT_H = 24;

  const PALETTES = {
    night: {
      skyTop: '#0a1124', skyBot: '#2b1f3c', far: '#151d30', far2: '#1c2438', ruin: '#221e2c', pillar: '#3a3340',
      pillarDark: '#2a2430', ground: '#463d33', groundTop: '#6e604c', line: 'rgba(0,0,0,.38)',
      abyss: '#040308', vine: '#1d3a2b', leaf: '#2c5a3e', root: '#4b301f', rootHi: '#6b4630', glow: 1
    },
    day: {
      skyTop: '#f1b56b', skyBot: '#fbe6bf', far: '#8fa47b', far2: '#a9b98f', ruin: '#b89c74', pillar: '#a58a68',
      pillarDark: '#8a7152', ground: '#ad936c', groundTop: '#d3bb91', line: 'rgba(80,55,25,.32)',
      abyss: '#24180e', vine: '#476f37', leaf: '#679a47', root: '#6b4426', rootHi: '#8d6038', glow: 0.35
    }
  };

  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- Sound (synthesised, no audio files) ---------------- */
  class Sfx {
    constructor() { this.on = true; this.ctx = null; }
    ensure() {
      if (!this.ctx) { const AC = global.AudioContext || global.webkitAudioContext; if (AC) this.ctx = new AC(); }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    tone(freq, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
      if (!this.on) return;
      try {
        this.ensure(); if (!this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.03);
      } catch (e) { /* audio is optional */ }
    }
    jump() { this.tone(300, 0.16, 'square', 0.05, 280); }
    orb() { this.tone(880, 0.1, 'triangle', 0.07); this.tone(1320, 0.12, 'triangle', 0.05, 0, 0.05); }
    gem() { [988, 1319, 1760].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.07, 0, i * 0.06)); }
    relic() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.08, 0, i * 0.09)); }
    hurt() { this.tone(170, 0.32, 'sawtooth', 0.07, -100); }
    win() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.08, 0, i * 0.11)); }
  }

  /* ---------------- Game ---------------- */
  class TempleRun {
    constructor(canvas, opts) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.hooks = opts.hooks || {};
      this.cfg = { gems: opts.gems || 8, scrolls: opts.scrolls || 5 };
      this.sfx = opts.sfx || new Sfx();
      this.theme = 'night';
      this.t = 0; this.idle = 0; this.last = 0;
      this.running = false; this.paused = false; this.ended = false;
      this.stars = Array.from({ length: 70 }, (_, i) => ({ x: hash(i), y: hash(i + 99) * 0.55, r: 0.6 + hash(i + 7) * 1.4, p: hash(i + 3) * 6 }));
      this.resize();
      global.addEventListener('resize', () => this.resize());
      this.reset();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      const r = this.c.getBoundingClientRect();
      const dpr = Math.min(global.devicePixelRatio || 1, 2);
      this.c.width = Math.max(1, Math.round(r.width * dpr));
      this.c.height = Math.max(1, Math.round(r.height * dpr));
      // Fit the 400-unit-tall world to the height, but never show less than
      // ~430 units of width (tall phones): extra height becomes sky and stone.
      this.scale = Math.min(this.c.height / H, this.c.width / 430);
      this.W = this.c.width / this.scale;
      this.Hv = this.c.height / this.scale;
      this.offY = Math.max(0, (this.Hv - H) * 0.72);
      this.bottom = this.Hv - this.offY;
      this.playerX = clamp(this.W * 0.2, 80, 170);
      this.speedScale = clamp(this.W / 760, 0.7, 1);
    }

    setTheme(t) { this.theme = PALETTES[t] ? t : 'night'; }

    reset() {
      this.dist = 0; this.speed = 6; this.score = 0;
      this.p = { y: GROUND, vy: 0, grounded: true, falling: false, stumble: 0, inv: 0, anim: 0, coyote: 0, buffer: 0 };
      this.obstacles = []; this.orbs = []; this.particles = [];
      this.collected = { tablet: false, gems: 0, scrolls: 0, shrine: false };
      this.majors = [];
      let x = 950;
      this.majors.push({ type: 'tablet', idx: 0, x, taken: false });
      x += 800;
      for (let i = 0; i < this.cfg.gems; i++) { this.majors.push({ type: 'gem', idx: i, x, taken: false }); x += 430; }
      x += 600;
      for (let i = 0; i < this.cfg.scrolls; i++) { this.majors.push({ type: 'scroll', idx: i, x, taken: false }); x += 1050; }
      x += 200;
      this.shrineX = x;
      this.majors.push({ type: 'shrine', idx: 0, x, taken: false });
      this.nextGen = 620;
    }

    start() {
      this.reset();
      this.running = true; this.ended = false; this.paused = false; this.last = 0;
      this.generate(this.W + 500);
      this.emitScore(true);
    }
    pause() { if (this.running) this.paused = true; }
    resume() { if (this.running) { this.paused = false; this.last = 0; } }

    jump() {
      if (!this.running || this.paused || this.p.falling) return;
      this.p.buffer = 8;
    }
    releaseJump() { if (this.p.vy < -5) this.p.vy = -5; }

    /* ----- level generation ----- */
    nearMajor(x, pad) { return this.majors.some(m => Math.abs(m.x - x) < pad); }

    generate(upTo) {
      while (this.nextGen < upTo && this.nextGen < this.shrineX - 420) {
        const x = this.nextGen;
        const prog = clamp(x / this.shrineX, 0, 1);
        if (this.nearMajor(x, 230) || this.nearMajor(x + 140, 230)) { this.nextGen += 180; continue; }
        if (Math.random() < 0.45) {
          const w = 66 + Math.random() * 38 + prog * 30;
          this.obstacles.push({ type: 'gap', x, w });
          // arc of orbs rewarding the jump
          for (let i = 0; i < 4; i++) {
            const k = i / 3;
            this.orbs.push({ x: x - 30 + k * (w + 60), y: GROUND - 40 - Math.sin(k * Math.PI) * 70, taken: false });
          }
        } else {
          const w = 30 + Math.random() * 16;
          this.obstacles.push({ type: 'root', x, w, seed: Math.random() * 10 });
          for (let i = 0; i < 3; i++) this.orbs.push({ x: x + 150 + i * 34, y: GROUND - 26, taken: false });
        }
        this.nextGen += 400 + Math.random() * 320 - prog * 90;
      }
    }

    /* ----- update ----- */
    update(dt) {
      const p = this.p;
      if (p.stumble > 0) p.stumble -= dt;
      if (p.inv > 0) p.inv -= dt;
      if (p.buffer > 0) p.buffer -= dt;

      const sp = p.falling ? 0 : this.speed * this.speedScale * dt * (p.stumble > 0 ? 0.55 : 1);
      this.dist += sp;
      this.speed = Math.min(9, 6 + this.dist / 4200);
      this.score += sp * 0.05;
      this.generate(this.dist + this.W + 500);
      this.obstacles = this.obstacles.filter(o => o.x + o.w > this.dist - 200);
      this.orbs = this.orbs.filter(o => o.x > this.dist - 200);

      const wx = this.dist + this.playerX;

      // jump (buffered + coyote time)
      if (p.buffer > 0 && (p.grounded || p.coyote > 0) && !p.falling) {
        p.vy = JUMP_V; p.grounded = false; p.coyote = 0; p.buffer = 0; this.sfx.jump();
      }

      p.vy += GRAVITY * dt; p.y += p.vy * dt;
      const gap = this.obstacles.find(o => o.type === 'gap' && wx > o.x + 7 && wx < o.x + o.w - 7);
      if (!p.falling) {
        if (p.y >= GROUND) {
          if (gap) { p.falling = true; p.grounded = false; }
          else { p.y = GROUND; p.vy = 0; if (!p.grounded) this.dust(wx); p.grounded = true; p.coyote = 6; }
        } else { if (p.grounded) p.coyote = 6; p.grounded = false; p.coyote -= dt; }
      }
      if (p.falling && p.y > this.bottom + 60) this.respawn(gap || this.obstacles.find(o => o.type === 'gap' && wx >= o.x && wx <= o.x + o.w + 20));

      if (p.grounded && !p.falling) p.anim += this.speed * this.speedScale * 0.13 * dt * (p.stumble > 0 ? 0.6 : 1);

      // roots
      if (p.inv <= 0 && !p.falling) {
        for (const o of this.obstacles) {
          if (o.type === 'root' && wx + 9 > o.x && wx - 9 < o.x + o.w && p.y > GROUND - ROOT_H + 4) {
            p.stumble = 45; p.inv = 75; this.addScore(-50);
            this.burst(wx, GROUND - 10, '#8d6038', 10); this.sfx.hurt();
            this.hooks.onToast && this.hooks.onToast('Tripped on a root. −50');
            break;
          }
        }
      }

      // orbs
      for (const o of this.orbs) {
        if (!o.taken && Math.abs(o.x - wx) < 22 && Math.abs(o.y - (p.y - 26)) < 32) {
          o.taken = true; this.addScore(10); this.sfx.orb();
          this.burst(o.x, o.y, '#ffc65a', 6); this.floatText(o.x, o.y - 10, '+10', '#ffd27a');
        }
      }

      // relics
      for (const m of this.majors) {
        if (m.taken) continue;
        if (m.type === 'shrine') {
          if (wx >= m.x - 40) { m.taken = true; this.finish(); }
          continue;
        }
        if (Math.abs(m.x - wx) < 30) this.takeMajor(m);
      }

      this.emitScore();
    }

    takeMajor(m) {
      m.taken = true;
      const col = m.type === 'gem' ? (PORTFOLIO.gems[m.idx] || {}).color || '#7fe' : '#ffd27a';
      this.burst(m.x, GROUND - 70, col, 22);
      if (m.type === 'tablet') {
        this.collected.tablet = true; this.addScore(250); this.sfx.relic();
        this.floatText(m.x, GROUND - 110, '+250', '#ffd27a');
        this.hooks.onRelic && this.hooks.onRelic('tablet', 0);
      } else if (m.type === 'gem') {
        this.collected.gems++; this.addScore(100); this.sfx.gem();
        this.floatText(m.x, GROUND - 110, '+100', col);
        this.hooks.onRelic && this.hooks.onRelic('gem', m.idx, this.collected.gems === this.cfg.gems);
      } else if (m.type === 'scroll') {
        this.collected.scrolls++; this.addScore(250); this.sfx.relic();
        this.floatText(m.x, GROUND - 110, '+250', '#ffd27a');
        this.hooks.onRelic && this.hooks.onRelic('scroll', m.idx);
      }
    }

    finish() {
      this.collected.shrine = true; this.addScore(500);
      this.running = false; this.ended = true; this.p.y = GROUND; this.p.vy = 0;
      this.sfx.win(); this.burst(this.shrineX, GROUND - 90, '#ff9a3d', 40);
      this.emitScore(true);
      this.hooks.onEnd && this.hooks.onEnd(Math.floor(this.score), this.collected);
    }

    respawn(gap) {
      const p = this.p;
      if (gap) this.dist = gap.x + gap.w + 34 - this.playerX;
      p.falling = false; p.y = GROUND - 90; p.vy = 0; p.inv = 90; p.grounded = false; p.stumble = 0;
      this.addScore(-100); this.sfx.hurt();
      this.hooks.onToast && this.hooks.onToast('You slipped into a chasm. −100');
    }

    addScore(n) { this.score = Math.max(0, this.score + n); }
    emitScore(force) {
      const s = Math.floor(this.score);
      if (force || s !== this._lastScore) { this._lastScore = s; this.hooks.onScore && this.hooks.onScore(s); }
    }

    /* ----- particles ----- */
    burst(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3.5;
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 40 + Math.random() * 25, max: 65, color, r: 1.5 + Math.random() * 2.5 });
      }
    }
    dust(x) {
      for (let i = 0; i < 5; i++) this.particles.push({ x: x - 6 + Math.random() * 12, y: GROUND, vx: -1 - Math.random() * 1.5, vy: -Math.random() * 1.2, life: 22, max: 22, color: 'rgba(210,190,150,.8)', r: 2 + Math.random() * 2 });
    }
    floatText(x, y, text, color) { this.particles.push({ x, y, vx: 0, vy: -0.8, life: 50, max: 50, color, text }); }
    updateParticles(dt) {
      for (const q of this.particles) {
        q.x += q.vx * dt; q.y += q.vy * dt; if (!q.text) q.vy += 0.08 * dt; q.life -= dt;
      }
      this.particles = this.particles.filter(q => q.life > 0);
    }

    /* ----- main loop ----- */
    loop(ts) {
      const dt = this.last ? clamp((ts - this.last) / 16.667, 0, 2.5) : 1;
      this.last = ts; this.t += dt;
      if (this.running && !this.paused) this.update(dt);
      else if (!this.running && !this.ended) this.idle += 0.7 * dt;
      if (!this.paused) this.updateParticles(dt);
      this.draw();
      requestAnimationFrame(this.loop);
    }

    /* =================== drawing =================== */
    draw() {
      const ctx = this.ctx, P = PALETTES[this.theme];
      ctx.setTransform(this.scale, 0, 0, this.scale, 0, Math.round(this.offY * this.scale));
      const cam = (this.running || this.ended) ? this.dist : this.idle;
      const live = this.running || this.ended;

      this.drawSky(P);
      this.drawFar(P, cam);
      this.drawRuins(P, cam);
      this.drawPillars(P, cam);
      this.drawGround(P, cam, live);
      if (live) {
        this.drawOrbs(cam);
        this.drawMajors(P, cam);
      }
      this.drawPlayer(P);
      this.drawParticles(cam);
      this.drawVines(P, cam);
      if (this.theme === 'night') {
        const g = ctx.createRadialGradient(this.playerX, GROUND - 40, 60, this.playerX + 100, GROUND - 40, this.W * 0.9);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,.55)');
        ctx.fillStyle = g; ctx.fillRect(0, -this.offY, this.W, this.Hv);
      }
    }

    drawSky(P) {
      const ctx = this.ctx;
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, P.skyTop); g.addColorStop(1, P.skyBot);
      ctx.fillStyle = g; ctx.fillRect(0, -this.offY, this.W, this.Hv);
      if (this.theme === 'night') {
        for (const s of this.stars) {
          ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(this.t * 0.03 + s.p));
          ctx.fillStyle = '#fff6dd';
          ctx.beginPath(); ctx.arc(s.x * this.W, -this.offY + s.y * (H + this.offY), s.r, 0, 7); ctx.fill();
        }
        ctx.globalAlpha = 1;
        this.glow(this.W * 0.64, 70, 70, 'rgba(220,225,255,.25)');
        ctx.fillStyle = '#ece6d2'; ctx.beginPath(); ctx.arc(this.W * 0.64, 70, 22, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(160,150,130,.35)';
        ctx.beginPath(); ctx.arc(this.W * 0.64 - 7, 65, 5, 0, 7); ctx.arc(this.W * 0.64 + 6, 78, 3.5, 0, 7); ctx.fill();
      } else {
        this.glow(this.W * 0.64, 82, 110, 'rgba(255,240,190,.7)');
        ctx.fillStyle = '#fff4cf'; ctx.beginPath(); ctx.arc(this.W * 0.64, 82, 30, 0, 7); ctx.fill();
      }
    }

    glow(x, y, r, color) {
      const ctx = this.ctx, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    drawFar(P, cam) {
      const ctx = this.ctx;
      const layer = (off, base, amp, color, f1, f2) => {
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, this.bottom);
        for (let x = 0; x <= this.W + 20; x += 16) {
          const wx = x + off;
          ctx.lineTo(x, base + Math.sin(wx * f1) * amp + Math.sin(wx * f2 + 1.3) * amp * 0.5);
        }
        ctx.lineTo(this.W, this.bottom); ctx.closePath(); ctx.fill();
      };
      layer(cam * 0.06, 205, 20, P.far, 0.004, 0.013);
      layer(cam * 0.12, 238, 14, P.far2, 0.006, 0.019);
    }

    drawRuins(P, cam) {
      const ctx = this.ctx, off = cam * 0.22, span = 1000;
      ctx.fillStyle = P.ruin;
      for (let k = Math.floor(off / span) - 1; k <= Math.floor((off + this.W) / span) + 1; k++) {
        const bx = k * span + hash(k) * 400 - off;
        const w = 220 + hash(k + 5) * 120, steps = 5, sh = 22;
        for (let s = 0; s < steps; s++) {
          const ww = w - s * (w / (steps + 1.5));
          ctx.fillRect(bx + (w - ww) / 2, GROUND - 6 - (s + 1) * sh, ww, sh + 1);
        }
        const tw = w / 4.2, tx = bx + (w - tw) / 2, ty = GROUND - 6 - steps * sh - 30;
        ctx.fillRect(tx, ty, tw, 31);
        ctx.fillStyle = this.theme === 'night' ? 'rgba(255,150,60,.35)' : 'rgba(60,40,20,.35)';
        ctx.fillRect(tx + tw * 0.38, ty + 10, tw * 0.24, 21);
        ctx.fillStyle = P.ruin;
      }
    }

    drawPillars(P, cam) {
      const ctx = this.ctx, off = cam * 0.55, span = 470;
      for (let k = Math.floor(off / span) - 1; k <= Math.floor((off + this.W) / span) + 1; k++) {
        const x = k * span + hash(k + 40) * 140 - off, h = 120 + hash(k + 13) * 40, broken = hash(k + 2) > 0.7;
        const top = GROUND - h + (broken ? 34 : 0);
        ctx.fillStyle = P.pillarDark; ctx.fillRect(x - 3, top, 34, GROUND - top);
        ctx.fillStyle = P.pillar; ctx.fillRect(x, top, 26, GROUND - top);
        ctx.fillStyle = P.line;
        for (let y = top + 22; y < GROUND; y += 22) ctx.fillRect(x - 3, y, 34, 2);
        if (!broken) {
          ctx.fillStyle = P.pillar; ctx.fillRect(x - 9, top - 10, 44, 11);
          // torch
          const fx = x + 13, fy = top - 24;
          ctx.fillStyle = '#3b2a1c'; ctx.fillRect(fx - 3, fy + 2, 6, 12);
          const fl = Math.sin(this.t * 0.35 + k) * 2 + Math.sin(this.t * 0.9 + k * 2) * 1.2;
          this.glow(fx, fy, 70 * P.glow + 18, `rgba(255,140,50,${0.32 * P.glow + 0.08})`);
          ctx.fillStyle = '#ff6a1f';
          ctx.beginPath(); ctx.ellipse(fx, fy - 2, 6, 11 + fl, 0, 0, 7); ctx.fill();
          ctx.fillStyle = '#ffd36b';
          ctx.beginPath(); ctx.ellipse(fx, fy + 1, 3, 6 + fl * 0.5, 0, 0, 7); ctx.fill();
        } else {
          ctx.fillStyle = P.pillar;
          ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 9, top - 10); ctx.lineTo(x + 18, top - 3); ctx.lineTo(x + 26, top - 14); ctx.lineTo(x + 26, top); ctx.fill();
        }
      }
    }

    drawGround(P, cam, live) {
      const ctx = this.ctx;
      const B = this.bottom;
      ctx.fillStyle = P.ground; ctx.fillRect(0, GROUND, this.W, B - GROUND);
      ctx.fillStyle = P.groundTop; ctx.fillRect(0, GROUND, this.W, 7);
      ctx.fillStyle = P.line;
      ctx.fillRect(0, GROUND + 7, this.W, 2);
      [GROUND + 36, GROUND + 66].forEach(y => ctx.fillRect(0, y, this.W, 2));
      const rows = [[GROUND + 9, 27, 0], [GROUND + 38, 28, 32], [GROUND + 68, 40, 0]];
      for (let y = GROUND + 98, i = 0; y < B; y += 30, i++) {
        ctx.fillRect(0, y - 2, this.W, 2); rows.push([y, 28, i % 2 ? 0 : 32]);
      }
      for (const [y, h, shift] of rows) {
        const step = 64, start = -((cam + shift) % step);
        for (let x = start; x < this.W; x += step) ctx.fillRect(x, y, 2, h);
      }
      // carved glyph every so often
      ctx.strokeStyle = P.line; ctx.lineWidth = 1.5;
      const gs = 512, gStart = -(cam % gs);
      for (let x = gStart + 200; x < this.W + 50; x += gs) {
        ctx.beginPath(); ctx.arc(x, GROUND + 52, 7, 0, 7); ctx.moveTo(x - 4, GROUND + 52); ctx.lineTo(x + 4, GROUND + 52); ctx.stroke();
      }
      if (!live) return;
      for (const o of this.obstacles) {
        const sx = o.x - cam;
        if (sx > this.W + 20 || sx + o.w < -20) continue;
        if (o.type === 'gap') {
          const g = ctx.createLinearGradient(0, GROUND, 0, B);
          g.addColorStop(0, '#000'); g.addColorStop(1, P.abyss);
          ctx.fillStyle = g; ctx.fillRect(sx, GROUND - 1, o.w, B - GROUND + 2);
          ctx.fillStyle = 'rgba(0,0,0,.45)';
          ctx.fillRect(sx, GROUND, 5, B - GROUND); ctx.fillRect(sx + o.w - 5, GROUND, 5, B - GROUND);
          // hanging roots inside the chasm
          ctx.strokeStyle = P.root; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx + 4, GROUND + 4); ctx.quadraticCurveTo(sx + 14, GROUND + 26, sx + 8, GROUND + 44);
          ctx.moveTo(sx + o.w - 4, GROUND + 4); ctx.quadraticCurveTo(sx + o.w - 16, GROUND + 22, sx + o.w - 10, GROUND + 34);
          ctx.stroke();
        } else {
          this.drawRoot(P, sx, o);
        }
      }
    }

    drawRoot(P, sx, o) {
      const ctx = this.ctx, w = o.w;
      ctx.lineCap = 'round';
      ctx.strokeStyle = P.root; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(sx - 8, GROUND + 4);
      ctx.bezierCurveTo(sx + w * 0.2, GROUND - ROOT_H - 6, sx + w * 0.8, GROUND - ROOT_H - 6, sx + w + 8, GROUND + 4); ctx.stroke();
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(sx + 2, GROUND + 3);
      ctx.bezierCurveTo(sx + w * 0.35, GROUND - ROOT_H * 0.6, sx + w * 0.55, GROUND - 4, sx + w * 0.7, GROUND - ROOT_H * 0.7); ctx.stroke();
      ctx.strokeStyle = P.rootHi; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx + w * 0.15, GROUND - ROOT_H * 0.55);
      ctx.quadraticCurveTo(sx + w * 0.5, GROUND - ROOT_H - 3, sx + w * 0.85, GROUND - ROOT_H * 0.55); ctx.stroke();
      ctx.fillStyle = P.leaf;
      ctx.beginPath(); ctx.ellipse(sx + w * 0.62, GROUND - ROOT_H - 4, 6, 3, -0.5, 0, 7); ctx.fill();
      ctx.lineCap = 'butt';
    }

    drawOrbs(cam) {
      const ctx = this.ctx;
      for (const o of this.orbs) {
        if (o.taken) continue;
        const x = o.x - cam; if (x < -20 || x > this.W + 20) continue;
        const y = o.y + Math.sin(this.t * 0.08 + o.x) * 3;
        this.glow(x, y, 16, 'rgba(255,190,80,.55)');
        ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff3c9'; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 2, 0, 7); ctx.fill();
      }
    }

    drawMajors(P, cam) {
      const ctx = this.ctx;
      for (const m of this.majors) {
        const x = m.x - cam; if (x < -120 || x > this.W + 120) continue;
        if (m.type === 'shrine') { this.drawShrine(P, x); continue; }
        if (m.taken) continue;
        const y = GROUND - 66 + Math.sin(this.t * 0.06 + m.x) * 6;
        const gemCol = m.type === 'gem' ? (PORTFOLIO.gems[m.idx] || {}).color || '#7fe' : null;
        // light beam
        const beam = ctx.createLinearGradient(0, 0, 0, GROUND);
        beam.addColorStop(0, 'rgba(255,220,140,0)'); beam.addColorStop(1, `rgba(255,220,140,${0.18 * P.glow + 0.06})`);
        ctx.fillStyle = beam; ctx.fillRect(x - 18, -this.offY, 36, GROUND + this.offY);
        this.glow(x, y, 46, gemCol ? gemCol + '88' : 'rgba(255,210,120,.6)');
        if (m.type === 'tablet') {
          ctx.fillStyle = '#8f877a'; this.rrect(x - 17, y - 23, 34, 46, 8); ctx.fill();
          ctx.fillStyle = '#b0a898'; this.rrect(x - 14, y - 20, 28, 40, 6); ctx.fill();
          ctx.strokeStyle = '#6b6357'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, y - 8, 5, 0, 7);
          ctx.moveTo(x - 8, y + 4); ctx.lineTo(x + 8, y + 4); ctx.moveTo(x - 8, y + 10); ctx.lineTo(x + 5, y + 10); ctx.stroke();
        } else if (m.type === 'gem') {
          ctx.fillStyle = gemCol;
          ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 14, y - 4); ctx.lineTo(x, y + 18); ctx.lineTo(x - 14, y - 4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.45)';
          ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 14, y - 4); ctx.lineTo(x, y - 1); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(0,0,0,.18)';
          ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x - 14, y - 4); ctx.lineTo(x, y - 1); ctx.closePath(); ctx.fill();
        } else if (m.type === 'scroll') {
          ctx.fillStyle = '#e9d3a4'; ctx.fillRect(x - 13, y - 16, 26, 32);
          ctx.fillStyle = '#c9a46a';
          this.rrect(x - 17, y - 21, 34, 8, 4); ctx.fill();
          this.rrect(x - 17, y + 13, 34, 8, 4); ctx.fill();
          ctx.fillStyle = '#a2402c'; ctx.fillRect(x - 13, y - 1, 26, 4);
          ctx.fillStyle = 'rgba(90,60,30,.5)';
          ctx.fillRect(x - 8, y - 10, 16, 2); ctx.fillRect(x - 8, y + 7, 12, 2);
        }
      }
    }

    drawShrine(P, x) {
      const ctx = this.ctx;
      this.glow(x, GROUND - 90, 150, `rgba(255,130,40,${0.35 * P.glow + 0.12})`);
      ctx.fillStyle = P.pillarDark; ctx.fillRect(x - 70, GROUND - 16, 140, 16);
      ctx.fillStyle = P.pillar; ctx.fillRect(x - 54, GROUND - 32, 108, 16);
      ctx.fillStyle = P.pillarDark; ctx.fillRect(x - 22, GROUND - 74, 44, 42);
      ctx.fillStyle = P.pillar; ctx.fillRect(x - 36, GROUND - 84, 72, 12);
      const fl = Math.sin(this.t * 0.3) * 4 + Math.sin(this.t * 0.73) * 2;
      ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 104, 22, 26 + fl, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff9a3d'; ctx.beginPath(); ctx.ellipse(x, GROUND - 100, 14, 18 + fl * 0.6, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 95, 7, 10, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = P.line; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, GROUND - 53, 9, 0, 7); ctx.moveTo(x, GROUND - 62); ctx.lineTo(x, GROUND - 44); ctx.stroke();
    }

    drawPlayer(P) {
      const ctx = this.ctx, p = this.p;
      const idleMode = !this.running && !this.ended;
      const x = this.playerX, y = (idleMode ? GROUND : p.y);
      const running = (this.running && p.grounded && !p.falling) || idleMode;
      const ph = idleMode ? this.t * 0.18 : p.anim;
      const swing = running ? Math.sin(ph) * 0.9 : 0;
      const bob = running ? Math.abs(Math.sin(ph)) * -2 : 0;
      ctx.save();
      if (p.inv > 0 && Math.floor(p.inv / 5) % 2 === 0) ctx.globalAlpha = 0.45;
      // ground shadow
      if (y >= GROUND - 120) {
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        const s = clamp(1 - (GROUND - y) / 140, 0.3, 1);
        ctx.beginPath(); ctx.ellipse(x, GROUND + 2, 13 * s, 3 * s, 0, 0, 7); ctx.fill();
      }
      ctx.translate(x, y + bob);
      if (p.stumble > 0 && this.running) ctx.rotate(0.18);
      ctx.lineCap = 'round';
      const leg = (a, col, tuck) => {
        ctx.strokeStyle = col; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0, -20);
        const kx = Math.sin(a) * 9 + (tuck ? 7 : 0), ky = -20 + 11 - (tuck ? 4 : 0);
        ctx.lineTo(kx, ky);
        ctx.lineTo(kx + Math.sin(a - 0.6) * 9 - (tuck ? 9 : 0), ky + 10 - (tuck ? 4 : 0));
        ctx.stroke();
      };
      const air = !running;
      leg(air ? -0.4 : -swing, '#2c1f16', air);
      // arm (back)
      ctx.strokeStyle = '#a8704a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-1, -37); ctx.lineTo(-1 + Math.sin(swing) * 11, -25 + (air ? -12 : 0)); ctx.stroke();
      // backpack
      ctx.fillStyle = '#6a4325'; this.rrect(-17, -42, 11, 18, 3); ctx.fill();
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(-17, -38, 11, 3);
      // torso
      ctx.fillStyle = '#257d72'; this.rrect(-8, -43, 16, 25, 5); ctx.fill();
      ctx.fillStyle = '#d6a54e'; ctx.fillRect(-8, -24, 16, 3);
      leg(air ? 0.6 : swing, '#3b2a1e', air);
      // arm (front)
      ctx.strokeStyle = '#c98b5e'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(1, -37); ctx.lineTo(1 - Math.sin(swing) * 11 + (air ? 6 : 0), -25 + (air ? -14 : 0)); ctx.stroke();
      // head
      ctx.fillStyle = '#c98b5e'; ctx.beginPath(); ctx.arc(2, -51, 8.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#1e1410';
      ctx.beginPath(); ctx.arc(1, -54, 8.6, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
      ctx.beginPath(); ctx.arc(-7, -52, 4.5, 0, 7); ctx.fill(); // bun
      // headband with flowing tails
      ctx.fillStyle = '#d9483b'; ctx.fillRect(-6, -56, 16, 3.5);
      ctx.strokeStyle = '#d9483b'; ctx.lineWidth = 2.5;
      const wv = Math.sin(this.t * 0.3) * 3;
      ctx.beginPath(); ctx.moveTo(-6, -55); ctx.quadraticCurveTo(-14, -57 + wv, -22, -52 + wv); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -54); ctx.quadraticCurveTo(-13, -51 - wv, -19, -47 - wv * 0.5); ctx.stroke();
      // eye
      ctx.fillStyle = '#1e1410'; ctx.beginPath(); ctx.arc(6, -51, 1.3, 0, 7); ctx.fill();
      ctx.restore();
    }

    drawParticles(cam) {
      const ctx = this.ctx;
      for (const q of this.particles) {
        const a = clamp(q.life / q.max, 0, 1);
        ctx.globalAlpha = a;
        if (q.text) {
          ctx.fillStyle = q.color; ctx.font = '700 15px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
          ctx.fillText(q.text, q.x - cam, q.y);
        } else {
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x - cam, q.y, q.r, 0, 7); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    drawVines(P, cam) {
      const ctx = this.ctx, off = cam * 0.95, span = 260;
      ctx.save(); ctx.translate(0, -this.offY);
      ctx.strokeStyle = P.vine; ctx.lineWidth = 3;
      for (let k = Math.floor(off / span) - 1; k <= Math.floor((off + this.W) / span) + 1; k++) {
        const x = k * span + hash(k + 70) * 160 - off, len = 30 + hash(k + 21) * 90;
        const sway = Math.sin(this.t * 0.02 + k) * 4;
        ctx.beginPath(); ctx.moveTo(x, -4); ctx.quadraticCurveTo(x + sway + 8, len * 0.5, x + sway, len); ctx.stroke();
        ctx.fillStyle = P.leaf;
        for (let j = 12; j < len; j += 16) {
          const lx = x + sway * (j / len) + 4;
          ctx.beginPath(); ctx.ellipse(lx + ((j / 16) % 2 ? 5 : -5), j, 6, 3, (j / 16) % 2 ? 0.6 : -0.6, 0, 7); ctx.fill();
        }
      }
      ctx.restore();
    }

    rrect(x, y, w, h, r) {
      const ctx = this.ctx; ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
  }

  global.TempleRun = TempleRun;
  global.TempleSfx = Sfx;
})(window);