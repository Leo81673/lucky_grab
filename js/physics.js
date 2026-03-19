// Lucky Grab — Physics-based Ball Stacking
import { BALL_SIZE, BALL_RADIUS, BALL_COUNT, BALL_COLORS } from './config.js';

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Create balls with physics simulation and add to the ball pit.
 * Returns array of ball objects { el, color, x, y, grabbed }.
 */
export function createBalls(ballPit) {
  ballPit.innerHTML = '';
  const balls = [];

  const pitW = ballPit.clientWidth || 334;
  const pitH = ballPit.clientHeight || 280;

  // Create particles above the pit
  const particles = [];
  for (let i = 0; i < BALL_COUNT; i++) {
    particles.push({
      x: randomBetween(BALL_RADIUS + 4, pitW - BALL_RADIUS - 4),
      y: randomBetween(-pitH * 1.5, -BALL_SIZE),
      vx: randomBetween(-1, 1),
      vy: 0,
    });
  }

  // Run simulation
  const GRAVITY = 0.6;
  const DAMPING = 0.3;
  const FRICTION = 0.95;
  const STEPS = 350;

  for (let step = 0; step < STEPS; step++) {
    for (const p of particles) {
      p.vy += GRAVITY;
      p.vx *= FRICTION;
      p.x += p.vx;
      p.y += p.vy;

      if (p.y + BALL_RADIUS > pitH - 2) {
        p.y = pitH - BALL_RADIUS - 2;
        p.vy *= -DAMPING;
        p.vx *= 0.8;
      }
      if (p.x - BALL_RADIUS < 2) {
        p.x = BALL_RADIUS + 2;
        p.vx *= -DAMPING;
      }
      if (p.x + BALL_RADIUS > pitW - 2) {
        p.x = pitW - BALL_RADIUS - 2;
        p.vx *= -DAMPING;
      }
    }

    // Ball-ball collisions
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = BALL_SIZE + 1;

        if (distSq < minDist * minDist && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          a.x -= nx * overlap * 0.5;
          a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5;
          b.y += ny * overlap * 0.5;

          const relVn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (relVn > 0) {
            a.vx -= relVn * nx * 0.5;
            a.vy -= relVn * ny * 0.5;
            b.vx += relVn * nx * 0.5;
            b.vy += relVn * ny * 0.5;
          }
        }
      }
    }
  }

  // Create DOM elements
  for (let i = 0; i < BALL_COUNT; i++) {
    const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
    const el = document.createElement('div');
    el.className = 'ball';
    el.style.width = BALL_SIZE + 'px';
    el.style.height = BALL_SIZE + 'px';
    el.style.background = color.bg;
    el.style.left = (particles[i].x - BALL_RADIUS) + 'px';
    el.style.top = (particles[i].y - BALL_RADIUS) + 'px';

    ballPit.appendChild(el);
    balls.push({ el, color, x: particles[i].x, y: particles[i].y, grabbed: false });
  }

  return balls;
}
