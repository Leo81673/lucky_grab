-- Lucky Grab: play_grab() function tests
-- Run in Supabase SQL Editor after applying migration

-- Setup: create test event and prizes
DO $$
DECLARE
  v_event_id uuid;
  v_result jsonb;
BEGIN
  -- Clean up from previous runs
  DELETE FROM coupons WHERE participant_id IN (SELECT id FROM participants WHERE fingerprint LIKE 'test_%');
  DELETE FROM participants WHERE fingerprint LIKE 'test_%';
  DELETE FROM prizes WHERE event_id IN (SELECT id FROM events WHERE slug LIKE 'test_%');
  DELETE FROM events WHERE slug LIKE 'test_%';

  -- T1: Create active event with prizes
  INSERT INTO events (name, slug, starts_at, ends_at, max_plays_per_device)
  VALUES ('Test Event', 'test_active', now() - interval '1 hour', now() + interval '1 hour', 3)
  RETURNING id INTO v_event_id;

  INSERT INTO prizes (event_id, title, description, weight, total_quantity, remaining_quantity, coupon_validity_minutes)
  VALUES
    (v_event_id, 'Prize A', 'Desc A', 10, 5, 5, 30),
    (v_event_id, 'Prize B', 'Desc B', 20, NULL, NULL, 60); -- unlimited

  -- T1: Normal win — valid event, first play
  v_result := play_grab('test_active', 'test_fp_1', '127.0.0.1');
  ASSERT v_result->>'success' = 'true', 'T1 FAIL: expected success, got ' || v_result;
  ASSERT v_result->'prize' IS NOT NULL AND v_result->>'prize' != 'null', 'T1 FAIL: expected prize';
  ASSERT v_result->'coupon' IS NOT NULL, 'T1 FAIL: expected coupon';
  RAISE NOTICE 'T1 PASS: Normal win';

  -- T2: Event not found
  v_result := play_grab('test_nonexistent', 'test_fp_2');
  ASSERT v_result->>'error' = 'EVENT_NOT_FOUND', 'T2 FAIL: expected EVENT_NOT_FOUND';
  RAISE NOTICE 'T2 PASS: Event not found';

  -- T3: Event expired
  INSERT INTO events (name, slug, starts_at, ends_at, max_plays_per_device)
  VALUES ('Expired Event', 'test_expired', now() - interval '2 hours', now() - interval '1 hour', 3);

  v_result := play_grab('test_expired', 'test_fp_3');
  ASSERT v_result->>'error' = 'EVENT_EXPIRED', 'T3 FAIL: expected EVENT_EXPIRED';
  RAISE NOTICE 'T3 PASS: Event expired';

  -- T4: Event not started
  INSERT INTO events (name, slug, starts_at, ends_at, max_plays_per_device)
  VALUES ('Future Event', 'test_future', now() + interval '1 hour', now() + interval '2 hours', 3);

  v_result := play_grab('test_future', 'test_fp_4');
  ASSERT v_result->>'error' = 'EVENT_NOT_STARTED', 'T4 FAIL: expected EVENT_NOT_STARTED';
  RAISE NOTICE 'T4 PASS: Event not started';

  -- T5: Play count exceeded
  PERFORM play_grab('test_active', 'test_fp_limit');
  PERFORM play_grab('test_active', 'test_fp_limit');
  PERFORM play_grab('test_active', 'test_fp_limit');
  v_result := play_grab('test_active', 'test_fp_limit');
  ASSERT v_result->>'error' = 'LIMIT_EXCEEDED', 'T5 FAIL: expected LIMIT_EXCEEDED';
  RAISE NOTICE 'T5 PASS: Play count exceeded';

  -- T6: All prizes exhausted
  INSERT INTO events (name, slug, starts_at, ends_at, max_plays_per_device)
  VALUES ('Empty Event', 'test_empty', now() - interval '1 hour', now() + interval '1 hour', 10);

  INSERT INTO prizes (event_id, title, description, weight, total_quantity, remaining_quantity)
  VALUES ((SELECT id FROM events WHERE slug = 'test_empty'), 'Empty Prize', 'Gone', 10, 1, 0);

  v_result := play_grab('test_empty', 'test_fp_empty');
  ASSERT v_result->>'success' = 'true', 'T6 FAIL: expected success';
  ASSERT v_result->>'prize' IS NULL, 'T6 FAIL: expected null prize (miss)';
  RAISE NOTICE 'T6 PASS: All prizes exhausted (miss)';

  -- T9: Coupon validity check
  v_result := play_grab('test_active', 'test_fp_validity');
  IF v_result->'coupon' IS NOT NULL AND v_result->>'prize' != 'null' THEN
    DECLARE
      v_coupon_expires timestamptz;
    BEGIN
      v_coupon_expires := (v_result->'coupon'->>'expires_at')::timestamptz;
      ASSERT v_coupon_expires > now(), 'T9 FAIL: coupon already expired';
      ASSERT v_coupon_expires < now() + interval '2 hours', 'T9 FAIL: coupon expiry too far';
      RAISE NOTICE 'T9 PASS: Coupon validity minutes applied';
    END;
  ELSE
    RAISE NOTICE 'T9 SKIP: Got miss instead of win (random)';
  END IF;

  -- Cleanup
  DELETE FROM coupons WHERE participant_id IN (SELECT id FROM participants WHERE fingerprint LIKE 'test_%');
  DELETE FROM participants WHERE fingerprint LIKE 'test_%';
  DELETE FROM prizes WHERE event_id IN (SELECT id FROM events WHERE slug LIKE 'test_%');
  DELETE FROM events WHERE slug LIKE 'test_%';

  RAISE NOTICE '=== ALL TESTS PASSED ===';
END;
$$;
