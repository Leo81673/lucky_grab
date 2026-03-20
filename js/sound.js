// Lucky Grab — Sound Effects (Web Audio API, default muted)

let audioCtx = null;
let muted = true; // 기본: 소리 꺼짐

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function resumeCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

/** Play a tone sequence */
function playTones(tones) {
  if (muted) return;
  resumeCtx();
  const ctx = getCtx();
  const now = ctx.currentTime;

  tones.forEach(({ freq, start, duration, gain: g = 0.15, type = 'sine' }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(g, now + start);
    gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + duration);
  });
}

/** Play noise burst (for mechanical sounds) */
function playNoise(duration = 0.05, gain = 0.06) {
  if (muted) return;
  resumeCtx();
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
}

// --- Public sound effects ---

/** Crane moving tick */
export function playCraneMove() {
  if (muted) return;
  playNoise(0.02, 0.03);
}

/** Claw descending */
export function playClawDown() {
  playTones([
    { freq: 300, start: 0, duration: 0.6, gain: 0.08, type: 'sawtooth' },
    { freq: 200, start: 0.3, duration: 0.4, gain: 0.06, type: 'sawtooth' },
  ]);
}

/** Claw closing / grab */
export function playGrab() {
  playNoise(0.1, 0.1);
  playTones([
    { freq: 500, start: 0.05, duration: 0.15, gain: 0.1 },
    { freq: 600, start: 0.1, duration: 0.1, gain: 0.08 },
  ]);
}

/** Claw rising */
export function playClawUp() {
  playTones([
    { freq: 200, start: 0, duration: 0.6, gain: 0.08, type: 'sawtooth' },
    { freq: 350, start: 0.3, duration: 0.4, gain: 0.06, type: 'sawtooth' },
  ]);
}

/** Suspense buildup */
export function playSuspense() {
  playTones([
    { freq: 220, start: 0, duration: 0.4, gain: 0.08 },
    { freq: 262, start: 0.3, duration: 0.4, gain: 0.08 },
    { freq: 330, start: 0.6, duration: 0.4, gain: 0.08 },
    { freq: 392, start: 0.9, duration: 0.5, gain: 0.1 },
  ]);
}

/** Win fanfare */
export function playWin() {
  playTones([
    { freq: 523, start: 0, duration: 0.2, gain: 0.15 },
    { freq: 659, start: 0.15, duration: 0.2, gain: 0.15 },
    { freq: 784, start: 0.3, duration: 0.3, gain: 0.18 },
    { freq: 1047, start: 0.5, duration: 0.5, gain: 0.2 },
  ]);
}

/** Miss / empty grab */
export function playMiss() {
  playTones([
    { freq: 300, start: 0, duration: 0.3, gain: 0.1 },
    { freq: 200, start: 0.2, duration: 0.4, gain: 0.08, type: 'triangle' },
  ]);
}

// --- Mute toggle ---

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  if (!muted) {
    // Initialize AudioContext on first unmute (user gesture required)
    getCtx();
    resumeCtx();
  }
  return muted;
}
