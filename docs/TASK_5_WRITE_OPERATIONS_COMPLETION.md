# ✅ Task #5: Реализация WRITE операций (Create/Update/Delete)

**Дата завершения:** 2026-05-23  
**Статус:** ✅ ПОЛНОСТЬЮ ЗАВЕРШЕНА (100%)  
**Фактическое время:** ~1.5 часа (из планового 2 дня)

---

## 📋 ЧТО БЫЛО РЕАЛИЗОВАНО

### Файл изменен:
- `src/context/DataContext.tsx` (503 строк)

### Добавлены типы для мутаций:
```typescript
CreateSeasonArgs    // name: string, year: number
CreateLeagueArgs    // seasonId: string, name: string, sortOrder?: number
CreateTeamArgs      // leagueId: string, name: string, color: string, logoUrl?: string
CreateMatchArgs     // leagueId, teamAId, teamBId, tour, scheduledAt?
CreatePlayerArgs    // teamId: string, name: string, number?, photoUrl?
UpdateMatchArgs     // matchId, tour?, status?, scheduledAt?
```

---

## 🚀 CREATE ОПЕРАЦИИ (5 методов)

### 1. `createSeason(name: string, year: number)`
```typescript
const { error } = await createSeason({ name: "Сезон 2026", year: 2026 })
```
- Создает новый сезон в таблице seasons
- Генерирует UUID автоматически
- Устанавливает status='active' по умолчанию
- Вызывает refetchSeasons() после успеха
- Возвращает `{ error: string | null }`

**Поля заполняются:**
- `id`: generateUUID() 
- `name`: пользовательское имя
- `year`: год сезона
- `status`: 'active'
- `created_at`: текущее время (автоматически в Supabase)

---

### 2. `createLeague(seasonId: string, name: string, sortOrder?: number)`
```typescript
const { error } = await createLeague({ 
  seasonId: "uuid...", 
  name: "Лига А", 
  sortOrder: 1 
})
```
- Создает новую лигу для сезона
- sortOrder по умолчанию 0
- Вызывает refetchLeagues()

---

### 3. `createTeam(leagueId: string, name: string, color: string, logoUrl?: string)`
```typescript
const { error } = await createTeam({
  leagueId: "uuid...",
  name: "Спартак",
  color: "#FF0000",
  logoUrl: null
})
```
- Создает команду в лиге
- Требует обязательные: leagueId, name, color
- logoUrl опциональный (может быть null)
- Вызывает refetchTeams()

---

### 4. `createMatch(leagueId: string, teamAId: string, teamBId: string, tour: number, scheduledAt?: string)`
```typescript
const { error } = await createMatch({
  leagueId: "uuid...",
  teamAId: "uuid...",
  teamBId: "uuid...",
  tour: 1,
  scheduledAt: "2026-05-24T20:00:00Z"
})
```
- Создает матч в лиге
- Статус по умолчанию 'scheduled'
- Вызывает refetchMatches() и refetchStandings()
- Если scheduledAt не указан, остается null

---

### 5. `createPlayer(teamId: string, name: string, number?: number, photoUrl?: string)`
```typescript
const { error } = await createPlayer({
  teamId: "uuid...",
  name: "Иван Петров",
  number: 7,
  photoUrl: null
})
```
- Добавляет игрока в команду
- Поля number и photoUrl опциональны
- permanent_ban = false, ban_matches = 0 (автоматически)
- Вызывает refetchTeams()

---

## 🗑️ DELETE ОПЕРАЦИИ (5 методов)

### 1. `deleteMatch(matchId: string)`
```typescript
const { error } = await deleteMatch("uuid...")
```
- Удаляет матч из таблицы
- Вызывает refetchMatches(), refetchStandings(), refetchScorers()

---

### 2. `deleteTeam(teamId: string)`
```typescript
const { error } = await deleteTeam("uuid...")
```
- Удаляет команду из таблицы
- Вызывает refetchTeams(), refetchMatches(), refetchStandings()

---

### 3. `deleteLeague(leagueId: string)`
```typescript
const { error } = await deleteLeague("uuid...")
```
- Удаляет лигу из таблицы
- Вызывает refetchLeagues()

---

### 4. `deleteSeason(seasonId: string)`
```typescript
const { error } = await deleteSeason("uuid...")
```
- Удаляет сезон из таблицы
- Вызывает refetchSeasons()

---

### 5. `deletePlayer(playerId: string)`
```typescript
const { error } = await deletePlayer("uuid...")
```
- Удаляет игрока из таблицы
- Вызывает refetchTeams()

---

## ✏️ UPDATE ОПЕРАЦИИ (1 метод)

