// Lucky Grab — UI helpers (result overlay, toast, confetti, suspense)

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/** Show the "과연...?" suspense overlay during crane rise */
export function showSuspense() {
  let el = document.getElementById('suspenseOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'suspenseOverlay';
    el.className = 'suspense-overlay';
    el.innerHTML = '<span class="suspense-text">과연...?</span>';
    document.querySelector('.game-container').appendChild(el);
  }
  el.classList.add('visible');
}

export function hideSuspense() {
  const el = document.getElementById('suspenseOverlay');
  if (el) el.classList.remove('visible');
}

/** Show win result overlay */
export function showWinResult(prize, couponId, color) {
  const overlay = document.getElementById('resultOverlay');
  const ball = document.getElementById('resultBall');
  const title = document.getElementById('resultTitle');
  const desc = document.getElementById('resultDesc');

  ball.style.background = color.bg;
  title.textContent = prize.title;
  desc.textContent = prize.description;

  // Show coupon button
  let couponBtn = document.getElementById('couponBtn');
  if (!couponBtn) {
    couponBtn = document.createElement('button');
    couponBtn.id = 'couponBtn';
    couponBtn.className = 'coupon-button';
    couponBtn.textContent = '쿠폰 보기';
    document.querySelector('.result-card').insertBefore(couponBtn, document.getElementById('retryButton'));
  }
  couponBtn.style.display = 'block';
  couponBtn.onclick = () => {
    window.location.href = `coupon.html?id=${couponId}`;
  };

  // Show share button
  let shareBtn = document.getElementById('shareBtn');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.id = 'shareBtn';
    shareBtn.className = 'share-button';
    shareBtn.textContent = '공유하기';
    document.querySelector('.result-card').insertBefore(shareBtn, document.getElementById('retryButton'));
  }
  shareBtn.style.display = 'block';
  shareBtn.onclick = () => sharePrize(prize.title);

  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('visible'));
  spawnConfetti();
}

/** Show miss result overlay */
export function showMissResult(remainingPlays) {
  const overlay = document.getElementById('resultOverlay');
  const ball = document.getElementById('resultBall');
  const title = document.getElementById('resultTitle');
  const desc = document.getElementById('resultDesc');

  ball.style.background = 'linear-gradient(135deg, #8888AA 0%, #555577 100%)';
  title.textContent = '아깝! 😅';

  if (remainingPlays > 0) {
    desc.textContent = `조금만 더! 아직 ${remainingPlays}번 더 도전할 수 있어요!`;
  } else {
    desc.textContent = '모든 기회를 사용했어요. 다음에 또 만나요!';
  }

  // Hide win-specific buttons
  const couponBtn = document.getElementById('couponBtn');
  const shareBtn = document.getElementById('shareBtn');
  if (couponBtn) couponBtn.style.display = 'none';
  if (shareBtn) shareBtn.style.display = 'none';

  // Update retry button text
  const retryBtn = document.getElementById('retryButton');
  if (remainingPlays > 0) {
    retryBtn.textContent = '다시 도전!';
    retryBtn.disabled = false;
  } else {
    retryBtn.textContent = '다음에 또 만나요';
    retryBtn.disabled = true;
  }

  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('visible'));
}

/** Show event status screen (error, expired, not started, limit exceeded) */
export function showEventStatus(type, data) {
  const container = document.querySelector('.game-container');

  let html = '';
  switch (type) {
    case 'EVENT_NOT_FOUND':
      html = `
        <div class="status-screen">
          <div class="status-emoji">🔍</div>
          <h2 class="status-title">이벤트를 찾을 수 없어요</h2>
          <p class="status-desc">QR 코드를 다시 스캔해주세요.</p>
        </div>`;
      break;
    case 'EVENT_EXPIRED':
      html = `
        <div class="status-screen">
          <div class="status-emoji">🎪</div>
          <h2 class="status-title">이벤트가 끝났어요</h2>
          <p class="status-desc">다음 TAPE 이벤트에서 또 만나요!</p>
        </div>`;
      break;
    case 'EVENT_NOT_STARTED':
      html = `
        <div class="status-screen">
          <div class="status-emoji">⏰</div>
          <h2 class="status-title">곧 시작해요!</h2>
          <p class="status-desc">이벤트 시작까지 조금만 기다려주세요.</p>
          <p class="status-time">${data?.starts_at ? new Date(data.starts_at).toLocaleString('ko-KR') : ''}</p>
        </div>`;
      break;
    case 'LIMIT_EXCEEDED':
      html = `
        <div class="status-screen">
          <div class="status-emoji">✅</div>
          <h2 class="status-title">이미 참여하셨어요!</h2>
          <p class="status-desc">오늘의 행운은 이미 시작되었어요.</p>
        </div>`;
      break;
    default:
      html = `
        <div class="status-screen">
          <div class="status-emoji">😥</div>
          <h2 class="status-title">문제가 발생했어요</h2>
          <p class="status-desc">잠시 후 다시 시도해주세요.</p>
        </div>`;
  }

  // Replace game content with status screen
  container.innerHTML = html;
}

/** Show remaining plays count */
export function updateRemainingPlays(remaining, max) {
  let el = document.getElementById('remainingPlays');
  if (!el) {
    el = document.createElement('p');
    el.id = 'remainingPlays';
    el.className = 'remaining-plays';
    const hint = document.querySelector('.hint');
    if (hint) hint.after(el);
  }
  el.textContent = `남은 횟수: ${remaining}/${max}`;
}

export function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 1800);
}

export function hideResultOverlay(callback) {
  const overlay = document.getElementById('resultOverlay');
  overlay.classList.remove('visible');
  setTimeout(() => {
    overlay.style.display = 'none';
    if (callback) callback();
  }, 400);
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

async function sharePrize(prizeTitle) {
  const shareData = {
    title: 'TAPE × 럭키 그랩',
    text: `🎉 ${prizeTitle} 당첨! TAPE에서 행운을 잡았어요!`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      showToast('링크가 복사되었어요!');
    }
  } catch {
    // User cancelled share — do nothing
  }
}
