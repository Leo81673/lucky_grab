// Lucky Grab — Configuration & Supabase Client
// TODO: Replace with your Supabase project values
const SUPABASE_URL = 'https://onaumunichnnroplofxa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1JKGxT-MRzgoQUOYSho3jg_LXqsN8lY';

// Game constants
export const BALL_SIZE = 34;
export const BALL_RADIUS = BALL_SIZE / 2;
export const BALL_COUNT = 35;
export const CRANE_MIN = 12;
export const CRANE_MAX = 88;
export const CRANE_STEP = 0.7;
export const GRAB_RANGE = 32;

export const BALL_COLORS = [
  { bg: 'linear-gradient(135deg, #ff6b8a 0%, #ee3366 100%)', solid: '#ff6b8a' },
  { bg: 'linear-gradient(135deg, #66bbff 0%, #3388ee 100%)', solid: '#66bbff' },
  { bg: 'linear-gradient(135deg, #66eea0 0%, #33bb66 100%)', solid: '#66eea0' },
  { bg: 'linear-gradient(135deg, #ffdd66 0%, #eeaa22 100%)', solid: '#ffdd66' },
  { bg: 'linear-gradient(135deg, #cc88ff 0%, #9955ee 100%)', solid: '#cc88ff' },
  { bg: 'linear-gradient(135deg, #ff9966 0%, #ee6633 100%)', solid: '#ff9966' },
  { bg: 'linear-gradient(135deg, #ff66aa 0%, #ff3388 100%)', solid: '#ff66aa' },
  { bg: 'linear-gradient(135deg, #88dddd 0%, #44aaaa 100%)', solid: '#88dddd' },
];

// Supabase client (lazy init)
let _supabase = null;
let _supabaseReady = false;
const _readyCallbacks = [];

export function getSupabase() {
  return _supabase;
}

export function isSupabaseReady() {
  return _supabaseReady;
}

export function onSupabaseReady(cb) {
  if (_supabaseReady) { cb(_supabase); return; }
  _readyCallbacks.push(cb);
}

export async function initSupabase() {
  if (_supabase) return _supabase;

  // Dynamic import of Supabase SDK from CDN
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  _supabaseReady = true;
  _readyCallbacks.forEach(cb => cb(_supabase));
  _readyCallbacks.length = 0;
  return _supabase;
}

// Get event slug from URL (supports both ?event=slug and /slug paths)
export function getEventSlug() {
  // 1. Check query param first (redirect landing)
  const params = new URLSearchParams(window.location.search);
  if (params.get('event')) return params.get('event');

  // 2. Check path (direct access via 404.html won't reach here, but future-proof)
  const segments = window.location.pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && !last.includes('.')) return last;

  return null;
}
