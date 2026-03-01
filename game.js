(() => {
  'use strict';

  // --- Configuration ---
  const BALL_COLORS = [
    { bg: 'linear-gradient(135deg, #ff6b8a 0%, #ee3366 100%)', solid: '#ff6b8a', name: 'Pink' },
    { bg: 'linear-gradient(135deg, #66bbff 0%, #3388ee 100%)', solid: '#66bbff', name: 'Blue' },
    { bg: 'linear-gradient(135deg, #66eea0 0%, #33bb66 100%)', solid: '#66eea0', name: 'Green' },
    { bg: 'linear-gradient(135deg, #ffdd66 0%, #eeaa22 100%)', solid: '#ffdd66', name: 'Yellow' },
    { bg: 'linear-gradient(135deg, #cc88ff 0%, #9955ee 100%)', solid: '#cc88ff', name: 'Purple' },
    { bg: 'linear-gradient(135deg, #ff9966 0%, #ee6633 100%)', solid: '#ff9966', name: 'Orange' },
    { bg: 'linear-gradient(135deg, #d0d0e0 0%, #a0a0b8 100%)', solid: '#d0d0e0', name: 'Silver' },
    { bg: 'linear-gradient(135deg, #ff66aa 0%, #ff3388 100%)', solid: '#ff66aa', name: 'Hot Pink' },
  ];

  const PRIZES = [
    { title: '🎉 Grand Prize!', desc: 'You won the ultimate jackpot! A legendary reward awaits you!', weight: 2 },
    { title: '⭐ Super Star!', desc: 'Amazing pull! You\'ve earned a super star bonus reward!', weight: 5 },
    { title: '🎁 Gift Box!', desc: 'A surprise gift box is coming your way! Unwrap the fun!', weight: 10 },
    { title: '💎 Gem Found!', desc: 'You discovered a hidden gem! A rare and sparkling prize!', weight: 8 },
    { title: '🍀 Lucky Charm!', desc: 'Fortune smiles upon you! A lucky charm to brighten your day!', weight: 15 },
    { title: '🌟 Shining Star!', desc: 'You got a shining star! Keep glowing with positivity!', weight: 20 },
    { title: '🎶 Music Box!', desc: 'A delightful music box! Enjoy a melody of happiness!', weight: 20 },
    { title: '🧸 Cute Plushie!', desc: 'An adorable plushie just for you! Soft and huggable!', weight: 20 },
  ];

  const BALL_COUNT = 30;
  const BALL_SIZE_MIN = 28;
  const BALL_SIZE_MAX = 38;

  // --- DOM Elements ---
  const ballPit = document.getElementById('ballPit');
  const clawAssembly = document.getElementById('clawAssembly');
  const clawRope = document.getElementById('clawRope');
  const grabbedBall = document.getElementById('grabbedBall');
  const grabButton = document.getElementById('grabButton');
  const resultOverlay = document.getElementById('resultOverlay');
  const resultBall = document.getElementById('resultBall');
  const resultTitle = document.getElementById('resultTitle');
  const resultDesc = document.getElementById('resultDesc');
  const retryButton = document.getElementById('retryButton');

  let isPlaying = false;
  let balls = [];

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

  // --- Physics-based Ball Placement ---
  function createBalls() {
    ballPit.innerHTML = '';
    balls = [];

    const pitRect = ballPit.getBoundingClientRect();
    const pitWidth = pitRect.width || 334;
    const pitHeight = pitRect.height || 280;

    for (let i = 0; i < BALL_COUNT; i++) {
      const color = BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
      const size = Math.floor(randomBetween(BALL_SIZE_MIN, BALL_SIZE_MAX));
      const el = document.createElement('div');
      el.className = 'ball';
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = color.bg;

      // Stack balls from bottom, with slight randomization
      const col = i % 7;
      const row = Math.floor(i / 7);
      const baseX = (col / 7) * (pitWidth - size) + randomBetween(4, 12);
      const baseY = pitHeight - (row + 1) * (size * 0.85) - randomBetween(0, 8);

      const x = Math.max(4, Math.min(baseX, pitWidth - size - 4));
      const y = Math.max(size, Math.min(baseY, pitHeight - size - 4));

      el.style.left = x + 'px';
      el.style.top = y + 'px';

      ballPit.appendChild(el);
      balls.push({ el, color, size, x, y });
    }
  }

  // --- Claw Animation Sequence ---
  async function playClaw() {
    if (isPlaying) return;
    isPlaying = true;
    grabButton.disabled = true;

    const pitRect = ballPit.getBoundingClientRect();
    const pitWidth = pitRect.width || 334;
    const machineTop = document.querySelector('.machine-top');
    const railRect = machineTop.getBoundingClientRect();

    // Pick a random target X position
    const targetXPercent = randomBetween(20, 80);

    // 1. Move claw horizontally
    clawAssembly.style.left = targetXPercent + '%';
    await delay(400);

    // 2. Lower the claw (extend rope)
    const dropDistance = 220;
    clawRope.style.height = dropDistance + 'px';
    await delay(600);

    // 3. Shake balls near claw
    balls.forEach(b => b.el.classList.add('shaking'));
    await delay(300);

    // 4. Close claw (grab)
    clawAssembly.classList.add('closed');
    await delay(300);

    // 5. Pick random ball & color
    const chosenBall = balls[Math.floor(Math.random() * balls.length)];
    const chosenColor = chosenBall.color;

    // Hide a random ball from the pit
    chosenBall.el.style.opacity = '0';
    chosenBall.el.style.transform = 'scale(0)';
    chosenBall.el.style.transition = 'all 0.3s ease';

    // Show grabbed ball
    grabbedBall.style.background = chosenColor.bg;
    grabbedBall.classList.add('visible');

    // 6. Raise claw
    await delay(200);
    balls.forEach(b => b.el.classList.remove('shaking'));
    clawRope.style.height = '20px';
    await delay(600);

    // 7. Move claw to center (above exit)
    clawAssembly.style.left = '50%';
    await delay(400);

    // 8. Open claw (drop ball)
    clawAssembly.classList.remove('closed');
    grabbedBall.classList.remove('visible');
    await delay(200);

    // 9. Show result
    showResult(chosenColor);
  }

  function showResult(color) {
    const prize = weightedRandom(PRIZES);

    resultBall.style.background = color.bg;
    resultTitle.textContent = prize.title;
    resultDesc.textContent = prize.desc;

    // Show overlay with animation
    resultOverlay.style.display = 'flex';
    requestAnimationFrame(() => {
      resultOverlay.classList.add('visible');
    });

    // Spawn confetti
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

  function resetGame() {
    // Hide result overlay
    resultOverlay.classList.remove('visible');
    setTimeout(() => {
      resultOverlay.style.display = 'none';
    }, 400);

    // Reset claw
    clawAssembly.style.left = '50%';
    clawAssembly.classList.remove('closed');
    clawRope.style.height = '20px';
    grabbedBall.classList.remove('visible');

    // Recreate balls
    createBalls();

    isPlaying = false;
    grabButton.disabled = false;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Event Listeners ---
  grabButton.addEventListener('click', () => {
    playClaw();
  });

  retryButton.addEventListener('click', () => {
    resetGame();
  });

  // Close overlay on background click
  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) {
      resetGame();
    }
  });

  // --- Init ---
  createBalls();
})();
