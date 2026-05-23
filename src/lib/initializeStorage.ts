/**
 * Инициализирует Storage buckets при запуске приложения
 * Вызывается один раз из main.tsx
 * Автоматически создаёт необходимые buckets если их нет
 */

import { supabase } from './supabase'

export async function initializeStorage() {
  try {
    // Пытаемся получить информацию о buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('Ошибка при проверке buckets:', error)
      return
    }

    const bucketNames = buckets?.map((b) => b.name) || []
    const hasTeamLogos = bucketNames.includes('team-logos')
    const hasPlayerPhotos = bucketNames.includes('player-photos')

    console.log('Storage buckets check:', {
      teamLogos: hasTeamLogos,
      playerPhotos: hasPlayerPhotos,
    })

    // Создаём недостающие buckets
    if (!hasTeamLogos) {
      const { error: createErr } = await supabase.storage.createBucket('team-logos', {
        public: true,
      })
      if (createErr) {
        console.warn('Не удалось создать bucket team-logos:', createErr.message)
      } else {
        console.log('✅ Bucket team-logos успешно создан')
      }
    }

    if (!hasPlayerPhotos) {
      const { error: createErr } = await supabase.storage.createBucket('player-photos', {
        public: true,
      })
      if (createErr) {
        console.warn('Не удалось создать bucket player-photos:', createErr.message)
      } else {
        console.log('✅ Bucket player-photos успешно создан')
      }
    }
  } catch (error) {
    console.error('Ошибка инициализации storage:', error)
  }
}
