# АУДИТ ПРОЕКТА: Чемпионат Абхазии по мини-футболу
**Дата:** 22 мая 2026  
**Аудитор:** Senior Web Developer  
**Версия документа:** 1.0

---

## 📋 ОГЛАВЛЕНИЕ

1. [Обзор проекта](#1-обзор-проекта)
2. [Текущий технологический стек](#2-технологический-стек)
3. [Архитектура и структура кода](#3-архитектура-и-структура-кода)
4. [Функциональность приложения](#4-функциональность-приложения)
5. [Критические проблемы](#5-критические-проблемы)
6. [Дополнительные проблемы](#6-дополнительные-проблемы)
7. [Проектирование БД Supabase](#7-проектирование-бд-supabase)
8. [RLS-политики и доступы](#8-rls-политики-и-доступы)
9. [План миграции и рефакторинга](#9-план-миграции-и-рефакторинга)
10. [Приоритеты и дорожная карта](#10-приоритеты-и-дорожная-карта)

---

## ⚡ СТАТУС ПРОЕКТА (обновлено 23.05.2026)

### Прогресс работ
- **Фаза 1** (Инфраструктура Supabase): ✅ **100% завершена**
  - Supabase проект создан
  - БД схема развернута с Views и RLS
  - Клиент Supabase и типы настроены
  - Custom hooks для работы с данными созданы

- **Фаза 2** (Разбивка монолита): ❌ **Не начата** (App.tsx 3876 строк)
  
- **Фаза 3** (Supabase API): ⏳ **В процессе** (20% - только читаем данные)

- **Фаза 4** (UI улучшения): ❌ **Не начата**

- **Фаза 5** (Миграция данных): ❌ **Не начата**

### Что работает на Supabase
✅ Схема БД (tables, views, functions, RLS)
✅ Типы и интерфейсы
✅ Custom hooks (useTeams, useMatches, useLeagues, useSeasons, useStandings, useTopScorers)
✅ Supabase Storage bucket

### Что НЕ работает или не подключено
❌ App.tsx всё ещё использует localStorage
❌ Аутентификация администратора
❌ Запись данных на Supabase (CRUD операции)
❌ Real-time обновления
❌ Компоненты для управления интерфейсом
❌ Миграция начальных данных

### Следующие шаги (приоритет)
1. **Реализовать аутентификацию** (email/password для администратора)
2. **Подключить локальные данные из localStorage на Supabase** (одноразовая миграция)
3. **Заменить localStorage на Supabase READ** в App.tsx (все useMatches, useTeams и т.д.)
4. **Реализовать WRITE операции** (создание матчей, результаты, команды и т.д.)
5. **Разбить App.tsx на компоненты** (параллельно с пункт 4)

---

## 1. ОБЗОР ПРОЕКТА

**Назначение:** Web-приложение для ведения таблиц, статистики и расписания Чемпионата Абхазии по мини-футболу.

**Текущее состояние:** Прототип / MVP, созданный в Google AI Studio. Работает в браузере, данные хранятся в `localStorage` одного устройства. Полноценный релиз для заказчика **невозможен** в текущей архитектуре.

**Целевая аудитория:**
- **Администратор** — сотрудник организации, вводит результаты, управляет командами
- **Зрители/болельщики** — просматривают таблицу, бомбардиров, матчи

---

## 2. ТЕХНОЛОГИЧЕСКИЙ СТЕК

| Технология | Версия | Статус |
|------------|--------|--------|
| React | 19.0.1 | ✅ Актуально |
| TypeScript | 5.8.2 | ✅ Актуально |
| Vite | 6.2.3 | ✅ Актуально |
| TailwindCSS | 4.1.14 | ✅ Актуально |
| Lucide React | 0.546.0 | ✅ Актуально |
| Motion | 12.23.24 | ⚠️ Импортирован, не используется |
| @google/genai | 1.29.0 | ⚠️ Не используется в коде |
| Express | 4.21.2 | ⚠️ Лишняя зависимость (нет backend) |
| dotenv | 17.2.3 | ⚠️ Лишняя зависимость |
| **Supabase** | — | ❌ Отсутствует |
| **React Router** | — | ❌ Отсутствует |

---

## 3. АРХИТЕКТУРА И СТРУКТУРА КОДА

### 3.1 Текущая структура файлов

```
APSNY-MINIFOOTBALL/
├── src/
│   ├── App.tsx          ← 3877 строк — ВСЁ приложение в одном файле
│   ├── constants.ts     ← Типы, интерфейсы, начальные данные
│   ├── index.css        ← Стили
│   └── main.tsx         ← Точка входа
├── public/
│   ├── manifest.json    ← PWA-манифест
│   └── sw.js            ← Service Worker
├── index.html
├── vite.config.ts
├── package.json
└── .env.example
```

### 3.2 Интерфейсы данных (из constants.ts)

```typescript
Player {
  id: number;          // ← Date.now() или random — опасно!
  number?: number;
  name: string;
  goals: number;
  ownGoals: number;
  yellow: number;
  red: number;
  banMatches: number;
  permanentBan?: boolean;
  photo?: string;      // ← base64 в localStorage — проблема
}

Team {
  id: number;          // ← небезопасная генерация ID
  league: number;
  name: string;
  color: string;
  logo: string;        // ← base64 или emoji — проблема
  matches: number;     // ← денормализовано, дублирование
  win: number;         // ← денормализовано, дублирование
  draw: number;        // ← денормализовано, дублирование
  loss: number;        // ← денормализовано, дублирование
  gf: number;          // ← денормализовано, дублирование
  ga: number;          // ← денормализовано, дублирование
  players: Player[];   // ← вложенные данные (не нормализовано)
}

Match {
  id: number;
  teamAId: number;
  teamBId: number;
  tour: number;
  scoreA: number;
  scoreB: number;
  date: string;        // ← строка, не Date
  stats: Record<number, PlayerStats>;  // ← вложено в матч
  league: number;
}
```

### 3.3 Управление состоянием

В `App.tsx` обнаружено **22 хука `useState`** и **5 хуков `useEffect`** — всё в одном компоненте без разделения ответственности. Компонент отвечает за:
- Отображение UI (6+ вкладок × несколько подэкранов)
- Бизнес-логику (расчёт очков, генерация расписания)
- Работу с данными (CRUD операции)
- Персистентность (localStorage)

---

## 4. ФУНКЦИОНАЛЬНОСТЬ ПРИЛОЖЕНИЯ

### ✅ Реализовано и работает:

| Функция | Описание |
|---------|----------|
| Таблица чемпионата | Сортировка: очки → разница мячей → забито |
| Список бомбардиров | Топ-20, фото, команда |
| Карточки команд | Логотип, статистика, результаты |
| Детальная страница команды | Состав, прошедшие и будущие матчи |
| Ввод результатов | Со статистикой игроков (голы, ЖК, КК) |
| Расписание матчей | Запланированные и сыгранные |
| Генерация календаря | Round-robin автоматически |
| Архив сезонов | Сохранение и просмотр прошлых сезонов |
| Мастер создания лиги | Пошаговый wizard |
| Управление лигами | Несколько лиг, переименование, удаление |
| Профиль игрока | Фото, статистика, бан |
| Адмiн-панель | Управление командами, матчами, игроками |
| PWA-манифест | Установка на устройство |
| Тёмная тема | Единый дизайн |

### ❌ Отсутствует (нужно для релиза):

| Функция | Критичность |
|---------|------------|
| Серверная база данных | 🔴 КРИТИЧНО |
| Система аутентификации | 🔴 КРИТИЧНО |
| Мультиустройственность | 🔴 КРИТИЧНО |
| Нормальные модалки вместо alert() | 🟠 ВЫСОКАЯ |
| Toast-уведомления | 🟠 ВЫСОКАЯ |
| Разделение кода на компоненты | 🟠 ВЫСОКАЯ |
| Экспорт (PDF/Excel) | 🟡 СРЕДНЯЯ |
| Ассисты | 🟡 СРЕДНЯЯ |
| Поиск по командам/игрокам | 🟡 СРЕДНЯЯ |
| Плей-офф / кубковая сетка | 🟡 СРЕДНЯЯ |
| Push-уведомления | 🟢 НИЗКАЯ |

---

## 5. КРИТИЧЕСКИЕ ПРОБЛЕМЫ

### 🔴 ПРОБЛЕМА #1: localStorage — не база данных

**Описание:** Все данные хранятся только в браузере конкретного устройства через `localStorage`.

**Последствия:**
- Администратор вводит данные на своём ноутбуке — зрители видят только начальные данные
- Очистка кэша браузера = **потеря всех данных** навсегда
- Разные устройства — разные данные, синхронизации нет
- Лимит localStorage ≈ 5 МБ. При хранении логотипов командas base64 (каждый ~50-200 КБ) лимит будет превышен
- Продакшн-деплой на Vercel/Netlify ничего не решит — данные всё равно локальные

**Пример из кода:**
```typescript
// Сохранение — только в браузере!
localStorage.setItem("KFL_V1_TEAMS", JSON.stringify(teams));
// Загрузка — только с этого же браузера!
const saved = localStorage.getItem("KFL_V1_TEAMS");
```

**Решение:** Миграция на Supabase (см. раздел 7).

---

### 🔴 ПРОБЛЕМА #2: Монолитный компонент — 3877 строк

**Описание:** Весь код приложения находится в одном файле `App.tsx`.

**Последствия:**
- Невозможно работать в команде — постоянные конфликты
- Любое изменение может сломать несвязанную функцию
- Крайне медленная компиляция TypeScript
- Невозможно написать тесты
- Когнитивная нагрузка при изменении кода зашкаливает

**Пример:** Логика генерации round-robin расписания, отрисовка протокола матча, управление сезонами, отображение бомбардиров — всё в одной функции `App()`.

**Решение:** Разбить на 20+ компонентов + 5+ custom hooks (см. план в разделе 9).

---

### 🔴 ПРОБЛЕМА #3: Нет системы аутентификации

**Описание:** Доступ к режиму администратора открывается пятикратным кликом на заголовок.

**Последствия:**
- Любой пользователь может случайно или намеренно получить доступ к admin
- Нет разграничения ролей: "только просмотр" / "ввод результатов" / "полный доступ"
- Нет логов: кто и когда изменил данные

**Пример из кода:**
```typescript
if (clickCount.current === 5) {
  setIsAdmin(true);
  localStorage.setItem("KFL_V1_IS_ADMIN", "true");
  alert("Доступ администратора активирован!");
}
```

**Решение:** Supabase Auth с ролями (viewer / admin).

---

### 🔴 ПРОБЛЕМА #4: Денормализация статистики команд

**Описание:** Статистика команд (wins, draws, losses, gf, ga) хранится прямо на объекте `Team`, а не вычисляется из матчей.

**Последствия:**
- При редактировании или удалении матча нужно вручную пересчитывать статистику (`applyMatchStats` / `revertMatchStats`)
- Баг в логике пересчёта → **вечное расхождение** реальных и отображаемых данных
- Уже сейчас в начальных данных `constants.ts` статистика команд **захардкожена** и не совпадает с матчами

**Пример:** Команда "Аэропорт" имеет `matches: 4, win: 3` в constants.ts, но это может не соответствовать реальным матчам в `initialMatches`.

**Решение:** Хранить только матчи в БД. Статистику всегда **вычислять через SQL VIEW** — единственный источник правды.

---

### 🔴 ПРОБЛЕМА #5: Небезопасная генерация ID

**Описание:** Идентификаторы сущностей генерируются через `Date.now()` и `Math.random()`.

**Последствия:**
- `Date.now()` — миллисекунды. При быстром создании двух сущностей ID совпадут
- `Math.random()` без округления — `id: Date.now() + Math.random()` создаёт `id: 1716385823456.7234` — число с плавающей точкой как ID

**Пример из кода:**
```typescript
const newTeam: Team = {
  id: Date.now() + Math.random(),  // ← ПРОБЛЕМА
  ...
};
```

**Решение:** UUID v4 на клиенте или авто-ID из Supabase (UUID по умолчанию).

---

## 6. ДОПОЛНИТЕЛЬНЫЕ ПРОБЛЕМЫ

### 🟠 UI/UX: alert() и confirm() вместо нормального UI

В коде насчитывается **более 25 вызовов** `alert()`, `confirm()` и `prompt()`.

- `alert()` — блокирует интерфейс, нет стилизации, на мобиле неудобен
- `confirm()` — не поддерживает кастомный текст, нельзя добавить иконку опасности
- `prompt()` — самое примитивное решение для ввода данных

**Решение:** Заменить на компоненты `<Modal>`, `<ConfirmDialog>`, `<Toast>`.

---

### 🟠 Дублирование кода: отрисовка логотипа

Один и тот же блок для отображения логотипа команды повторяется **более 15 раз**:

```typescript
{team.logo.startsWith("data:") || team.logo.startsWith("http") ? (
  <img src={team.logo} alt="" className="w-full h-full object-contain" />
) : (
  <span className="text-4xl">{team.logo}</span>
)}
```

**Решение:** Компонент `<TeamLogo />`.

---

### 🟠 Мобильная версия: проблемы

- Admin-таблицы имеют `min-w-[800px]` — горизонтальный скролл на телефоне
- Bottom navigation перекрывает контент (нет отступа `pb-20` везде)
- Форма ввода игрока через `prompt()` — системный диалог, не адаптирован под мобиль
- Протокол матча: долго искать свою команду при большом составе

---

### 🟠 Хранение изображений в localStorage

Фото игроков и логотипы команд хранятся как base64-строки в localStorage.

- Одно фото 400×400px ≈ 80-200 КБ в base64
- 20 команд × 15 игроков × 100 КБ = **30 МБ** — в 6 раз больше лимита localStorage
- При каждом `setTeams()` React сериализует весь этот объём в JSON

**Решение:** Supabase Storage (S3-compatible) — URL вместо base64.

---

### 🟡 TypeScript: использование `any`

В коде истории сезонов повсеместно используется `any`:
```typescript
const [seasonHistory, setSeasonHistory] = useState<any[]>(() => {...});
```

Это уничтожает преимущества TypeScript. Нужны строгие типы для `SeasonRecord`.

---

### 🟡 Строки вместо дат

Даты хранятся как строки (`"01.05.2026"`) — невозможна сортировка, фильтрация, сравнение.

**Решение:** Хранить `timestamp` в БД, отображать локализованно через `Intl.DateTimeFormat`.

---

### 🟡 Hardcoded строки

```typescript
<p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">
  Основан 2024  // ← жёстко прописан год
</p>
```

---

## 7. ПРОЕКТИРОВАНИЕ БД SUPABASE

### 7.1 Схема базы данных

```sql
-- ============================================
-- ТАБЛИЦА: Сезоны
-- ============================================
CREATE TABLE seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,              -- "Сезон 2026"
  year        INT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'archived')),
  started_at  DATE,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ТАБЛИЦА: Лиги (внутри сезона)
-- ============================================
CREATE TABLE leagues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id   UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,              -- "1 Лига", "2 Лига"
  sort_order  INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ТАБЛИЦА: Команды
-- ============================================
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id   UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#8b5cf6',
  logo_url    TEXT,                       -- URL из Supabase Storage (не base64!)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ТАБЛИЦА: Игроки
-- ============================================
CREATE TABLE players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  number         INT,
  photo_url      TEXT,                    -- URL из Supabase Storage
  permanent_ban  BOOLEAN NOT NULL DEFAULT false,
  ban_matches    INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ТАБЛИЦА: Матчи
-- ============================================
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id       UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  team_a_id       UUID NOT NULL REFERENCES teams(id),
  team_b_id       UUID NOT NULL REFERENCES teams(id),
  score_a         INT,                    -- NULL если матч не сыгран
  score_b         INT,
  tour            INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'played', 'cancelled')),
  scheduled_at    TIMESTAMPTZ,            -- дата/время матча
  played_at       DATE,                   -- дата проведения
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_teams CHECK (team_a_id != team_b_id)
);

-- ============================================
-- ТАБЛИЦА: Статистика игроков в матчах
-- ============================================
CREATE TABLE match_player_stats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals       INT NOT NULL DEFAULT 0,
  own_goals   INT NOT NULL DEFAULT 0,
  yellow_cards INT NOT NULL DEFAULT 0,
  red_cards   INT NOT NULL DEFAULT 0,
  UNIQUE (match_id, player_id)
);

-- ============================================
-- ТАБЛИЦА: Профили пользователей (админы)
-- ============================================
CREATE TABLE profiles (
  id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email   TEXT NOT NULL,
  role    TEXT NOT NULL DEFAULT 'viewer'
          CHECK (role IN ('viewer', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 7.2 Вычисляемые представления (Views)

Статистику команд **никогда не храним** — только вычисляем!

```sql
-- ============================================
-- VIEW: Турнирная таблица
-- ============================================
CREATE VIEW standings AS
SELECT
  t.id          AS team_id,
  t.name        AS team_name,
  t.color,
  t.logo_url,
  t.league_id,
  COUNT(m.id) FILTER (WHERE m.status = 'played')                AS played,
  COUNT(m.id) FILTER (
    WHERE m.status = 'played' AND (
      (m.team_a_id = t.id AND m.score_a > m.score_b) OR
      (m.team_b_id = t.id AND m.score_b > m.score_a)
    )
  )                                                              AS wins,
  COUNT(m.id) FILTER (
    WHERE m.status = 'played' AND m.score_a = m.score_b
  )                                                              AS draws,
  COUNT(m.id) FILTER (
    WHERE m.status = 'played' AND (
      (m.team_a_id = t.id AND m.score_a < m.score_b) OR
      (m.team_b_id = t.id AND m.score_b < m.score_a)
    )
  )                                                              AS losses,
  COALESCE(SUM(
    CASE WHEN m.team_a_id = t.id THEN m.score_a
         WHEN m.team_b_id = t.id THEN m.score_b
         ELSE 0 END
  ) FILTER (WHERE m.status = 'played'), 0)                      AS goals_for,
  COALESCE(SUM(
    CASE WHEN m.team_a_id = t.id THEN m.score_b
         WHEN m.team_b_id = t.id THEN m.score_a
         ELSE 0 END
  ) FILTER (WHERE m.status = 'played'), 0)                      AS goals_against
FROM teams t
LEFT JOIN matches m ON (m.team_a_id = t.id OR m.team_b_id = t.id)
GROUP BY t.id, t.name, t.color, t.logo_url, t.league_id;

-- ============================================
-- VIEW: Бомбардиры
-- ============================================
CREATE VIEW top_scorers AS
SELECT
  p.id          AS player_id,
  p.name        AS player_name,
  p.photo_url,
  p.permanent_ban,
  t.name        AS team_name,
  t.league_id,
  COALESCE(SUM(mps.goals), 0)       AS total_goals,
  COALESCE(SUM(mps.own_goals), 0)   AS total_own_goals,
  COALESCE(SUM(mps.yellow_cards), 0) AS total_yellow,
  COALESCE(SUM(mps.red_cards), 0)   AS total_red
FROM players p
JOIN teams t ON p.team_id = t.id
LEFT JOIN match_player_stats mps ON mps.player_id = p.id
GROUP BY p.id, p.name, p.photo_url, p.permanent_ban, t.name, t.league_id
ORDER BY total_goals DESC;
```

---

## 8. RLS-ПОЛИТИКИ И ДОСТУПЫ

```sql
-- ============================================
-- Включаем RLS для всех таблиц
-- ============================================
ALTER TABLE seasons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues            ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Вспомогательная функция: проверка роли
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- ПОЛИТИКИ: Публичное чтение (все таблицы)
-- ============================================
CREATE POLICY "public_read_seasons"    ON seasons    FOR SELECT USING (true);
CREATE POLICY "public_read_leagues"    ON leagues    FOR SELECT USING (true);
CREATE POLICY "public_read_teams"      ON teams      FOR SELECT USING (true);
CREATE POLICY "public_read_players"    ON players    FOR SELECT USING (true);
CREATE POLICY "public_read_matches"    ON matches    FOR SELECT USING (true);
CREATE POLICY "public_read_stats"      ON match_player_stats FOR SELECT USING (true);

-- ============================================
-- ПОЛИТИКИ: Запись только для администраторов
-- ============================================
CREATE POLICY "admin_insert_seasons" ON seasons    FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "admin_update_seasons" ON seasons    FOR UPDATE USING (is_admin());
CREATE POLICY "admin_delete_seasons" ON seasons    FOR DELETE USING (is_admin());

CREATE POLICY "admin_write_leagues"   ON leagues    FOR ALL USING (is_admin());
CREATE POLICY "admin_write_teams"     ON teams      FOR ALL USING (is_admin());
CREATE POLICY "admin_write_players"   ON players    FOR ALL USING (is_admin());
CREATE POLICY "admin_write_matches"   ON matches    FOR ALL USING (is_admin());
CREATE POLICY "admin_write_stats"     ON match_player_stats FOR ALL USING (is_admin());

-- ============================================
-- ПОЛИТИКИ: Профили — только свои данные
-- ============================================
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- Только superadmin может назначать роли
CREATE POLICY "superadmin_profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
```

### Матрица доступов

| Действие | Анонимный | Viewer | Admin | Superadmin |
|----------|-----------|--------|-------|------------|
| Смотреть таблицу | ✅ | ✅ | ✅ | ✅ |
| Смотреть матчи | ✅ | ✅ | ✅ | ✅ |
| Вводить результаты | ❌ | ❌ | ✅ | ✅ |
| Управление командами | ❌ | ❌ | ✅ | ✅ |
| Управление сезонами | ❌ | ❌ | ✅ | ✅ |
| Назначение ролей | ❌ | ❌ | ❌ | ✅ |

---

## 9. ПЛАН МИГРАЦИИ И РЕФАКТОРИНГА

### Фаза 1: Подготовка инфраструктуры (1-2 дня)

- [x] Создать проект в Supabase
- [x] Выполнить SQL-миграции (схема из раздела 7)
- [x] Настроить Supabase Storage bucket для изображений
- [x] Создать учётную запись superadmin
- [x] Добавить `@supabase/supabase-js` в зависимости
- [x] Создать `src/lib/supabase.ts` — клиент Supabase
- [x] Настроить `.env` с `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- [x] Сгенерировать типы из БД Supabase (`src/types/database.ts`)
- [x] Создать custom hooks для работы с данными

### Фаза 2: Разбивка монолита на компоненты (3-5 дней)

**Статус:** ❌ Не начата (App.tsx всё ещё 3876 строк)

Рекомендуемая структура проекта после рефакторинга:

```
src/
├── lib/
│   ├── supabase.ts           # Клиент Supabase
│   └── utils.ts              # Хелперы
├── types/
│   └── index.ts              # Все TypeScript-интерфейсы
├── hooks/
│   ├── useStandings.ts       # Турнирная таблица
│   ├── useMatches.ts         # Матчи
│   ├── useTeams.ts           # Команды
│   ├── usePlayers.ts         # Игроки
│   ├── useLeagues.ts         # Лиги
│   ├── useSeason.ts          # Текущий сезон
│   └── useAuth.ts            # Аутентификация
├── components/
│   ├── ui/                   # Атомарные компоненты
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Toast.tsx
│   │   ├── TeamLogo.tsx
│   │   └── PlayerPhoto.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── BottomNav.tsx
│   │   └── LeagueSelector.tsx
│   ├── standings/
│   │   └── StandingsTable.tsx
│   ├── matches/
│   │   ├── MatchList.tsx
│   │   ├── MatchCard.tsx
│   │   └── MatchProtocol.tsx
│   ├── teams/
│   │   ├── TeamGrid.tsx
│   │   ├── TeamCard.tsx
│   │   └── TeamDetail.tsx
│   ├── players/
│   │   ├── TopScorers.tsx
│   │   └── PlayerModal.tsx
│   ├── admin/
│   │   ├── AdminPanel.tsx
│   │   ├── MatchForm.tsx
│   │   ├── TeamManager.tsx
│   │   ├── ScheduleManager.tsx
│   │   └── LeagueWizard/
│   │       ├── index.tsx
│   │       ├── Step1Teams.tsx
│   │       └── Step2Schedule.tsx
│   └── season/
│       ├── SeasonArchive.tsx
│       └── SeasonCelebration.tsx
├── pages/
│   ├── StandingsPage.tsx
│   ├── MatchesPage.tsx
│   ├── TeamsPage.tsx
│   ├── ScorersPage.tsx
│   ├── ArchivePage.tsx
│   ├── AdminPage.tsx
│   └── LoginPage.tsx
└── App.tsx                   # Только роутинг и провайдеры
```

### Фаза 3: Реализация Supabase API (3-4 дня)

- [ ] Заменить `localStorage.getItem("KFL_V1_TEAMS")` на `supabase.from('teams').select()`
- [ ] Заменить `setTeams()` на `supabase.from('teams').upsert()`
- [ ] Реализовать Real-time подписки через `supabase.channel()`
- [ ] Загрузка изображений через Supabase Storage
- [ ] Реализовать аутентификацию (email/password)
- [ ] Создать middleware проверки роли

### Фаза 4: UI-улучшения (2-3 дня)

- [ ] Заменить все `alert()` → `<Toast>` компонент
- [ ] Заменить все `confirm()` → `<ConfirmDialog>` компонент
- [ ] Заменить все `prompt()` → `<Modal>` с формой
- [ ] Исправить мобильные отступы и таблицы
- [ ] Добавить `<Skeleton>` для загрузки данных
- [ ] Оптимизировать отображение списков (виртуализация при необходимости)

### Фаза 5: Миграция начальных данных (1 день)

- [ ] Написать скрипт Node.js для импорта `initialTeams` и `initialMatches` в Supabase
- [ ] Перенести localStorage данных первых пользователей (если есть)

---

## 10. ПРИОРИТЕТЫ И ДОРОЖНАЯ КАРТА

### 🔴 Спринт 1 (Критично — блокирует релиз)

| # | Задача | Статус | Трудоёмкость |
|---|--------|--------|-------------|
| 1 | Создать Supabase-проект, схему БД, RLS-политики | ✅ ГОТОВО | 1 день |
| 2 | Подключить `supabase-js`, настроить клиент | ✅ ГОТОВО | 0.5 дня |
| 3 | Реализовать вход для администратора (email/password) | ❌ НЕ НАЧАТО | 1 день |
| 4 | Перевести чтение данных с localStorage на Supabase | ⏳ ЧАСТИЧНО | 2 дня |
| 5 | Перевести запись данных (матчи, результаты) на Supabase | ❌ НЕ НАЧАТО | 2 дня |
| 6 | Скрипт миграции начальных данных | ❌ НЕ НАЧАТО | 0.5 дня |

**Итого завершено:** ~2 дня из 7 (30%)

### 🟠 Спринт 2 (Важно — качество продукта)

| # | Задача | Статус | Трудоёмкость |
|---|--------|--------|-------------|
| 7 | Разбить App.tsx на компоненты (этапами) | ❌ НЕ НАЧАТО | 3 дня |
| 8 | Заменить alert/confirm/prompt на UI-компоненты | ✅ ГОТОВО | 1 день |
| 9 | Supabase Storage для логотипов и фото | ✅ ГОТОВО | 1 день |
| 10 | Исправление мобильной вёрстки | ✅ ГОТОВО | 1 день |
| 11 | Генерация ID через UUID | ✅ ГОТОВО | 0.5 дня |

**Завершено:** 3.5 дня из 6.5 (54%)

### 🟡 Спринт 3 (Улучшения)

| # | Задача | Трудоёмкость |
|---|--------|-------------|
| 12 | Real-time обновления через Supabase channels | 1 день |
| 13 | Экспорт таблицы в PDF | 1 день |
| 14 | Поиск игроков и команд | 0.5 дня |
| 15 | Строгие TypeScript-типы, убрать `any` | 0.5 дня |
| 16 | Страница логина с нормальным UI | 0.5 дня |
| 17 | Proper даты (timestamptz) вместо строк | 0.5 дня |

**Итого:** ~4 рабочих дня

---

## ИТОГОВАЯ ОЦЕНКА

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Функциональность | 7/10 | Хороший набор функций для MVP |
| Дизайн и UI | 8/10 | Красивый современный дизайн |
| Мобильная версия | 6/10 | Работает, но есть проблемы |
| Качество кода | 3/10 | Монолит, дублирование, `any` |
| Архитектура данных | 2/10 | localStorage не годится для релиза |
| Безопасность | 2/10 | Нет авторизации, нет backend |
| **Готовность к релизу** | **2/10** | **Нельзя выпускать без Supabase** |

### Ключевой вывод

Приложение имеет **хорошую фронтенд-основу**: красивый дизайн, продуманный UX, богатая функциональность. Однако без серверной базы данных это не более чем **персональный инструмент для одного браузера**.

Переход на Supabase — единственный путь к полноценному релизу. При этом структурный рефакторинг (разбивка на компоненты) важен для дальнейшей поддержки, но не блокирует запуск.

**Рекомендуемая стратегия:** Сначала Supabase (интеграция без рефакторинга архитектуры), затем разбивка на компоненты параллельно с добавлением новых функций.

---

*Документ будет обновляться по мере выполнения задач. Следующая версия: после завершения Спринта 1.*
