/**
 * Генерирует UUID v4 используя Web Crypto API
 * Не требует дополнительных зависимостей
 *
 * @returns UUID v4 строка в формате: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Используем Web Crypto API для генерации случайных байт
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  // Set version 4 (random) и variant bits
  array[6] = (array[6] & 0x0f) | 0x40  // Version 4
  array[8] = (array[8] & 0x3f) | 0x80  // Variant 10

  // Преобразуем в hex и форматируем как UUID
  return Array.from(array)
    .map((b, i) => {
      if (i === 4 || i === 6 || i === 8 || i === 10) return '-' + b.toString(16).padStart(2, '0')
      return b.toString(16).padStart(2, '0')
    })
    .join('')
}

/**
 * Генерирует короткий ID (для использования там, где UUID слишком длинный)
 * Пример: "abc123def456"
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Генерирует ID на основе timestamp + random (для обратной совместимости)
 * DEPRECATED: Используйте generateUUID() вместо этого
 */
export function generateLegacyId(): string {
  // Гарантирует уникальность даже при быстром создании объектов
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