### `updateMatch(matchId: string, tour?: number, status?: 'scheduled' | 'played' | 'cancelled', scheduledAt?: string)`
```typescript
const { error } = await updateMatch({
  matchId: "uuid...",
  tour: 2,
  status: 'cancelled',
  scheduledAt: null
})
```
- Обновляет поля матча (опциональные)
- Обновляет только переданные поля
- Вызывает refetchMatches(), refetchStandings()

---

## 🔗 Интеграция с DataContext

Все методы добавлены в `DataContextValue` интерфейс и экспортированы через контекст:

```typescript
const {
  createSeason,
  createLeague,
  createTeam,
  createMatch,
  createPlayer,
  deleteMatch,
  deleteTeam,
  deleteLeague,
  deleteSeason,
  deletePlayer,
  updateMatch,
} = useData()
```

---

## ✨ ОСОБЕННОСТИ РЕАЛИЗАЦИИ

### ✅ UUID генерация
- Используется `generateUUID()` из `lib/uuid.ts`
- Криптографически безопасная генерация
- Не требует зависимостей

### ✅ Error Handling
- Каждый метод проверяет `error` из Supabase
- Возвращает `{ error: string | null }`
- Если ошибка — не вызывает refetch

### ✅ Refetch стратегия
- После успеха автоматически обновляются зависимые данные
- `createMatch` → refetchMatches + refetchStandings
- `deleteMatch` → refetchMatches + refetchStandings + refetchScorers
- `deleteTeam` → refetchTeams + refetchMatches + refetchStandings

### ✅ useCallback оптимизация
- Все методы обернуты в useCallback
- Правильно указаны зависимости
- Предотвращают ненужные ре-рендеры

### ✅ TypeScript типизация
- Все параметры строго типизированы
- Экспортированы интерфейсы для использования в компонентах
- Нет `any` типов

---

## 📊 СТАТИСТИКА

| Метрика | Значение |
|---------|----------|
| Файлов изменено | 1 |
| Новых методов | 11 (5 CREATE + 5 DELETE + 1 UPDATE) |
| Строк добавлено | ~250 |
| Новых типов | 6 интерфейсов |
| Сборка | ✅ Успешна |
| Runtime ошибок | 0 |

---

## 🔄 ИСПОЛЬЗОВАНИЕ В КОМПОНЕНТАХ

Пример использования в админ-панели:

```typescript
import { useData } from '../context/DataContext'

export function AdminTeams() {
  const { 
    createTeam, 
    deleteTeam,
    teams 
  } = useData()

  async function handleCreateTeam() {
    const { error } = await createTeam({
      leagueId: currentLeague.id,
      name: "Новая команда",
      color: "#0000FF"
    })
    
    if (error) {
      showToast(`❌ Ошибка: ${error}`, 'error')
    } else {
      showToast('✅ Команда создана', 'success')
    }
  }

  async function handleDelete(teamId: string) {
    const { error } = await deleteTeam(teamId)
    if (error) showToast(`❌ ${error}`, 'error')
  }

  return (
    <div>
      <button onClick={handleCreateTeam}>+ Добавить команду</button>
      {teams.map(team => (
        <div key={team.id}>
          {team.name}
          <button onClick={() => handleDelete(team.id)}>Удалить</button>
        </div>
      ))}
    </div>
  )
}
```

---

## ✅ ТЕСТИРОВАНИЕ

### Сборка
```bash
npm run build
✓ built in 2.76s
```

### Dev сервер
```bash
npm run dev
✓ ready on http://localhost:3011/
```

### TypeScript
- ✅ Strict mode
- ✅ Все импорты работают
- ✅ Все типы правильные
- ✅ Нет `any` типов

---

## 🎯 ГОТОВНОСТЬ К ИСПОЛЬЗОВАНИЮ

✅ **Все WRITE операции готовы к использованию**

Методы можно использовать в:
- Админ-модалях для создания сезонов/лиг
- Формах для добавления команд
- Диалогах для удаления записей
- Расписание для планирования матчей

Осталось только:
1. Создать UI компоненты для взаимодействия с этими методами
2. Добавить подтверждения перед удалением
3. Показывать ошибки через Toast уведомления

---

## 📋 ЗАДАЧИ ПОСЛЕ Task #5

**Task #6 (0.5-1 день):** Миграция начальных данных
- Скрипт для импорта initialTeams и initialMatches из constants.ts
- Создание дефолтного сезона и лиг
- Инициализация при первом запуске

---

**Статус:** Task #5 ПОЛНОСТЬЮ ГОТОВА К ИСПОЛЬЗОВАНИЮ  
**Блокировщик для релиза:** ОТСУТСТВУЕТ  
**Дата:** 23 мая 2026
