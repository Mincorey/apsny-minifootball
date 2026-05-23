import { useState, useRef } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { uploadAndCompressImage, deleteImageFromStorage } from '../lib/imageUtils'

interface Props {
  bucket: 'team-logos' | 'player-photos'
  folder: string
  fileName: string
  currentImageUrl?: string
  onImageUploaded: (url: string) => void
  onError?: (error: string) => void
  className?: string
  label?: string
}

export function ImageUploadButton({
  bucket,
  folder,
  fileName,
  currentImageUrl,
  onImageUploaded,
  onError,
  className = '',
  label = 'Загрузить фото'
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const result = await uploadAndCompressImage(bucket, file, folder, fileName)

      if (result) {
        // Если было старое изображение, можно его удалить (опционально)
        // await deleteImageFromStorage(bucket, oldPath)
        onImageUploaded(result.url)
      } else {
        onError?.('Ошибка при загрузке изображения')
      }
    } catch (error) {
      onError?.(`Ошибка: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    if (!currentImageUrl) return
    // Опционально: удалить файл из Storage
    // const path = /* извлечь path из URL */
    // await deleteImageFromStorage(bucket, path)
    onImageUploaded('')
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload size={16} />
              {label}
            </>
          )}
        </button>

        {currentImageUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-2 px-2 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {currentImageUrl && (
        <div className="mt-2">
          <img
            src={currentImageUrl}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-lg border border-white/20"
          />
        </div>
      )}
    </div>
  )
}
