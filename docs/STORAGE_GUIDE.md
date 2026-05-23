# Руководство по Supabase Storage

## Обзор

Приложение использует **Supabase Storage** для хранения изображений:
- **team-logos** — логотипы команд
- **player-photos** — фото игроков

Хранение изображений в Storage вместо base64 даёт:
✅ Лучшую производительность (URL вместо 100KB+ строк)
✅ Экономию памяти и localStorage
✅ Возможность использования CDN Supabase
✅ Масштабируемость (неограниченный размер)

---

## Автоматическая инициализация

При запуске приложения (`main.tsx`) функция `initializeStorage()` автоматически:
1. Проверяет наличие buckets
2. Создаёт недостающие buckets если их нет
3. Логирует статус инициализации

```typescript
// src/main.tsx
import { initializeStorage } from './lib/initializeStorage'

// Инициализируем Storage buckets при запуске
initializeStorage()
```

---

## Работа с изображениями

### 1. Загрузка логотипа команды

В компоненте **TeamEditModal** администратор может загрузить логотип для команды:

```tsx
// Пользователь выбирает файл через input
<input
  type="file"
  accept="image/*"
  onChange={handleLogoUpload}
/>

// Функция загружает и сжимает изображение
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.currentTarget.files?.[0]
  if (!file) return

  const result = await uploadAndCompressImage(
    'team-logos',      // bucket name
    file,              // файл
    'teams',           // папка в bucket
    `team-${team.id}.jpg` // имя файла
  )

  if (result) {
    // Сохраняем URL в БД
    setTeamLogoUrl(result.url)
  }
}
```

### 2. Загрузка фото игрока

То же самое для фото игроков:

```tsx
const result = await uploadAndCompressImage(
  'player-photos',
  file,
  'players',
  `player-${player.id}.jpg`
)

if (result) {
  setEditingPlayerPhotoUrl(result.url)
}
```

### 3. Отображение изображений

Изображения отображаются по URL из БД:

```tsx
// В TeamsPage.tsx
{team.logo_url ? (
  <img src={team.logo_url} alt={team.name} />
) : (
  <div style={{ backgroundColor: team.color }} />
)}

// В TeamsPage.tsx (фото игрока)
{p.photo_url ? (
  <img src={p.photo_url} alt={p.name} />
) : (
  <UserIcon />
)}
```

---

## Утилиты (src/lib/imageUtils.ts)

### compressImage(file: File): Promise<Blob>
Сжимает изображение через canvas:
- Максимальный размер: 400×400px
- Качество: 80%
- Формат: JPEG

### uploadImageToStorage(bucket, file, folder, fileName)
Загружает файл в Storage и возвращает публичный URL:
```typescript
const result = await uploadImageToStorage(
  'team-logos',
  file,
  'teams',
  'my-logo.jpg'
)
// result = { url: 'https://...', path: 'teams/my-logo.jpg' }
```

### uploadAndCompressImage(bucket, file, folder, fileName)
Сжимает И загружает за один раз:
```typescript
const result = await uploadAndCompressImage(
  'player-photos',
  file,
  'players',
  'john-doe.jpg'
)
```

### deleteImageFromStorage(bucket, path)
Удаляет файл из Storage:
```typescript
await deleteImageFromStorage('team-logos', 'teams/team-123.jpg')
```

---

## RLS Политики Storage

Все файлы в buckets доступны для **публичного чтения** благодаря RLS политикам (см. `supabase/migrations/fix_storage_rls_policies.sql`):

```sql
-- Разрешаем публичное чтение всех файлов
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (true);

-- Разрешаем публичную загрузку
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT WITH CHECK (true);

-- Разрешаем обновление и удаление
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (true);
```

---

## Структура файлов в Storage

```
Supabase Storage
├── team-logos/          # Логотипы команд
│   ├── teams/
│   │   ├── team-uuid-1.jpg
│   │   ├── team-uuid-2.jpg
│   │   └── ...
│
└── player-photos/       # Фото игроков
    └── players/
        ├── player-uuid-1.jpg
        ├── player-uuid-2.jpg
        └── ...
```

---

## Примеры использования

### Добавление нового логотипа при редактировании команды

```tsx
// В TeamEditModal
const handleLogoUpload = async (file: File) => {
  const timestamp = Date.now()
  const fileName = `team-${team.id}-${timestamp}.jpg`
  
  const result = await uploadAndCompressImage(
    'team-logos',
    file,
    'teams',
    fileName
  )
  
  if (result) {
    // Обновляем локальное состояние
    setTeamLogoUrl(result.url)
    
    // При сохранении сохраняем в БД
    await supabase
      .from('teams')
      .update({ logo_url: result.url })
      .eq('id', team.id)
  }
}
```

### Удаление старого изображения

```tsx
// При замене изображения на новое
if (oldLogoPath) {
  await deleteImageFromStorage('team-logos', oldLogoPath)
}
```

---

## Размеры изображений

После сжатия:
- **Логотипы команд**: ~20-50 KB (из 400×400px JPEG)
- **Фото игроков**: ~15-40 KB

**Пример:** 20 команд × 15 игроков = 300 изображений ≈ **6 MB** вместо **30 MB** в base64.

---

## Возможные проблемы и решения

### Проблема: "Cannot read properties of undefined (reading 'createBucket')"

**Причина:** Supabase клиент не инициализирован правильно

**Решение:** Проверьте `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)
```

### Проблема: Buckets не созданы

**Решение:** Проверьте браузерную консоль при запуске приложения. Если видите `✅ Bucket team-logos успешно создан`, то всё работает.

Если buckets не создаются автоматически, создайте их вручную через Supabase Dashboard:
1. Перейдите в Storage
2. Нажмите "Create bucket"
3. Создайте bucket с именем `team-logos` (public)
4. Создайте bucket с именем `player-photos` (public)

### Проблема: Изображение не загружается

**Причины:**
- RLS политики блокируют доступ
- Bucket не public
- Неправильный путь файла

**Решение:** Проверьте в браузере F12 → Network, какой URL запрашивается. Скопируйте URL в адресную строку — если 403 Forbidden, нужно включить публичный доступ к bucket.

---

## Миграция существующих данных

Если у вас есть base64 логотипы, их можно мигрировать:

```typescript
// Псевдокод для миграции
async function migrateBase64ToStorage() {
  const teams = await supabase.from('teams').select()
  
  for (const team of teams.data || []) {
    if (team.logo_url?.startsWith('data:')) {
      // Преобразуем base64 в Blob
      const blob = await fetch(team.logo_url).then(r => r.blob())
      const file = new File([blob], `team-${team.id}.jpg`)
      
      // Загружаем в Storage
      const result = await uploadAndCompressImage(
        'team-logos',
        file,
        'teams',
        `team-${team.id}.jpg`
      )
      
      // Обновляем в БД
      if (result) {
        await supabase
          .from('teams')
          .update({ logo_url: result.url })
          .eq('id', team.id)
      }
    }
  }
}
```

---

## Тестирование

1. Запустите приложение: `npm run dev`
2. Откройте в браузере консоль (F12)
3. Проверьте логи инициализации Storage
4. Как администратор, отредактируйте команду
5. Загрузите логотип через кнопку "Upload"
6. Сохраните команду
7. Проверьте, что логотип отображается в списке команд

---

## Ссылки

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Storage API Reference](https://supabase.com/docs/reference/javascript/storage-createbucket)
