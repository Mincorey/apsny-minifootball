-- ============================================================
-- APSNY Mini-Football Championship — Supabase Schema
-- Вставить целиком в Supabase SQL Editor и выполнить
-- ============================================================

-- UUID extension (обычно уже включён в Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. ТАБЛИЦЫ
-- ============================================================

CREATE TABLE IF NOT EXISTS seasons (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  year        integer NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leagues (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id  uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name       text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id  uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#64748b',
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name          text NOT NULL,
  number        integer,
  photo_url     text,
  permanent_ban boolean NOT NULL DEFAULT false,
  ban_matches   integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id    uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_a_id    uuid NOT NULL REFERENCES teams(id),
  team_b_id    uuid NOT NULL REFERENCES teams(id),
  score_a      integer,
  score_b      integer,
  tour         integer NOT NULL,
  status       text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'played', 'cancelled')),
  scheduled_at timestamptz,
  played_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_teams CHECK (team_a_id <> team_b_id)
);

CREATE TABLE IF NOT EXISTS match_player_stats (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id    uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals        integer NOT NULL DEFAULT 0,
  own_goals    integer NOT NULL DEFAULT 0,
  yellow_cards integer NOT NULL DEFAULT 0,
  red_cards    integer NOT NULL DEFAULT 0,
  UNIQUE (match_id, player_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  role       text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin', 'superadmin')),
  created_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- 2. ИНДЕКСЫ
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_leagues_season_id    ON leagues(season_id);
CREATE INDEX IF NOT EXISTS idx_teams_league_id      ON teams(league_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id      ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_league_id    ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_a_id    ON matches(team_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_id    ON matches(team_b_id);
CREATE INDEX IF NOT EXISTS idx_mps_match_id         ON match_player_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_mps_player_id        ON match_player_stats(player_id);


-- ============================================================
-- 3. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ is_admin()
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
  );
$$;


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE seasons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues             ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;

-- ---------- seasons ----------
CREATE POLICY "seasons_public_read"   ON seasons FOR SELECT USING (true);
CREATE POLICY "seasons_admin_insert"  ON seasons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "seasons_admin_update"  ON seasons FOR UPDATE USING (is_admin());
CREATE POLICY "seasons_admin_delete"  ON seasons FOR DELETE USING (is_admin());

-- ---------- leagues ----------
CREATE POLICY "leagues_public_read"   ON leagues FOR SELECT USING (true);
CREATE POLICY "leagues_admin_insert"  ON leagues FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "leagues_admin_update"  ON leagues FOR UPDATE USING (is_admin());
CREATE POLICY "leagues_admin_delete"  ON leagues FOR DELETE USING (is_admin());

-- ---------- teams ----------
CREATE POLICY "teams_public_read"   ON teams FOR SELECT USING (true);
CREATE POLICY "teams_admin_insert"  ON teams FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "teams_admin_update"  ON teams FOR UPDATE USING (is_admin());
CREATE POLICY "teams_admin_delete"  ON teams FOR DELETE USING (is_admin());

-- ---------- players ----------
CREATE POLICY "players_public_read"   ON players FOR SELECT USING (true);
CREATE POLICY "players_admin_insert"  ON players FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "players_admin_update"  ON players FOR UPDATE USING (is_admin());
CREATE POLICY "players_admin_delete"  ON players FOR DELETE USING (is_admin());

-- ---------- matches ----------
CREATE POLICY "matches_public_read"   ON matches FOR SELECT USING (true);
CREATE POLICY "matches_admin_insert"  ON matches FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "matches_admin_update"  ON matches FOR UPDATE USING (is_admin());
CREATE POLICY "matches_admin_delete"  ON matches FOR DELETE USING (is_admin());

-- ---------- match_player_stats ----------
CREATE POLICY "mps_public_read"   ON match_player_stats FOR SELECT USING (true);
CREATE POLICY "mps_admin_insert"  ON match_player_stats FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "mps_admin_update"  ON match_player_stats FOR UPDATE USING (is_admin());
CREATE POLICY "mps_admin_delete"  ON match_player_stats FOR DELETE USING (is_admin());

-- ---------- profiles ----------
-- Пользователь видит только свою строку; admin видит все
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

-- Строка создаётся автоматически триггером (от имени service_role)
-- UPDATE роли — только superadmin
CREATE POLICY "profiles_superadmin_update" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid() AND p2.role = 'superadmin'
    )
  );


-- ============================================================
-- 5. АВТОМАТИЧЕСКОЕ СОЗДАНИЕ PROFILE ПРИ РЕГИСТРАЦИИ
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Удаляем старый триггер если есть, создаём новый
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- 6. VIEW: standings (таблица чемпионата)
-- ============================================================

CREATE OR REPLACE VIEW standings AS
SELECT
  t.id                                                          AS team_id,
  t.name                                                        AS team_name,
  t.color,
  t.logo_url,
  t.league_id,
  COUNT(m.id)::int                                              AS played,
  COUNT(
    CASE WHEN (m.team_a_id = t.id AND m.score_a > m.score_b)
              OR (m.team_b_id = t.id AND m.score_b > m.score_a)
         THEN 1 END
  )::int                                                        AS wins,
  COUNT(
    CASE WHEN m.score_a = m.score_b THEN 1 END
  )::int                                                        AS draws,
  COUNT(
    CASE WHEN (m.team_a_id = t.id AND m.score_a < m.score_b)
              OR (m.team_b_id = t.id AND m.score_b < m.score_a)
         THEN 1 END
  )::int                                                        AS losses,
  COALESCE(SUM(
    CASE WHEN m.team_a_id = t.id THEN m.score_a
         WHEN m.team_b_id = t.id THEN m.score_b
    END
  ), 0)::int                                                    AS goals_for,
  COALESCE(SUM(
    CASE WHEN m.team_a_id = t.id THEN m.score_b
         WHEN m.team_b_id = t.id THEN m.score_a
    END
  ), 0)::int                                                    AS goals_against,
  (
    COUNT(
      CASE WHEN (m.team_a_id = t.id AND m.score_a > m.score_b)
                OR (m.team_b_id = t.id AND m.score_b > m.score_a)
           THEN 1 END
    ) * 3
    + COUNT(CASE WHEN m.score_a = m.score_b THEN 1 END)
  )::int                                                        AS points,
  (
    COALESCE(SUM(
      CASE WHEN m.team_a_id = t.id THEN m.score_a
           WHEN m.team_b_id = t.id THEN m.score_b
      END
    ), 0)
    - COALESCE(SUM(
      CASE WHEN m.team_a_id = t.id THEN m.score_b
           WHEN m.team_b_id = t.id THEN m.score_a
      END
    ), 0)
  )::int                                                        AS goal_diff
FROM teams t
LEFT JOIN matches m
       ON (m.team_a_id = t.id OR m.team_b_id = t.id)
      AND m.status = 'played'
GROUP BY t.id, t.name, t.color, t.logo_url, t.league_id;


-- ============================================================
-- 7. VIEW: top_scorers (бомбардиры)
-- ============================================================

CREATE OR REPLACE VIEW top_scorers AS
SELECT
  p.id                                         AS player_id,
  p.name                                       AS player_name,
  p.photo_url,
  p.permanent_ban,
  t.name                                       AS team_name,
  t.league_id,
  COALESCE(SUM(mps.goals),        0)::int      AS total_goals,
  COALESCE(SUM(mps.own_goals),    0)::int      AS total_own_goals,
  COALESCE(SUM(mps.yellow_cards), 0)::int      AS total_yellow,
  COALESCE(SUM(mps.red_cards),    0)::int      AS total_red
FROM players p
JOIN  teams t              ON t.id = p.team_id
LEFT JOIN match_player_stats mps ON mps.player_id = p.id
GROUP BY p.id, p.name, p.photo_url, p.permanent_ban, t.name, t.league_id;
