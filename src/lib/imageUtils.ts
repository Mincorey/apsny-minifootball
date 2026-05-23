/**
 * Утилиты для работы с изображениями:
 * - Сжимание (compression)
 * - Загрузка в Supabase Storage
 * - Генерация публичных URL
 */

import { supabase } from './supabase'

// Максимальные размеры (в пикселях)
const MAX_IMAGE_WIDTH = 400
const MAX_IMAGE_HEIGHT = 400
// Качество сжатия (0-1)
const IMAGE_QUALITY = 0.8

/**
 * Сжимает изображение через canvas и возвращает blob
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Масштабируем если больше максимума
        if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
          const aspectRatio = width / height

          if (width > height) {
            width = MAX_IMAGE_WIDTH
            height = Math.round(width / aspectRatio)
          } else {
            height = MAX_IMAGE_HEIGHT
            width = Math.round(height * aspectRatio)
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Не удалось получить контекст canvas'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Не удалось сжать изображение'))
          },
          'image/jpeg',
          IMAGE_QUALITY
        )
      }

      img.onerror = () => {
        reject(new Error('Ошибка загрузки изображения'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Загружает файл в Supabase Storage и возвращает публичный URL
 */
export async function uploadImageToStorage(
  bucket: 'team-logos' | 'player-photos',
  file: File | Blob,
  folder: string,
  fileName: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Создаем путь: bucket/folder/fileName
    const filePath = `${folder}/${fileName}`

    // Пытаемся загрузить файл
    const result = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true, // Перезаписываем если уже есть
      })

    if (result.error) {
      console.error('Ошибка загрузки:', result.error)
      return null
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return {
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('Ошибка при загрузке изображения:', error)
    return null
  }
}

/**
 * Загружает и сжимает изображение, затем сохраняет в Storage
 */
export async function uploadAndCompressImage(
  bucket: 'team-logos' | 'player-photos',
  file: File,
  folder: string,
  fileName: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Сжимаем изображение
    const compressedBlob = await compressImage(file)

    // Создаем новый файл из сжатого blob
    const compressedFile = new File(
      [compressedBlob],
      fileName,
      { type: 'image/jpeg' }
    )

    // Загружаем в Storage
    return await uploadImageToStorage(bucket, compressedFile, folder, fileName)
  } catch (error) {
    console.error('Ошибка при загрузке и сжатии изображения:', error)
    return null
  }
}

/**
 * Удаляет файл из Storage
 */
export async function deleteImageFromStorage(
  bucket: 'team-logos' | 'player-photos',
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Ошибка удаления:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Ошибка при удалении изображения:', error)
    return false
  }
}
