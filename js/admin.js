// Lucky Grab — Admin Dashboard
import { initSupabase, getSupabase } from './config.js';

let sb = null;
let currentEvents = [];
let editingEventId = null;

// --- Init ---
async function init() {
  sb = await initSupabase();

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}

// =============================================================
// Auth
// =============================================================
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';

  document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.textContent = '로그인 중...';
    errorEl.textContent = '';

    const { error } = await sb.auth.signInWithPassword({ email, password });

    if (error) {
      errorEl.textContent = '이메일 또는 비밀번호를 확인해주세요.';
      btn.disabled = false;
      btn.textContent = '로그인';
    } else {
      showDashboard();
    }
  };
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';

  document.getElementById('logoutBtn').onclick = async () => {
    await sb.auth.signOut();
    showLogin();
  };

  document.getElementById('createEventBtn').onclick = () => openEventModal();
  document.getElementById('createEventBtn2').onclick = () => openEventModal();
  document.getElementById('modalClose').onclick = () => closeEventModal();
  document.getElementById('detailClose').onclick = () => closeDetailModal();
  document.getElementById('addPrizeBtn').onclick = () => addPrizeRow();

  document.getElementById('eventForm').onsubmit = (e) => {
    e.preventDefault();
    saveEvent();
  };

  loadEvents();
}

// =============================================================
// Events CRUD
// =============================================================
async function loadEvents() {
  const { data: events, error } = await sb
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load events:', error);
    return;
  }

  currentEvents = events || [];
  renderEventTable();
  loadStats();
}

