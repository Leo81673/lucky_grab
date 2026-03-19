-- Lucky Grab: Initial schema + RPC + RLS
-- Run via Supabase SQL Editor or `supabase db push`

-- =============================================================
-- 1. Tables
-- =============================================================

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  max_plays_per_device int NOT NULL DEFAULT 3,
  is_active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_dates_check CHECK (ends_at > starts_at)
);

CREATE TABLE prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  weight int NOT NULL DEFAULT 1 CHECK (weight > 0),
  total_quantity int,  -- NULL = unlimited
  remaining_quantity int,
  coupon_validity_minutes int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prizes_quantity_check CHECK (
    (total_quantity IS NULL AND remaining_quantity IS NULL)
    OR (total_quantity IS NOT NULL AND remaining_quantity IS NOT NULL AND remaining_quantity >= 0)
  )
);

CREATE TABLE participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  fingerprint text NOT NULL,
  ip_address inet,
  played_at timestamptz NOT NULL DEFAULT now(),
  prize_id uuid REFERENCES prizes(id) ON DELETE SET NULL
);

CREATE TABLE coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  expires_at timestamptz NOT NULL,
  is_used bool NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================
-- 2. Indexes
-- =============================================================

CREATE INDEX idx_participants_event_fp ON participants(event_id, fingerprint);
CREATE INDEX idx_participants_event_ip ON participants(event_id, ip_address);
CREATE INDEX idx_prizes_event ON prizes(event_id);
CREATE INDEX idx_coupons_participant ON coupons(participant_id);

-- =============================================================
-- 3. RPC: play_grab
-- =============================================================

