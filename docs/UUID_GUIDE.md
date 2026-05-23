# Руководство по генерации UUID

## Обзор

Приложение использует **UUID v4** для генерации уникальных идентификаторов вместо ненадёжного `Date.now() + Math.random()`.

**Преимущества UUID v4:**
✅ Гарантированно уникален (вероятность коллизии ~ 1 на 5.3×10³⁶)
✅ Работает даже при создании объектов в одну миллисекунду
✅ Криптографически стойкий (использует Web Crypto API)
✅ Нет зависимостей (встроено в браузер)

---

## Использование

### 1. Генерация UUID

```typescript
import { generateUUID } from '../lib/uuid'

// Генерирует UUID в формате: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
const id = generateUUID()
// Пример: "550e8400-e29b-41d4-a716-446655440000"
```

### 2. Где используется UUID в приложении

#### Toast компонент (src/components/Toast.tsx)
```typescript
const show = (message: string, type: ToastType = 'info', duration = 3000) => {
  const id = generateUUID()  // ← Каждому тосту уникальный ID
  setToasts(prev => [...prev, { id, message, type, duration }])
}
```

#### Supabase (src/types/database.ts)
Таблицы в Supabase автоматически генерируют UUID для полей `id`:
```typescript
id: string  // UUID v4, генерируется автоматически
```

---

## Утилиты (src/lib/uuid.ts)

### generateUUID(): string
Генерирует случайный UUID v4.

```typescript
const uniqueId = generateUUID()
// "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p"
```

### generateShortId(): string
Для случаев, когда UUID слишком длинный (не рекомендуется для production).

```typescript
const shortId = generateShortId()
// "abc123def456"
```

### generateLegacyId(): string
Для обратной совместимости (DEPRECATED).

```typescript
const legacyId = generateLegacyId()
// "1234567890-abc123def"
```

---

## Примеры использования

### Добавление нового элемента в массив

**ДО (ненадёжно):**
```typescript
const newItem = {
  id: Date.now() + Math.random(),  // ❌ Может быть дублирующийся!
  name: 'Item',
}
```

**ПОСЛЕ (надёжно):**
```typescript
import { generateUUID } from '../lib/uuid'

const newItem = {
  id: generateUUID(),  // ✅ Гарантированно уникален
  name: 'Item',
}
```

### В компонентах React

```typescript
import { useState } from 'react'
import { generateUUID } from '../lib/uuid'

export function MyList() {
  const [items, setItems] = useState<Array<{ id: string; text: string }>>([])

  const addItem = (text: string) => {
    setItems(prev => [
      ...prev,
      {
        id: generateUUID(),  // Новый уникальный ID
        text,
      },
    ])
  }

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.text}</div>
      ))}
    </div>
  )
}
```

### При работе с Supabase

```typescript
import { supabase } from '../lib/supabase'
import { generateUUID } from '../lib/uuid'

// Обычно БД генерирует ID, но если нужно на клиенте:
const newPlayer = {
  id: generateUUID(),
  team_id: teamId,
  name: 'Иванов Иван',
  number: 7,
}

const { error } = await supabase
  .from('players')
  .insert(newPlayer)
```

---

## Web Crypto API

UUID v4 генерируется с помощью встроенного `crypto.getRandomValues()`:

```typescript
// Получаем 16 случайных байт
const array = new Uint8Array(16)
crypto.getRandomValues(array)

// Устанавливаем version 4 и variant bits
array[6] = (array[6] & 0x0f) | 0x40  // version 4
array[8] = (array[8] & 0x3f) | 0x80  // variant 10

// Форматируем как UUID
const uuid = '...'
```

---

## Производительность

UUID v4 очень быстро генерируется:
- **Время генерации:** ~0.1 мс на генерацию
- **Память:** минимальна (просто строка)
- **Зависимости:** ноль (встроено в браузер)

Безопасно генерировать UUID в основном потоке React.

---

## Совместимость

Web Crypto API поддерживается во всех современных браузерах:
- ✅ Chrome 37+
- ✅ Firefox 34+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 24+

Для старых браузеров IE можно добавить полифилл, но обычно это не требуется.

---

## Когда НЕ использовать UUID

UUID не нужен для:
- ⏱️ Отслеживание времени между событиями (используйте `Date.now()`)
- 📊 Случайные числа для UI анимаций (используйте `Math.random()`)
- 🎲 Случайные цвета/размеры (используйте `Math.random()`)
- 📄 Имена файлов (можно использовать timestamp для читаемости)

Используйте UUID только для **уникальных идентификаторов данных**.

---

## Миграция существующего кода

Если в коде есть старые ID, их можно мигрировать:

```typescript
// БЫЛО (ненадёжно)
const oldId = Date.now() + Math.random()

// СТАЛО (надёжно)
import { generateUUID } from '../lib/uuid'
const newId = generateUUID()
```

---

## Тестирование уникальности

```typescript
import { generateUUID } from '../lib/uuid'

// Проверяем что UUID уникальны
const ids = new Set()
for (let i = 0; i < 10000; i++) {
  const id = generateUUID()
  if (ids.has(id)) {
    console.error('Дублирующийся UUID найден!')
  }
  ids.add(id)
}

console.log(`Сгенерировано ${ids.size} уникальных UUID`)
// Вывод: Сгенерировано 10000 уникальных UUID
```

---

## Ссылки

- [RFC 4122 - UUID Specification](https://tools.ietf.org/html/rfc4122)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [crypto.getRandomValues()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues)
