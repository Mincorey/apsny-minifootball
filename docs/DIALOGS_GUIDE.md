# Руководство по использованию Dialog компонентов

## Обзор

В приложении имеются три основных типа диалогов для замены браузерных `alert()`, `confirm()` и `prompt()`:

1. **Toast** — временные уведомления (исчезают автоматически через 3 сек)
2. **ConfirmDialog** — подтверждение действия с двумя кнопками
3. **TextInputDialog** — ввод текста от пользователя

Все диалоги управляются через **DialogsContext** и доступны через хук **useDialogs()**.

---

## Setup

Приложение уже настроено:
- `DialogsProvider` обёрнут вокруг приложения в `src/main.tsx`
- Все компоненты расположены в `src/components/`

---

## 1️⃣ Toast (Уведомления)

### Использование

```tsx
import { useDialogs } from '../components/DialogsContext'

export function MyComponent() {
  const { showToast } = useDialogs()

  const handleSuccess = () => {
    showToast('Команда добавлена!', 'success')
  }

  const handleError = () => {
    showToast('Произошла ошибка при сохранении', 'error')
  }

  return (
    <div>
      <button onClick={handleSuccess}>Добавить</button>
      <button onClick={handleError}>Ошибка</button>
    </div>
  )
}
```

### Типы уведомлений

```tsx
showToast('Успех!', 'success')       // зелёный
showToast('Ошибка!', 'error')         // красный
showToast('Внимание!', 'warning')     // оранжевый
showToast('Инфо', 'info')             // синий (по умолчанию)
```

### Длительность

```tsx
// По умолчанию 3000ms (3 сек)
showToast('Быстрое уведомление', 'success')

// Своя длительность
showToast('Долгое уведомление', 'warning', 5000)

// Не закрывается автоматически
showToast('Вечное уведомление', 'info', 0)
```

---

## 2️⃣ ConfirmDialog (Подтверждение)

### Базовый пример

```tsx
import { useDialogs } from '../components/DialogsContext'

export function TeamDeleteButton() {
  const { showConfirm } = useDialogs()

  const handleDelete = () => {
    showConfirm({
      title: 'Удалить команду?',
      message: 'Это действие нельзя отменить. Все игроки команды также будут удалены.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      isDangerous: true,
      onConfirm: () => {
        // Выполнить удаление
        deleteTeam()
      },
      onCancel: () => {
        // Опционально: выполнить что-то при отмене
      },
    })
  }

  return <button onClick={handleDelete}>Удалить</button>
}
```

### Параметры

```tsx
showConfirm({
  title: 'Заголовок диалога',
  message: 'Детальное описание действия',
  confirmText: 'Подтвердить',      // по умолчанию
  cancelText: 'Отмена',             // по умолчанию
  isDangerous: false,               // если true, кнопка будет красной
  onConfirm: () => { /* ... */ },   // обязательно
  onCancel: () => { /* ... */ },    // опционально
})
```

### Примеры использования

```tsx
// Безопасное действие
showConfirm({
  title: 'Начать новый сезон?',
  message: 'Текущие данные сезона будут заархивированы.',
  isDangerous: false,
  onConfirm: () => { startNewSeason() }
})

// Опасное действие (красная кнопка)
showConfirm({
  title: 'ВНИМАНИЕ: Полный сброс',
  message: 'Это действие удалит ВСЕ данные. Отменить нельзя.',
  isDangerous: true,
  confirmText: 'Я уверен, удалить всё',
  onConfirm: () => { resetAll() }
})
```

---

## 3️⃣ TextInputDialog (Ввод текста)

### Базовый пример

```tsx
import { useDialogs } from '../components/DialogsContext'

export function RenameTeamButton() {
  const { showInput } = useDialogs()

  const handleRename = () => {
    showInput({
      title: 'Переименовать команду',
      placeholder: 'Новое название',
      defaultValue: 'Текущее название',
      onSubmit: (newName) => {
        if (newName.trim()) {
          updateTeamName(newName)
        }
      },
      onCancel: () => {
        // Опционально: выполнить что-то при отмене
      },
    })
  }

  return <button onClick={handleRename}>Переименовать</button>
}
```

### Параметры

```tsx
showInput({
  title: 'Заголовок диалога',
  placeholder: 'Подсказка в поле ввода',
  defaultValue: 'Начальное значение',     // опционально
  onSubmit: (value) => { /* ... */ },     // обязательно
  onCancel: () => { /* ... */ },          // опционально
})
```

### Особенности

- Поле автоматически получает фокус
- Enter — отправить
- Escape — отмена
- Значение можно редактировать

---

## 📋 Полный пример компонента