CREATE OR REPLACE FUNCTION play_grab(
  p_event_slug text,
  p_fingerprint text,
  p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event events%ROWTYPE;
  v_play_count int;
  v_prize prizes%ROWTYPE;
  v_available_prizes prizes[];
  v_total_weight int;
  v_rand float;
  v_cumulative int;
  v_updated_prize prizes%ROWTYPE;
  v_participant_id uuid;
  v_coupon coupons%ROWTYPE;
  v_ip inet;
BEGIN
  -- 1. Find event
  SELECT * INTO v_event FROM events WHERE slug = p_event_slug AND is_active = true;
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('error', 'EVENT_NOT_FOUND');
  END IF;

  -- 2. Check time window
  IF now() < v_event.starts_at THEN
    RETURN jsonb_build_object('error', 'EVENT_NOT_STARTED', 'starts_at', v_event.starts_at);
  END IF;
  IF now() > v_event.ends_at THEN
    RETURN jsonb_build_object('error', 'EVENT_EXPIRED');
  END IF;

  -- 3. Check play count
  SELECT count(*) INTO v_play_count
  FROM participants
  WHERE event_id = v_event.id AND fingerprint = p_fingerprint;

  IF v_play_count >= v_event.max_plays_per_device THEN
    RETURN jsonb_build_object('error', 'LIMIT_EXCEEDED', 'max', v_event.max_plays_per_device);
  END IF;

  -- 4. Get available prizes
  SELECT array_agg(p ORDER BY p.id)
  INTO v_available_prizes
  FROM prizes p
  WHERE p.event_id = v_event.id
    AND (p.remaining_quantity IS NULL OR p.remaining_quantity > 0);

  -- No prizes available = miss
  IF v_available_prizes IS NULL OR array_length(v_available_prizes, 1) IS NULL THEN
    -- Record participation with no prize
    v_ip := CASE WHEN p_ip IS NOT NULL THEN p_ip::inet ELSE NULL END;
    INSERT INTO participants (event_id, fingerprint, ip_address, prize_id)
    VALUES (v_event.id, p_fingerprint, v_ip, NULL)
    RETURNING id INTO v_participant_id;

    RETURN jsonb_build_object(
      'success', true,
      'prize', NULL,
      'remaining_plays', v_event.max_plays_per_device - v_play_count - 1
    );
  END IF;

  -- 5. Weighted random selection
  v_total_weight := 0;
  FOR i IN 1..array_length(v_available_prizes, 1) LOOP
    v_total_weight := v_total_weight + v_available_prizes[i].weight;
  END LOOP;

  v_rand := random() * v_total_weight;
  v_cumulative := 0;
  v_prize := v_available_prizes[1]; -- fallback

  FOR i IN 1..array_length(v_available_prizes, 1) LOOP
    v_cumulative := v_cumulative + v_available_prizes[i].weight;
    IF v_rand <= v_cumulative THEN
      v_prize := v_available_prizes[i];
      EXIT;
    END IF;
  END LOOP;

  -- 6. Atomic stock decrement (if limited quantity)
  IF v_prize.remaining_quantity IS NOT NULL THEN
    UPDATE prizes
    SET remaining_quantity = remaining_quantity - 1
    WHERE id = v_prize.id AND remaining_quantity > 0
    RETURNING * INTO v_updated_prize;

    -- Race condition: someone else took the last one
    IF v_updated_prize IS NULL THEN
      -- Try again without this prize (recursive would be complex, so just miss)
      v_ip := CASE WHEN p_ip IS NOT NULL THEN p_ip::inet ELSE NULL END;
      INSERT INTO participants (event_id, fingerprint, ip_address, prize_id)
      VALUES (v_event.id, p_fingerprint, v_ip, NULL)
      RETURNING id INTO v_participant_id;

      RETURN jsonb_build_object(
        'success', true,
        'prize', NULL,
        'remaining_plays', v_event.max_plays_per_device - v_play_count - 1
      );
    END IF;
  END IF;

  -- 7. Record participation + create coupon
  v_ip := CASE WHEN p_ip IS NOT NULL THEN p_ip::inet ELSE NULL END;
  INSERT INTO participants (event_id, fingerprint, ip_address, prize_id)
  VALUES (v_event.id, p_fingerprint, v_ip, v_prize.id)
  RETURNING id INTO v_participant_id;

  INSERT INTO coupons (participant_id, prize_id, expires_at)
  VALUES (
    v_participant_id,
    v_prize.id,
    now() + (v_prize.coupon_validity_minutes || ' minutes')::interval
  )
  RETURNING * INTO v_coupon;

  -- 8. Return result
  RETURN jsonb_build_object(
    'success', true,
    'prize', jsonb_build_object(
      'title', v_prize.title,
      'description', v_prize.description
    ),
    'coupon', jsonb_build_object(
      'id', v_coupon.id,
      'code', v_coupon.code,
      'expires_at', v_coupon.expires_at
    ),
    'remaining_plays', v_event.max_plays_per_device - v_play_count - 1
  );
END;
$$;

-- =============================================================
-- 4. RLS Policies
-- =============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Events: public read (active only), admin write
CREATE POLICY "events_public_read" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "events_admin_all" ON events FOR ALL USING (auth.role() = 'authenticated');

-- Prizes: public read via event, admin write
CREATE POLICY "prizes_public_read" ON prizes FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = prizes.event_id AND events.is_active = true)
);
CREATE POLICY "prizes_admin_all" ON prizes FOR ALL USING (auth.role() = 'authenticated');

-- Participants: admin read only
CREATE POLICY "participants_admin_read" ON participants FOR SELECT USING (auth.role() = 'authenticated');

-- Coupons: public read own (by id), admin read all
CREATE POLICY "coupons_public_read" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_public_update" ON coupons FOR UPDATE USING (true) WITH CHECK (is_used = true);
CREATE POLICY "coupons_admin_all" ON coupons FOR ALL USING (auth.role() = 'authenticated');

-- Grant anon access to RPC
GRANT EXECUTE ON FUNCTION play_grab TO anon;
GRANT EXECUTE ON FUNCTION play_grab TO authenticated;
