// Lucky Grab — Coupon Page
import { initSupabase } from './config.js';
import { loadCoupon, markCouponUsed } from './supabase-api.js';

const couponCard = document.getElementById('couponCard');
const couponContent = document.getElementById('couponContent');
const container = document.getElementById('couponContainer');

let couponData = null;
let timerInterval = null;

async function init() {
  const params = new URLSearchParams(window.location.search);
  const couponId = params.get('id');

  if (!couponId || couponId === 'demo') {
    showDemoCoupon();
    return;
  }

  try {
    await initSupabase();
    couponData = await loadCoupon(couponId);

    if (!couponData) {
      showError('쿠폰을 찾을 수 없어요', '올바른 링크인지 확인해주세요.');
      return;
    }

    renderCoupon();
  } catch {
    showError('연결할 수 없어요', '네트워크를 확인하고 다시 시도해주세요.');
  }
}

function renderCoupon() {
  const prize = couponData.prize;
  const isUsed = couponData.is_used;
  const expiresAt = new Date(couponData.expires_at);
  const isExpired = new Date() > expiresAt;

  couponContent.innerHTML = `
    <div class="coupon-badge">TAPE 이벤트</div>
    <div class="coupon-prize-title">${escapeHtml(prize.title)}</div>
    <p class="coupon-prize-desc">${escapeHtml(prize.description)}</p>
    <div class="coupon-timer" id="timer" aria-live="polite">--:--</div>
    <p class="coupon-timer-label" id="timerLabel">남은 시간</p>
    <button class="coupon-use-btn" id="useBtn">사용완료</button>
    <p class="coupon-code">쿠폰 코드: ${couponData.code}</p>
  `;

  const useBtn = document.getElementById('useBtn');

  if (isUsed) {
    couponCard.classList.add('used');
    useBtn.disabled = true;
    useBtn.textContent = '사용 완료됨';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('timer').className = 'coupon-timer expired';
    document.getElementById('timerLabel').textContent = '사용 완료';
    return;
  }

  if (isExpired) {
    useBtn.disabled = true;
    useBtn.textContent = '만료됨';
    document.getElementById('timer').textContent = '00:00';
    document.getElementById('timer').className = 'coupon-timer expired';
    document.getElementById('timerLabel').textContent = '쿠폰이 만료되었어요';
    return;
  }

  // Start countdown
  startCountdown(expiresAt);

  useBtn.addEventListener('click', async () => {
    useBtn.disabled = true;
    useBtn.textContent = '처리 중...';

    const success = await markCouponUsed(couponData.id);
    if (success) {
      couponCard.classList.add('used');
      useBtn.textContent = '사용 완료됨';
      if (timerInterval) clearInterval(timerInterval);
      document.getElementById('timerLabel').textContent = '사용 완료';
    } else {
      useBtn.disabled = false;
      useBtn.textContent = '다시 시도';
    }
  });
}

function startCountdown(expiresAt) {
  const timer = document.getElementById('timer');
  const timerLabel = document.getElementById('timerLabel');
  const useBtn = document.getElementById('useBtn');

  function update() {
    const now = Date.now();
    const diff = expiresAt.getTime() - now;

    if (diff <= 0) {
      timer.textContent = '00:00';
      timer.className = 'coupon-timer expired';
      timerLabel.textContent = '쿠폰이 만료되었어요';
      useBtn.disabled = true;
      useBtn.textContent = '만료됨';
      clearInterval(timerInterval);
      return;
    }

    const totalSeconds = Math.ceil(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Color transition based on remaining time
    const totalDuration = couponData.expires_at
      ? new Date(couponData.expires_at).getTime() - new Date(couponData.created_at).getTime()
      : 30 * 60 * 1000;
    const ratio = diff / totalDuration;

    if (ratio > 0.5) {
      timer.className = 'coupon-timer ok';
    } else if (ratio > 0.2) {
      timer.className = 'coupon-timer warning';
    } else {
      timer.className = 'coupon-timer urgent';
    }
  }

  update();
  timerInterval = setInterval(update, 1000);

  // Correct timer on tab visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) update();
  });
}

function showDemoCoupon() {
  couponContent.innerHTML = `
    <div class="coupon-badge">TAPE 이벤트 (데모)</div>
    <div class="coupon-prize-title">🎉 10% 할인</div>
    <p class="coupon-prize-desc">TAPE 매장 전 상품 10% 할인 쿠폰입니다!</p>
    <div class="coupon-timer ok" id="timer">29:59</div>
    <p class="coupon-timer-label">남은 시간</p>
    <button class="coupon-use-btn" id="useBtn">사용완료</button>
    <p class="coupon-code">쿠폰 코드: DEMO-XXXX</p>
  `;

  // Demo countdown
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  couponData = { expires_at: expiresAt.toISOString(), created_at: new Date().toISOString() };
  startCountdown(expiresAt);

  document.getElementById('useBtn').addEventListener('click', () => {
    couponCard.classList.add('used');
    document.getElementById('useBtn').disabled = true;
    document.getElementById('useBtn').textContent = '사용 완료됨';
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('timerLabel').textContent = '사용 완료';
  });
}

function showError(title, desc) {
  container.innerHTML = `
    <div class="brand-header" style="margin-bottom: 24px;">
      <h1 class="brand-name" style="font-size: 32px; letter-spacing: 6px;">TAPE</h1>
    </div>
    <div class="coupon-error">
      <div class="coupon-error-emoji">😥</div>
      <h2 class="coupon-error-title">${escapeHtml(title)}</h2>
      <p class="coupon-error-desc">${escapeHtml(desc)}</p>
    </div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
