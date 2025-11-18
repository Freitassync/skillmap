-- Migration: Add PL/PGSQL Routines for Automation
-- Description: Implements database triggers and functions to automate XP awards,
--              progress calculation, and performance metrics

-- Drop old triggers and functions
DROP TRIGGER IF EXISTS trigger_update_roadmap_progress ON roadmap_skills;
DROP FUNCTION IF EXISTS update_roadmap_progress();

DROP TRIGGER IF EXISTS trigger_award_xp_skill ON roadmap_skills;
DROP FUNCTION IF EXISTS award_xp_on_skill_completion();

DROP TRIGGER IF EXISTS trigger_check_roadmap_completion ON roadmap_skills;
DROP FUNCTION IF EXISTS check_roadmap_completion();

-- ========================================
-- 1. UNIFIED SKILL COMPLETION TRIGGER
-- ========================================
-- Combines all logic for skill completion into a single, optimized function.
-- This function handles:
-- - Awarding XP for skill completion
-- - Logging the activity
-- - Checking for roadmap completion and awarding a bonus
-- - Updating the overall roadmap progress percentage

CREATE OR REPLACE FUNCTION handle_skill_completion_update()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_current_xp INT;
  v_current_level INT;
  v_new_xp INT;
  v_new_level INT;
  v_is_complete BOOLEAN;
  v_already_awarded BOOLEAN;
BEGIN
  -- Get user from roadmap once
  SELECT user_id INTO v_user_id
  FROM roadmaps
  WHERE id = NEW.roadmap_id;

  -- Get current user XP and level once
  SELECT current_xp, xp_level INTO v_current_xp, v_current_level
  FROM users
  WHERE id = v_user_id;
  
  v_new_xp := v_current_xp;
  v_new_level := v_current_level;

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
    
    -- === Recalculate level based on new total XP ===
    WHILE v_new_xp >= 1000 LOOP
      v_new_level := v_new_level + 1;
      v_new_xp := v_new_xp - 1000;
    END LOOP;

    -- Update user XP and level in a single query
    UPDATE users
    SET current_xp = v_new_xp,
        xp_level = v_new_level
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

CREATE TRIGGER trigger_skill_completion_update
AFTER UPDATE OF is_concluded ON roadmap_skills
FOR EACH ROW
EXECUTE FUNCTION handle_skill_completion_update();


-- ========================================
-- 4. USER PERFORMANCE METRICS VIEW
-- ========================================
-- Provides aggregated metrics for each user's performance and progress

CREATE OR REPLACE VIEW user_performance_metrics AS
SELECT
  u.id AS user_id,
  u.name,
  u.email,
  u.xp_level,
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
GROUP BY u.id, u.name, u.email, u.xp_level, u.current_xp, u.creation_date;


-- ========================================
-- 5. SKILL POPULARITY RANKING FUNCTION
-- ========================================
-- Returns most popular skills based on usage and completion rate

CREATE OR REPLACE FUNCTION get_popular_skills(limit_count INT DEFAULT 10)
RETURNS TABLE(
  skill_id UUID,
  skill_name VARCHAR,
  skill_category VARCHAR,
  times_selected BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.category,
    COUNT(rs.id) AS times_selected,
    ROUND(
      COALESCE(
        (COUNT(*) FILTER (WHERE rs.is_concluded = true)::DECIMAL /
         NULLIF(COUNT(rs.id), 0) * 100),
        0
      ),
      2
    ) AS completion_rate
  FROM skills s
  LEFT JOIN roadmap_skills rs ON s.id = rs.skill_id
  GROUP BY s.id, s.name, s.category
  ORDER BY times_selected DESC, completion_rate DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
