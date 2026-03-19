// Lucky Grab — Crane Movement & Grab Animation
import { CRANE_MIN, CRANE_MAX, CRANE_STEP, GRAB_RANGE } from './config.js';
import { settleBalls } from './physics.js';

export function createCraneController(elements) {
  const { clawAssembly, clawRope, grabbedBallEl } = elements;

  let cranePos = 50;
  let movingLeft = false;
  let movingRight = false;
  let moveRAF = null;

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

  function startMoving(dir) {
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

  function stopAll() {
    movingLeft = false;
    movingRight = false;
    if (moveRAF) {
      cancelAnimationFrame(moveRAF);
      moveRAF = null;
    }
  }

  function getCranePos() { return cranePos; }
  function setCranePos(pos) {
    cranePos = pos;
    clawAssembly.style.left = cranePos + '%';
  }

  /**
   * Play the full grab animation sequence.
   * Returns { success: boolean, closestBall: object|null, color: object|null }
   */
  async function playGrabAnimation(balls, pitWidth, pitHeight) {
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const craneXInPit = (cranePos / 100) * pitWidth;

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

    // 4. Find closest ball
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

    const grabbed = closestBall && closestDist <= GRAB_RANGE;

    if (grabbed) {
      closestBall.grabbed = true;
      closestBall.el.style.opacity = '0';
      closestBall.el.style.transform = 'scale(0)';
      grabbedBallEl.style.background = closestBall.color.bg;
      grabbedBallEl.classList.add('visible');

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([50, 30, 100]);

      // Remaining balls settle into the gap
      settleBalls(balls, pitWidth, pitHeight);
    }

    // 5. Stop shaking
    await delay(200);
    balls.forEach(b => b.el.classList.remove('shaking'));

    // 6. Raise claw
    clawRope.style.transition = 'height 0.7s ease-out';
    clawRope.style.height = '20px';
    await delay(750);

    if (grabbed) {
      // 7. Move to center
      clawAssembly.style.transition = 'left 0.4s ease';
      clawAssembly.style.left = '50%';
      await delay(450);

      // 8. Drop ball
      clawAssembly.classList.remove('closed');
      grabbedBallEl.classList.remove('visible');
      await delay(200);

      clawAssembly.style.transition = 'none';
    } else {
      clawAssembly.classList.remove('closed');
      clawAssembly.style.transition = 'none';
      await delay(200);
    }

    return {
      success: grabbed,
      closestBall: grabbed ? closestBall : null,
      color: grabbed ? closestBall.color : null,
    };
  }

  function reset() {
    clawAssembly.style.transition = 'none';
    clawAssembly.style.left = '50%';
    clawAssembly.classList.remove('closed');
    clawRope.style.transition = 'none';
    clawRope.style.height = '20px';
    grabbedBallEl.classList.remove('visible');
    cranePos = 50;
  }

  return {
    startMoving, stopMoving, stopAll,
    getCranePos, setCranePos,
    playGrabAnimation, reset,
  };
}
