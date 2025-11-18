-- Migration: Remove xp_level and last_onboarding, Calculate Levels at Runtime
-- Description: Removes xp_level and last_onboarding columns from users table.
--              Simplifies trigger to only accumulate XP in current_xp.
--              Levels will be calculated at runtime in the frontend.

-- ========================================
-- 1. DROP VIEW THAT REFERENCES xp_level
-- ========================================
DROP VIEW IF EXISTS user_performance_metrics;

-- ========================================
-- 2. REMOVE COLUMNS FROM USERS TABLE
-- ========================================
ALTER TABLE users DROP COLUMN IF EXISTS xp_level;
ALTER TABLE users DROP COLUMN IF EXISTS last_onboarding;

-- ========================================
-- 3. UPDATE TRIGGER TO ONLY ACCUMULATE XP
-- ========================================
-- Replace the function to remove level calculation logic
-- current_xp now stores total accumulated XP (not remainder)

CREATE OR REPLACE FUNCTION handle_skill_completion_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_new_xp INT;
  v_is_complete BOOLEAN;
  v_already_awarded BOOLEAN;
BEGIN
  -- Get user from roadmap once
  SELECT user_id INTO v_user_id
  FROM roadmaps
  WHERE id = NEW.roadmap_id;

  -- Get current user XP once
  SELECT current_xp INTO v_current_xp
  FROM users
  WHERE id = v_user_id;

  v_new_xp := v_current_xp;

  -- Only act when a skill is marked as completed
  IF NEW.is_concluded = true AND (OLD.is_concluded = false OR OLD.is_concluded IS NULL) THEN

    -- === Award 50 XP for the completed skill ===
    v_new_xp := v_new_xp + 50;

    -- Log skill completion activity
    INSERT INTO activity_log (user_id, action, metadata)
    VALUES (
      v_user_id,
      'skill_completed',
      json_build_object(
        'roadmap_skill_id', NEW.id,
        'skill_id', NEW.skill_id,
        'xp_awarded', 50
      )::jsonb
    );

    -- === Check for roadmap completion (100%) ===
    SELECT NOT EXISTS (
      SELECT 1 FROM roadmap_skills
      WHERE roadmap_id = NEW.roadmap_id
      AND is_concluded = false
    ) INTO v_is_complete;

    -- Check if bonus was already awarded
    SELECT EXISTS (
      SELECT 1 FROM activity_log
      WHERE user_id = v_user_id
      AND action = 'roadmap_completed'
      AND metadata->>'roadmap_id' = NEW.roadmap_id::text
    ) INTO v_already_awarded;

    -- If roadmap is complete and bonus not yet awarded, add 500 XP
    IF v_is_complete AND NOT v_already_awarded THEN
      v_new_xp := v_new_xp + 500;

      -- Log roadmap completion bonus
      INSERT INTO activity_log (user_id, action, metadata)
      VALUES (
        v_user_id,
        'roadmap_completed',
        json_build_object(
          'roadmap_id', NEW.roadmap_id,
          'xp_awarded', 500
        )::jsonb
      );
    END IF;

    -- === Update user XP (no level calculation) ===
    UPDATE users
    SET current_xp = v_new_xp
    WHERE id = v_user_id;

  END IF;

  -- === Update roadmap progress percentage (runs on every update) ===
  UPDATE roadmaps
  SET percentual_progress = (
    SELECT ROUND(
      (COUNT(*) FILTER (WHERE is_concluded = true)::DECIMAL /
       NULLIF(COUNT(*), 0) * 100)::NUMERIC,
      2
    )
    FROM roadmap_skills
    WHERE roadmap_id = NEW.roadmap_id
  )
  WHERE id = NEW.roadmap_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 4. RECREATE USER PERFORMANCE METRICS VIEW (without xp_level)
-- ========================================
CREATE OR REPLACE VIEW user_performance_metrics AS
SELECT
  u.id AS user_id,
  u.name,
  u.email,
  u.current_xp,
  COUNT(DISTINCT r.id) AS total_roadmaps,
  COUNT(DISTINCT CASE WHEN r.percentual_progress = 100 THEN r.id END) AS completed_roadmaps,
  COUNT(DISTINCT rs.id) AS total_skills_in_roadmaps,
  COUNT(DISTINCT CASE WHEN rs.is_concluded THEN rs.id END) AS completed_skills,
  COALESCE(ROUND(AVG(r.percentual_progress), 2), 0) AS avg_roadmap_progress,
  COUNT(DISTINCT CASE WHEN cm.role = 'user' THEN cm.id END) AS total_chat_messages,
  MAX(rs.conclusion_date) AS last_skill_completion,
  u.creation_date AS account_created,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.creation_date)) / 86400 AS days_since_registration
FROM users u
LEFT JOIN roadmaps r ON u.id = r.user_id
LEFT JOIN roadmap_skills rs ON r.id = rs.roadmap_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id
GROUP BY u.id, u.name, u.email, u.current_xp, u.creation_date;
