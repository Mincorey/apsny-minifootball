# Dialog Components Usage Guide

## 1. Toast (Уведомления)

Для простых уведомлений, которые исчезают сами через 3 секунды.

```tsx
// В компоненте где нужны тосты
const { toasts, show, remove } = useToast()

// Использование
show('Команда добавлена!', 'success')
show('Произошла ошибка', 'error')
show('Внимание!', 'warning')
show('Информация', 'info')

// В JSX добавить контейнер
<ToastContainer toasts={toasts} onRemove={remove} />
```

## 2. ConfirmDialog (Подтверждение действия)

Для опасных или важных операций, которые требуют подтверждения.

```tsx
import { ConfirmDialog } from './ConfirmDialog'

const [showConfirm, setShowConfirm] = useState(false)

// Использование
{showConfirm && (
  <ConfirmDialog
    isOpen={showConfirm}
    title="Удалить команду?"
    message="Это действие нельзя отменить. Все игроки команды также будут удалены."
    confirmText="Удалить"
    cancelText="Отмена"
    isDangerous={true}
    onConfirm={() => {
      deleteTeam()
      setShowConfirm(false)
    }}
    onCancel={() => setShowConfirm(false)}
  />
)}

// Вместо:
// if (confirm("Удалить команду?")) { deleteTeam() }
```

## 3. TextInputDialog (Ввод текста)

Для простого ввода текста, например переименование.

```tsx
import { TextInputDialog } from './TextInputDialog'

const [showRenameDialog, setShowRenameDialog] = useState(false)

// Использование
{showRenameDialog && (
  <TextInputDialog
    isOpen={showRenameDialog}
    title="Переименовать команду"
    placeholder="Новое название"
    defaultValue={currentName}
    onSubmit={(newName) => {
      updateTeamName(newName)
      setShowRenameDialog(false)
    }}
    onCancel={() => setShowRenameDialog(false)}
  />
)}

// Вместо:
// const newName = prompt("Новое название:", currentName)
```

## Migration Path

Для замены старых alert/confirm/prompt на новые компоненты:

### alert() → show()
```tsx
// Было:
alert("Команда добавлена!")

// Стало:
show("Команда добавлена!", "success")
```

### confirm() → <ConfirmDialog>
```tsx
// Было:
if (confirm("Удалить?")) { deleteTeam() }

// Стало:
<ConfirmDialog
  isOpen={showConfirm}
  title="Удаление"
  message="Вы уверены?"
  onConfirm={() => deleteTeam()}
  onCancel={() => setShowConfirm(false)}
/>
```

### prompt() → <TextInputDialog>
```tsx
// Было:
const name = prompt("Введите название:", "")

// Стало:
<TextInputDialog
  isOpen={showDialog}
  title="Введите название"
  onSubmit={(name) => handleSave(name)}
  onCancel={() => setShowDialog(false)}
/>
```
