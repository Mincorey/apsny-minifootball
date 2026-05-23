/**
 * CustomSelect — красивый кастомный дропдаун в стиле дизайн-системы.
 *
 * Заменяет нативный <select>. Работает корректно на ПК и мобильных.
 * Поддерживает цветные маркеры для команд.
 *
 * Props:
 *   value        — текущее значение (строка или число)
 *   onChange     — callback при выборе
 *   options      — список опций [{ value, label, color? }]
 *   placeholder  — текст заглушки (value='')
 *   accentColor  — цвет рамки (напр. цвет выбранной команды)
 *   className    — дополнительные tailwind-классы для обёртки
 *   disabled     — отключить
 */

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value:  string | number
  label:  string
  color?: string | null   // цветная точка слева
}

interface Props {
  value:        string | number
  onChange:     (value: string | number) => void
  options:      SelectOption[]
  placeholder?: string
  accentColor?: string | null
  className?:   string
  disabled?:    boolean
  align?:       'left' | 'right'   // куда выравнивать список
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = '— Выберите —',
  accentColor,
  className = '',
  disabled = false,
  align = 'left',
}: Props) {
  const [open, setOpen]     = useState(false)
  const [focused, setFocused] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find(o => o.value === value) ?? null

  // Закрыть при клике вне компонента
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [open])

  // Прокрутить к выделенному пункту при открытии
  useEffect(() => {
    if (!open || !listRef.current) return
    const idx = options.findIndex(o => o.value === value)
    setFocused(idx)
    const li = listRef.current.children[idx] as HTMLElement | undefined
    li?.scrollIntoView?.({ block: 'nearest' })
  }, [open])

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value)
    setOpen(false)
    setFocused(-1)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (open && focused >= 0) handleSelect(options[focused])
      else setOpen(o => !o)
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setFocused(f => Math.min(f + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setFocused(f => Math.max(f - 1, 0))
    }
  }

  // Стиль кнопки-триггера
  const triggerBorder = accentColor
    ? `1.5px solid ${accentColor}66`
    : open
      ? '1.5px solid rgba(122,219,138,0.35)'
      : '1.5px solid rgba(255,255,255,0.10)'

  return (
    <div
      ref={wrapRef}
      className={`relative select-none ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      style={{ outline: 'none' }}
    >
      {/* ── Триггер ────────────────────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className="w-full flex items-center gap-2 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none"
        style={{
          background:    'rgba(20,25,35,0.95)',
          border:        triggerBorder,
          color:         selected ? 'var(--color-brand-text)' : 'var(--color-brand-outline)',
          padding:       '0.6rem 0.7rem',
          cursor:        disabled ? 'default' : 'pointer',
          opacity:       disabled ? 0.5 : 1,
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          if (!disabled && !open) {
            e.currentTarget.style.background = 'rgba(30,36,50,0.98)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(20,25,35,0.95)'
        }}
      >
        {/* Цветная точка выбранной опции */}
        {selected?.color && (
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: selected.color }}
          />
        )}

        {/* Текст */}
        <span className="flex-1 text-left truncate">
          {selected?.label ?? placeholder}
        </span>

        {/* Шеврон */}
        <ChevronDown
          size={14}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--color-brand-outline)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* ── Выпадающий список ──────────────────────────────────────────── */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1.5 rounded-xl overflow-y-auto"
          style={{
            background:    'rgba(18,23,33,0.99)',
            border:        '1.5px solid rgba(255,255,255,0.10)',
            boxShadow:     '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(122,219,138,0.06)',
            maxHeight:     '220px',
            minWidth:      '100%',
            width:         'max-content',
            left:          align === 'right' ? 'auto' : 0,
            right:         align === 'right' ? 0 : 'auto',
            backdropFilter: 'blur(12px)',
            padding:       '0.3rem',
          }}
        >
          {options.map((opt, idx) => {
            const isSel  = opt.value === value
            const isFoc  = focused === idx

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSel}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setFocused(idx)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 text-sm"
                style={{
                  background: isSel
                    ? 'rgba(0,117,49,0.22)'
                    : isFoc
                      ? 'rgba(255,255,255,0.07)'
                      : 'transparent',
                  color: isSel
                    ? 'var(--color-brand-primary)'
                    : 'var(--color-brand-text)',
                  fontWeight: isSel ? 600 : 400,
                }}
              >
                {/* Цветная точка */}
                {opt.color != null ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: opt.color }}
                  />
                ) : (
                  /* Выравнивание когда у других опций есть точки (если хоть одна имеет color) */
                  options.some(o => o.color) && (
                    <span className="w-2.5 h-2.5 flex-shrink-0" />
                  )
                )}

                <span className="flex-1 truncate">{opt.label}</span>

                {/* Галочка у выбранного */}
                {isSel && (
                  <Check size={13} className="flex-shrink-0" style={{ color: 'var(--color-brand-primary)' }} />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