function renderEventTable() {
  const tbody = document.getElementById('eventTableBody');
  const emptyState = document.getElementById('eventEmpty');
  const tableWrap = document.getElementById('eventTableWrap');

  if (currentEvents.length === 0) {
    tableWrap.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  tableWrap.style.display = 'block';
  emptyState.style.display = 'none';

  tbody.innerHTML = currentEvents.map(ev => {
    const now = new Date();
    const start = new Date(ev.starts_at);
    const end = new Date(ev.ends_at);
    let status, tagClass;

    if (now < start) {
      status = '예정'; tagClass = 'tag-upcoming';
    } else if (now > end) {
      status = '종료'; tagClass = 'tag-expired';
    } else {
      status = '진행 중'; tagClass = 'tag-active';
    }

    const startStr = start.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    const endStr = end.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

    return `<tr>
      <td>${esc(ev.name)}</td>
      <td>${startStr} – ${endStr}</td>
      <td>-</td>
      <td><span class="tag ${tagClass}">${status}</span></td>
      <td><button class="table-action" data-id="${ev.id}">상세</button></td>
    </tr>`;
  }).join('');

  // Bind detail buttons
  tbody.querySelectorAll('.table-action').forEach(btn => {
    btn.onclick = () => openDetailModal(btn.dataset.id);
  });
}

async function loadStats() {
  // Total participants across all events
  const { count: totalParticipants } = await sb
    .from('participants')
    .select('*', { count: 'exact', head: true });

  const { count: winners } = await sb
    .from('participants')
    .select('*', { count: 'exact', head: true })
    .not('prize_id', 'is', null);

  const { data: remainingData } = await sb
    .from('prizes')
    .select('remaining_quantity')
    .not('remaining_quantity', 'is', null);

  const totalRemaining = (remainingData || []).reduce((s, p) => s + (p.remaining_quantity || 0), 0);
  const winRate = totalParticipants > 0 ? ((winners / totalParticipants) * 100).toFixed(1) + '%' : '-';

  document.getElementById('statParticipants').textContent = totalParticipants?.toLocaleString() || '0';
  document.getElementById('statWinRate').textContent = winRate;
  document.getElementById('statRemaining').textContent = totalRemaining.toLocaleString();
}

// =============================================================
// Event Modal (Create / Edit)
// =============================================================
function openEventModal(eventId) {
  editingEventId = eventId || null;
  const modal = document.getElementById('eventModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('eventForm');

  form.reset();
  document.getElementById('prizeList').innerHTML = '';
  document.getElementById('formError').textContent = '';

  if (eventId) {
    title.textContent = '이벤트 수정';
    loadEventForEdit(eventId);
  } else {
    title.textContent = '이벤트 생성';
    addPrizeRow(); // Start with one prize
  }

  modal.style.display = 'flex';
}

function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';
  editingEventId = null;
}

async function loadEventForEdit(eventId) {
  const { data: event } = await sb.from('events').select('*').eq('id', eventId).single();
  if (!event) return;

  document.getElementById('eventName').value = event.name;
  document.getElementById('eventSlug').value = event.slug;
  document.getElementById('eventStart').value = toLocalDatetime(event.starts_at);
  document.getElementById('eventEnd').value = toLocalDatetime(event.ends_at);
  document.getElementById('eventMaxPlays').value = event.max_plays_per_device;

  const { data: prizes } = await sb.from('prizes').select('*').eq('event_id', eventId);
  (prizes || []).forEach(p => addPrizeRow(p));
}

let prizeCounter = 0;
function addPrizeRow(data) {
  prizeCounter++;
  const list = document.getElementById('prizeList');
  const div = document.createElement('div');
  div.className = 'prize-row';
  div.dataset.prizeId = data?.id || '';
  div.innerHTML = `
    <div class="prize-row-header">
      <span class="prize-row-title">보상 ${prizeCounter}</span>
      <button type="button" class="admin-btn admin-btn-danger prize-remove">삭제</button>
    </div>
    <div class="prize-fields">
      <div>
        <label class="admin-label">보상 이름</label>
        <input class="admin-input prize-title" type="text" required value="${esc(data?.title || '')}" placeholder="10% 할인 쿠폰">
      </div>
      <div>
        <label class="admin-label">설명</label>
        <input class="admin-input prize-desc" type="text" value="${esc(data?.description || '')}" placeholder="전 상품 10% 할인">
      </div>
      <div>
        <label class="admin-label">가중치 (확률)</label>
        <input class="admin-input prize-weight" type="number" min="1" value="${data?.weight || 10}">
      </div>
      <div>
        <label class="admin-label">수량 (빈칸=무제한)</label>
        <input class="admin-input prize-qty" type="number" min="0" value="${data?.total_quantity ?? ''}">
      </div>
      <div>
        <label class="admin-label">쿠폰 유효시간(분)</label>
        <input class="admin-input prize-validity" type="number" min="1" value="${data?.coupon_validity_minutes || 30}">
      </div>
    </div>
  `;
  div.querySelector('.prize-remove').onclick = () => div.remove();
  list.appendChild(div);
}

async function saveEvent() {
  const errorEl = document.getElementById('formError');
  errorEl.textContent = '';

  const name = document.getElementById('eventName').value.trim();
  const slug = document.getElementById('eventSlug').value.trim();
  const startsAt = document.getElementById('eventStart').value;
  const endsAt = document.getElementById('eventEnd').value;
  const maxPlays = parseInt(document.getElementById('eventMaxPlays').value) || 3;

  if (!name || !slug || !startsAt || !endsAt) {
    errorEl.textContent = '모든 필수 항목을 입력해주세요.';
    return;
  }

  if (new Date(endsAt) <= new Date(startsAt)) {
    errorEl.textContent = '종료일이 시작일보다 나중이어야 합니다.';
    return;
  }

  const prizeRows = document.querySelectorAll('.prize-row');
  if (prizeRows.length === 0) {
    errorEl.textContent = '보상을 최소 1개 추가해주세요.';
    return;
  }

  const btn = document.getElementById('saveEventBtn');
  btn.disabled = true;
  btn.textContent = '저장 중...';

  try {
    let eventId = editingEventId;

    if (eventId) {
      // Update
      const { error } = await sb.from('events').update({
        name, slug,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        max_plays_per_device: maxPlays,
      }).eq('id', eventId);

      if (error) throw error;

      // Delete old prizes and re-create
      await sb.from('prizes').delete().eq('event_id', eventId);
    } else {
      // Create
      const { data, error } = await sb.from('events').insert({
        name, slug,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        max_plays_per_device: maxPlays,
      }).select().single();

      if (error) {
        if (error.code === '23505') {
          errorEl.textContent = '이미 사용 중인 슬러그입니다.';
        } else {
          errorEl.textContent = error.message;
        }
        btn.disabled = false;
        btn.textContent = '저장';
        return;
      }
      eventId = data.id;
    }

    // Save prizes
    const prizes = [];
    prizeRows.forEach(row => {
      const title = row.querySelector('.prize-title').value.trim();
      const description = row.querySelector('.prize-desc').value.trim();
      const weight = parseInt(row.querySelector('.prize-weight').value) || 1;
      const qtyVal = row.querySelector('.prize-qty').value;
      const totalQty = qtyVal === '' ? null : parseInt(qtyVal);
      const validity = parseInt(row.querySelector('.prize-validity').value) || 30;

      prizes.push({
        event_id: eventId,
        title, description, weight,
        total_quantity: totalQty,
        remaining_quantity: totalQty,
        coupon_validity_minutes: validity,
      });
    });

    const { error: prizeError } = await sb.from('prizes').insert(prizes);
    if (prizeError) throw prizeError;

    closeEventModal();
    loadEvents();
  } catch (err) {
    errorEl.textContent = err.message || '저장에 실패했습니다.';
  } finally {
    btn.disabled = false;
    btn.textContent = '저장';
  }
}

// =============================================================
// Event Detail Modal
// =============================================================
async function openDetailModal(eventId) {
  const modal = document.getElementById('detailModal');
  const event = currentEvents.find(e => e.id === eventId);
  if (!event) return;

  document.getElementById('detailTitle').textContent = event.name;

  // QR Code
  const gameUrl = `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?event=${event.slug}`;
  document.getElementById('qrUrl').textContent = gameUrl;

  const canvas = document.getElementById('qrCanvas');
  if (typeof QRCode !== 'undefined') {
    await QRCode.toCanvas(canvas, gameUrl, {
      width: 200,
      color: { dark: '#F0F0F5', light: '#1A1A2E' },
    });
  }

  document.getElementById('downloadQrBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = `tape-qr-${event.slug}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Prizes
  const { data: prizes } = await sb.from('prizes').select('*').eq('event_id', eventId);
  const prizesTbody = document.getElementById('detailPrizes');
  prizesTbody.innerHTML = (prizes || []).map(p => `
    <tr>
      <td>${esc(p.title)}</td>
      <td>${p.weight}</td>
      <td>${p.remaining_quantity ?? '∞'} / ${p.total_quantity ?? '∞'}</td>
    </tr>
  `).join('');

  // History
  const { data: history } = await sb
    .from('participants')
    .select('played_at, prize:prizes(title), coupons(code, is_used)')
    .eq('event_id', eventId)
    .order('played_at', { ascending: false })
    .limit(50);

  const historyTbody = document.getElementById('detailHistory');
  const historyEmpty = document.getElementById('historyEmpty');

  if (!history || history.length === 0) {
    historyTbody.innerHTML = '';
    historyEmpty.style.display = 'block';
  } else {
    historyEmpty.style.display = 'none';
    historyTbody.innerHTML = history.map(h => {
      const time = new Date(h.played_at).toLocaleString('ko-KR', {
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const prizeName = h.prize?.title || '꽝';
      const couponCode = h.coupons?.[0]?.code || '-';
      const used = h.coupons?.[0]?.is_used ? '✅' : (h.coupons?.[0] ? '⏳' : '-');
      return `<tr><td>${time}</td><td>${esc(prizeName)}</td><td>${couponCode}</td><td>${used}</td></tr>`;
    }).join('');
  }

  modal.style.display = 'flex';
}

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}

// =============================================================
// Helpers
// =============================================================
function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function toLocalDatetime(isoStr) {
  const d = new Date(isoStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

// Start
init();