```tsx
import { useDialogs } from '../components/DialogsContext'

export function AdminPanel() {
  const { showToast, showConfirm, showInput } = useDialogs()

  const addTeam = () => {
    showInput({
      title: 'Добавить новую команду',
      placeholder: 'Название команды',
      onSubmit: async (name) => {
        try {
          await supabase.from('teams').insert({ name })
          showToast(`Команда "${name}" добавлена!`, 'success')
        } catch (error) {
          showToast('Ошибка при добавлении команды', 'error')
        }
      },
    })
  }

  const startNewSeason = () => {
    showConfirm({
      title: 'Начать новый сезон?',
      message: 'Все результаты текущего сезона будут заархивированы.',
      isDangerous: false,
      onConfirm: () => {
        finishSeason()
        showToast('Сезон завершен и заархивирован', 'success')
      },
    })
  }

  const resetAll = () => {
    showConfirm({
      title: 'ВНИМАНИЕ: Полный сброс БД',
      message: 'Это действие удалит ВСЕ данные навсегда. Отменить нельзя.',
      isDangerous: true,
      confirmText: 'Удалить всё',
      onConfirm: () => {
        resetDatabase()
        showToast('База данных полностью очищена', 'warning')
      },
    })
  }

  return (
    <div className="space-y-4">
      <button onClick={addTeam} className="btn">
        + Добавить команду
      </button>
      <button onClick={startNewSeason} className="btn">
        🏁 Завершить сезон
      </button>
      <button onClick={resetAll} className="btn btn-danger">
        🚨 Сброс БД
      </button>
    </div>
  )
}
```

---

## ✅ Миграция с браузерных диалогов

### alert() → showToast()

```tsx
// ДО (старый способ)
alert('Команда добавлена!')

// ПОСЛЕ (новый способ)
const { showToast } = useDialogs()
showToast('Команда добавлена!', 'success')
```

### confirm() → showConfirm()

```tsx
// ДО (старый способ)
if (confirm('Удалить?')) {
  deleteTeam()
}

// ПОСЛЕ (новый способ)
const { showConfirm } = useDialogs()
showConfirm({
  title: 'Удалить команду?',
  message: 'Это действие нельзя отменить.',
  isDangerous: true,
  onConfirm: () => deleteTeam()
})
```

### prompt() → showInput()

```tsx
// ДО (старый способ)
const name = prompt('Введите название:', '')
if (name) {
  updateName(name)
}

// ПОСЛЕ (новый способ)
const { showInput } = useDialogs()
showInput({
  title: 'Введите название',
  defaultValue: '',
  onSubmit: (name) => updateName(name)
})
```

---

## 🎨 Стилизация

Все компоненты используют встроенную стилизацию Tailwind CSS:

- **Toast** — закруглённые углы, тень, автоматическое позиционирование внизу справа
- **ConfirmDialog** — полупрозрачный фон, центрирование, border
- **TextInputDialog** — светлое поле ввода на тёмном фоне, фокус подсвечивается зелёным

Для кастомизации отредактируйте className в файлах компонентов.

---

## ⚙️ Архитектура

```
main.tsx
  ├─ DialogsProvider (src/components/DialogsContext.tsx)
  │  ├─ useToast() hook
  │  ├─ ConfirmDialog component
  │  ├─ TextInputDialog component
  │  └─ ToastContainer component
  └─ App (AppV2.tsx)
     └─ Любой компонент может использовать useDialogs()
```

### Как это работает

1. **DialogsProvider** оборачивает приложение в `main.tsx`
2. Любой компонент может вызвать `useDialogs()` для доступа к диалогам
3. При вызове `showToast()`, `showConfirm()`, `showInput()` состояние обновляется в провайдере
4. Компоненты диалогов рендерятся в провайдере с правильным состоянием

---

## 🐛 Проблемы и решения

### Проблема: `useDialogs must be used within DialogsProvider`

**Решение:** Убедитесь, что компонент находится внутри `DialogsProvider` (обычно это автоматически через `main.tsx`).

### Проблема: Несколько диалогов одновременно

**Текущее поведение:** Одновременно может быть только одно `ConfirmDialog` или `TextInputDialog`. Toast может быть несколько.

**Решение при необходимости:** Модифицировать `DialogsContext.tsx` для управления стеком диалогов.

---

## 📚 Файлы компонентов

- `src/components/Toast.tsx` — компонент и хук для уведомлений
- `src/components/ToastContainer.tsx` — контейнер для вывода тостов
- `src/components/ConfirmDialog.tsx` — диалог подтверждения
- `src/components/TextInputDialog.tsx` — диалог ввода текста
- `src/components/DialogsContext.tsx` — провайдер и хук useDialogs()
- `src/components/DIALOG_EXAMPLES.md` — примеры использования
