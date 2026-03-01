(() => {
  'use strict';

  // --- Configuration ---
  const BALL_SIZE = 34;
  const BALL_RADIUS = BALL_SIZE / 2;
  const BALL_COUNT = 35;
  const CRANE_MIN = 12;
  const CRANE_MAX = 88;
  const CRANE_STEP = 0.7;
  const GRAB_RANGE = 32;

  const BALL_COLORS = [
    { bg: 'linear-gradient(135deg, #ff6b8a 0%, #ee3366 100%)', solid: '#ff6b8a' },
    { bg: 'linear-gradient(135deg, #66bbff 0%, #3388ee 100%)', solid: '#66bbff' },
    { bg: 'linear-gradient(135deg, #66eea0 0%, #33bb66 100%)', solid: '#66eea0' },
    { bg: 'linear-gradient(135deg, #ffdd66 0%, #eeaa22 100%)', solid: '#ffdd66' },
    { bg: 'linear-gradient(135deg, #cc88ff 0%, #9955ee 100%)', solid: '#cc88ff' },
    { bg: 'linear-gradient(135deg, #ff9966 0%, #ee6633 100%)', solid: '#ff9966' },
    { bg: 'linear-gradient(135deg, #ff66aa 0%, #ff3388 100%)', solid: '#ff66aa' },
    { bg: 'linear-gradient(135deg, #88dddd 0%, #44aaaa 100%)', solid: '#88dddd' },
  ];

  const PRIZES = [
    { title: '🎉 대박 당첨!', desc: 'TAPE 최고의 특별 선물에 당첨되셨어요!', weight: 2 },
    { title: '⭐ 슈퍼 스타!', desc: '반짝이는 스타 보너스! 특별한 혜택이 기다려요!', weight: 5 },
    { title: '🎁 선물 상자!', desc: '깜짝 선물 상자 당첨! 무엇이 들어있을까요?', weight: 10 },
    { title: '💎 히든 보석!', desc: '숨겨진 보석을 찾았어요! 특별 혜택을 받아가세요!', weight: 8 },
    { title: '🍀 행운의 부적!', desc: '행운이 찾아왔어요! TAPE가 응원합니다!', weight: 15 },
    { title: '🌟 반짝 스타!', desc: '오늘의 빛나는 별! 좋은 일이 가득할 거예요!', weight: 20 },
    { title: '🎶 뮤직 박스!', desc: '달콤한 멜로디와 함께하는 TAPE 특별 선물!', weight: 20 },
    { title: '🧸 귀여운 인형!', desc: '포근한 인형 친구가 당신을 기다려요!', weight: 20 },
  ];

  // --- DOM Elements ---
  const ballPit = document.getElementById('ballPit');
  const clawAssembly = document.getElementById('clawAssembly');
  const clawRope = document.getElementById('clawRope');
  const grabbedBallEl = document.getElementById('grabbedBall');
  const grabButton = document.getElementById('grabButton');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const resultOverlay = document.getElementById('resultOverlay');
  const resultBall = document.getElementById('resultBall');
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');
  const retryButton = document.getElementById('retryButton');
  const toast = document.getElementById('toast');

  // --- State ---
  let cranePos = 50;
  let movingLeft = false;
  let movingRight = false;
  let isGrabbing = false;
  let balls = [];
  let moveRAF = null;

  // --- Utility ---
  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * totalWeight;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Physics-based Ball Stacking ---
  function createBalls() {
    ballPit.innerHTML = '';
    balls = [];

    const pitW = ballPit.clientWidth || 334;
    const pitH = ballPit.clientHeight || 280;

    // Create particles at random positions above the pit
    const particles = [];
    for (let i = 0; i < BALL_COUNT; i++) {
      particles.push({
        x: randomBetween(BALL_RADIUS + 4, pitW - BALL_RADIUS - 4),
        y: randomBetween(-pitH * 1.5, -BALL_SIZE),
        vx: randomBetween(-1, 1),
        vy: 0,
      });
    }

    // Run physics simulation
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

        // Floor collision
        if (p.y + BALL_RADIUS > pitH - 2) {
          p.y = pitH - BALL_RADIUS - 2;
          p.vy *= -DAMPING;
          p.vx *= 0.8;
        }

        // Wall collisions
        if (p.x - BALL_RADIUS < 2) {
          p.x = BALL_RADIUS + 2;
          p.vx *= -DAMPING;
        }
        if (p.x + BALL_RADIUS > pitW - 2) {
          p.x = pitW - BALL_RADIUS - 2;
          p.vx *= -DAMPING;
        }
      }

      // Ball-ball collisions (separate loop for stability)
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

            // Push apart
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;

            // Velocity exchange
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

    // Create ball elements at settled positions
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
      balls.push({
        el,
        color,
        x: particles[i].x,
        y: particles[i].y,
        grabbed: false,
      });
    }
  }

  // --- Crane Movement ---
  function startMoving(dir) {
    if (isGrabbing) return;
    if (dir === 'left') movingLeft = true;
    if (dir === 'right') movingRight = true;
    if (!moveRAF) moveCrane();
  }

  function stopMoving(dir) {
    if (dir === 'left') movingLeft = false;
    if (dir === 'right') movingRight = false;
    if (!movingLeft && !movingRight && moveRAF) {
      cancelAnimationFrame(moveRAF);
      moveRAF = null;
    }
  }

  function moveCrane() {
    if (movingLeft) cranePos = Math.max(CRANE_MIN, cranePos - CRANE_STEP);
    if (movingRight) cranePos = Math.min(CRANE_MAX, cranePos + CRANE_STEP);
    clawAssembly.style.left = cranePos + '%';

    if (movingLeft || movingRight) {
      moveRAF = requestAnimationFrame(moveCrane);
    } else {
      moveRAF = null;
    }
  }

  // --- Grab Mechanic ---
  async function grab() {
    if (isGrabbing) return;
    isGrabbing = true;
    grabButton.disabled = true;
    btnLeft.disabled = true;
    btnRight.disabled = true;
    movingLeft = false;
    movingRight = false;
    if (moveRAF) {
      cancelAnimationFrame(moveRAF);
      moveRAF = null;
    }

    const pitW = ballPit.clientWidth || 334;
    const craneXInPit = (cranePos / 100) * pitW;

    // 1. Lower claw
    clawRope.style.transition = 'height 0.7s ease-in';
    clawRope.style.height = '215px';
    await delay(750);

    // 2. Shake balls
    balls.forEach(b => {
      if (!b.grabbed) b.el.classList.add('shaking');
    });
    await delay(250);

    // 3. Close claw
    clawAssembly.classList.add('closed');
    await delay(300);

    // 4. Find closest ball by horizontal distance
    let closestBall = null;
    let closestDist = Infinity;
    for (const b of balls) {
      if (b.grabbed) continue;
      const dx = Math.abs(b.x - craneXInPit);
      if (dx < closestDist) {
        closestDist = dx;
        closestBall = b;
      }
    }

    const success = closestBall && closestDist <= GRAB_RANGE;

    if (success) {
      // Hide grabbed ball from pit
      closestBall.grabbed = true;
      closestBall.el.style.opacity = '0';
      closestBall.el.style.transform = 'scale(0)';

      // Show on claw
      grabbedBallEl.style.background = closestBall.color.bg;
      grabbedBallEl.classList.add('visible');
    }

    // 5. Stop shaking
    await delay(200);
    balls.forEach(b => b.el.classList.remove('shaking'));

    // 6. Raise claw
    clawRope.style.transition = 'height 0.7s ease-out';
    clawRope.style.height = '20px';
    await delay(750);

    if (success) {
      // 7. Move to center
      clawAssembly.style.transition = 'left 0.4s ease';
      clawAssembly.style.left = '50%';
      await delay(450);

      // 8. Drop ball
      clawAssembly.classList.remove('closed');
      grabbedBallEl.classList.remove('visible');
      await delay(200);

      // 9. Reset transition & show result
      clawAssembly.style.transition = 'none';
      showResult(closestBall.color);
    } else {
      // Missed
      clawAssembly.classList.remove('closed');
      clawAssembly.style.transition = 'none';
      await delay(200);
      showToast('아쉽! 조금 더 가까이 움직여보세요!');

      isGrabbing = false;
      grabButton.disabled = false;
      btnLeft.disabled = false;
      btnRight.disabled = false;
    }
  }

  function showResult(color) {
    const prize = weightedRandom(PRIZES);

    resultBall.style.background = color.bg;
    resultTitle.textContent = prize.title;
    resultDesc.textContent = prize.desc;

    resultOverlay.style.display = 'flex';
    requestAnimationFrame(() => {
      resultOverlay.classList.add('visible');
    });

    spawnConfetti();
  }

  function spawnConfetti() {
    const card = document.querySelector('.result-card');
    const colors = ['#ff6b8a', '#66bbff', '#66eea0', '#ffdd66', '#cc88ff', '#ff9966'];

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = randomBetween(10, 90) + '%';
      confetti.style.top = randomBetween(-20, 30) + '%';
      confetti.style.animationDelay = randomBetween(0, 0.5) + 's';
      confetti.style.animationDuration = randomBetween(1, 2) + 's';
      confetti.style.width = randomBetween(5, 10) + 'px';
      confetti.style.height = randomBetween(5, 10) + 'px';
      card.appendChild(confetti);
    }

    setTimeout(() => {
      card.querySelectorAll('.confetti').forEach(c => c.remove());
    }, 2500);
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 1800);
  }

  function resetGame() {
    resultOverlay.classList.remove('visible');
    setTimeout(() => {
      resultOverlay.style.display = 'none';
    }, 400);

    clawAssembly.style.transition = 'none';
    clawAssembly.style.left = '50%';
    clawAssembly.classList.remove('closed');
    clawRope.style.transition = 'none';
    clawRope.style.height = '20px';
    grabbedBallEl.classList.remove('visible');
    cranePos = 50;

    createBalls();

    isGrabbing = false;
    grabButton.disabled = false;
    btnLeft.disabled = false;
    btnRight.disabled = false;
  }

  // --- Event Listeners ---

  // Arrow button controls (pointer events for touch + mouse)
  btnLeft.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startMoving('left');
  });
  btnLeft.addEventListener('pointerup', () => stopMoving('left'));
  btnLeft.addEventListener('pointerleave', () => stopMoving('left'));
  btnLeft.addEventListener('pointercancel', () => stopMoving('left'));

  btnRight.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startMoving('right');
  });
  btnRight.addEventListener('pointerup', () => stopMoving('right'));
  btnRight.addEventListener('pointerleave', () => stopMoving('right'));
  btnRight.addEventListener('pointercancel', () => stopMoving('right'));

  grabButton.addEventListener('click', () => grab());
  retryButton.addEventListener('click', () => resetGame());

  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) resetGame();
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!movingLeft) startMoving('left');
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!movingRight) startMoving('right');
    }
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      grab();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') stopMoving('left');
    if (e.key === 'ArrowRight') stopMoving('right');
  });

  // --- Init ---
  clawAssembly.style.transition = 'none';
  clawAssembly.style.left = cranePos + '%';
  createBalls();
})();
