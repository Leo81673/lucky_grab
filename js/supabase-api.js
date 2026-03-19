// Lucky Grab — Supabase API wrapper
import { getSupabase, initSupabase } from './config.js';
import { getFingerprint } from './fingerprint.js';

/** Load event info by slug. Returns event object or null. */
export async function loadEvent(slug) {
  const sb = await initSupabase();
  const { data, error } = await sb
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data;
}

/** Call play_grab RPC. Returns result object. */
export async function playGrab(eventSlug) {
  const sb = await initSupabase();
  const fingerprint = await getFingerprint();

  const { data, error } = await sb.rpc('play_grab', {
    p_event_slug: eventSlug,
    p_fingerprint: fingerprint,
    p_ip: null, // IP is detected server-side via request headers
  });

  if (error) {
    return { error: 'NETWORK_ERROR', message: error.message };
  }

  return data;
}

/** Load coupon by ID. Returns coupon with prize info or null. */
export async function loadCoupon(couponId) {
  const sb = await initSupabase();
  const { data, error } = await sb
    .from('coupons')
    .select('*, prize:prizes(title, description)')
    .eq('id', couponId)
    .single();

  if (error || !data) return null;
  return data;
}

/** Mark coupon as used. Returns success boolean. */
export async function markCouponUsed(couponId) {
  const sb = await initSupabase();
  const { error } = await sb
    .from('coupons')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', couponId)
    .eq('is_used', false);

  return !error;
}
