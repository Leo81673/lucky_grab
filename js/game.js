// Lucky Grab — Main Game Entry Point
import { getEventSlug, initSupabase, onSupabaseReady } from './config.js';
import { createBalls } from './physics.js';
import { createCraneController } from './crane.js';
import { playGrab, loadEvent } from './supabase-api.js';
import {
  showWinResult, showMissResult, showEventStatus,
  showToast, hideResultOverlay, showSuspense, hideSuspense,
  updateRemainingPlays,
} from './ui.js';

// --- DOM Elements ---
const ballPit = document.getElementById('ballPit');
const clawAssembly = document.getElementById('clawAssembly');
const clawRope = document.getElementById('clawRope');
const grabbedBallEl = document.getElementById('grabbedBall');
const grabButton = document.getElementById('grabButton');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');
const retryButton = document.getElementById('retryButton');
const resultOverlay = document.getElementById('resultOverlay');

// --- State ---
let isGrabbing = false;
let balls = [];
let eventSlug = null;
let eventData = null;
let remainingPlays = null;

// --- Crane Controller ---
const crane = createCraneController({ clawAssembly, clawRope, grabbedBallEl });

// --- Init ---
async function init() {
  // 1. Set initial crane position
  clawAssembly.style.transition = 'none';
  clawAssembly.style.left = '50%';

  // 2. Create balls immediately (no server needed)
  balls = createBalls(ballPit);

  // 3. Get event slug
  eventSlug = getEventSlug();

  if (!eventSlug) {
    // No event param — show game in demo mode (no server)
    setupControls();
    return;
  }

  // 4. Load event (async — game UI already visible)
  grabButton.disabled = true;
  try {
    const sb = await initSupabase();
    eventData = await loadEvent(eventSlug);

    if (!eventData) {
      showEventStatus('EVENT_NOT_FOUND');
      return;
    }

    const now = new Date();
    if (now < new Date(eventData.starts_at)) {
      showEventStatus('EVENT_NOT_STARTED', eventData);
      return;
    }
    if (now > new Date(eventData.ends_at)) {
      showEventStatus('EVENT_EXPIRED');
      return;
    }

    // Event is valid — enable game
    grabButton.disabled = false;
    remainingPlays = eventData.max_plays_per_device;
    updateRemainingPlays(remainingPlays, eventData.max_plays_per_device);
  } catch {
    // Supabase not configured or network error — continue in demo mode
    grabButton.disabled = false;
  }

  setupControls();
}

function setupControls() {
  // Arrow buttons
  btnLeft.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!isGrabbing) crane.startMoving('left');
  });
  btnLeft.addEventListener('pointerup', () => crane.stopMoving('left'));
  btnLeft.addEventListener('pointerleave', () => crane.stopMoving('left'));
  btnLeft.addEventListener('pointercancel', () => crane.stopMoving('left'));

  btnRight.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!isGrabbing) crane.startMoving('right');
  });
  btnRight.addEventListener('pointerup', () => crane.stopMoving('right'));
  btnRight.addEventListener('pointerleave', () => crane.stopMoving('right'));
  btnRight.addEventListener('pointercancel', () => crane.stopMoving('right'));

  grabButton.addEventListener('click', () => grab());
  retryButton.addEventListener('click', () => resetGame());

  resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) resetGame();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!isGrabbing) crane.startMoving('left');
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (!isGrabbing) crane.startMoving('right');
    }
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      grab();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') crane.stopMoving('left');
    if (e.key === 'ArrowRight') crane.stopMoving('right');
  });
}

async function grab() {
  if (isGrabbing) return;
  isGrabbing = true;
  grabButton.disabled = true;
  btnLeft.disabled = true;
  btnRight.disabled = true;
  crane.stopAll();

  const pitW = ballPit.clientWidth || 334;
  const pitH = ballPit.clientHeight || 280;

  // 1. Play crane animation
  const animResult = await crane.playGrabAnimation(balls, pitW, pitH);

  if (!animResult.success) {
    // Claw missed visually
    showToast('아쉽! 조금 더 가까이 움직여보세요!');
    isGrabbing = false;
    grabButton.disabled = false;
    btnLeft.disabled = false;
    btnRight.disabled = false;
    return;
  }

  // 2. Show suspense
  showSuspense();
  await new Promise(r => setTimeout(r, 1500));
  hideSuspense();

  // 3. Call server (if event mode)
  if (eventSlug && eventData) {
    try {
      const result = await playGrab(eventSlug);

      if (result.error) {
        if (result.error === 'LIMIT_EXCEEDED') {
          showEventStatus('LIMIT_EXCEEDED');
          return;
        }
        showToast('네트워크를 확인해주세요');
        isGrabbing = false;
        grabButton.disabled = false;
        btnLeft.disabled = false;
        btnRight.disabled = false;
        return;
      }

      remainingPlays = result.remaining_plays;
      updateRemainingPlays(remainingPlays, eventData.max_plays_per_device);

      if (result.prize) {
        showWinResult(result.prize, result.coupon.id, animResult.color);
      } else {
        showMissResult(remainingPlays);
      }
    } catch {
      showToast('네트워크를 확인해주세요');
      isGrabbing = false;
      grabButton.disabled = false;
      btnLeft.disabled = false;
      btnRight.disabled = false;
    }
  } else {
    // Demo mode — always show win with fake prize
    const DEMO_PRIZES = [
      { title: '🎉 대박 당첨!', description: 'TAPE 최고의 특별 선물에 당첨되셨어요!' },
      { title: '⭐ 슈퍼 스타!', description: '반짝이는 스타 보너스! 특별한 혜택이 기다려요!' },
      { title: '🎁 선물 상자!', description: '깜짝 선물 상자 당첨! 무엇이 들어있을까요?' },
    ];
    const prize = DEMO_PRIZES[Math.floor(Math.random() * DEMO_PRIZES.length)];
    showWinResult(prize, 'demo', animResult.color);
  }
}

function resetGame() {
  hideResultOverlay(() => {
    crane.reset();
    balls = createBalls(ballPit);
    isGrabbing = false;

    if (remainingPlays !== null && remainingPlays <= 0) {
      grabButton.disabled = true;
      btnLeft.disabled = true;
      btnRight.disabled = true;
    } else {
      grabButton.disabled = false;
      btnLeft.disabled = false;
      btnRight.disabled = false;
    }
  });
}

// Start
init();
