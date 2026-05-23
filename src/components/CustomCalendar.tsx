/**
 * CustomCalendar — инлайн-календарь в стиле дизайн-системы сайта.
 * Без внешних зависимостей. Тёмный фон, зелёные акценты.
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  value: Date | null
  onChange: (date: Date) => void
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель',
  'Май', 'Июнь', 'Июль', 'Август',
  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function CustomCalendar({ value, onChange }: Props) {
  const today = new Date()

  const [viewYear,  setViewYear]  = useState(value?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(value?.getMonth()    ?? today.getMonth())

  // Сдвиг первого дня месяца: 0=Вс,1=Пн...6=Сб → преобразуем в понедельник-old (0=Пн)
  const firstDayRaw  = new Date(viewYear, viewMonth, 1).getDay()
  const startOffset  = (firstDayRaw + 6) % 7            // 0=Mon … 6=Sun
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const isSelected = (day: number) =>
    !!value &&
    value.getDate()     === day &&
    value.getMonth()    === viewMonth &&
    value.getFullYear() === viewYear

  const isToday = (day: number) =>
    today.getDate()     === day &&
    today.getMonth()    === viewMonth &&
    today.getFullYear() === viewYear

  const handleSelect = (day: number) => {
    // Сохраняем время текущего value (если есть), только меняем дату
    const next = value ? new Date(value) : new Date()
    next.setFullYear(viewYear, viewMonth, day)
    onChange(next)
  }

  // Строим сетку ячеек: null = пустая клетка до начала месяца
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div
      className="rounded-xl overflow-hidden select-none"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* ── Заголовок месяца ───────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-brand-text-muted)' }}
        >
          <ChevronLeft size={15} />
        </button>

        <span className="font-semibold text-sm" style={{ color: 'var(--color-brand-text)' }}>
          {MONTHS_RU[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-brand-text-muted)' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="p-2">
        {/* ── Дни недели ─────────────────────────────────── */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_RU.map(d => (
            <div
              key={d}
              className="text-center py-1 label-caps text-[9px]"
              style={{ color: 'var(--color-brand-outline)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Ячейки дней ────────────────────────────────── */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />

            const sel   = isSelected(day)
            const tod   = isToday(day)
            const isSat = (startOffset + day - 1) % 7 === 5  // Суббота
            const isSun = (startOffset + day - 1) % 7 === 6  // Воскресенье

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelect(day)}
                className="aspect-square flex items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-100 active:scale-90"
                style={
                  sel ? {
                    background:  'var(--color-brand-accent)',
                    color:       '#fff',
                    fontWeight:  700,
                  } : tod ? {
                    color:   'var(--color-brand-primary)',
                    outline: '1.5px solid var(--color-brand-accent)',
                    fontWeight: 700,
                  } : (isSat || isSun) ? {
                    color: 'var(--color-brand-text-muted)',
                    opacity: 0.6,
                  } : {
                    color: 'var(--color-brand-text-muted)',
                  }
                }
                onMouseEnter={e => {
                  if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
                }}
                onMouseLeave={e => {
                  if (!sel) e.currentTarget.style.background = 'transparent'
                }}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
