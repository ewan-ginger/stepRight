'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { deleteImage } from '@/lib/images'
import type { Image as ImageType } from '@/types/database'

interface ImagePreviewProps {
  image: ImageType
  onDelete?: () => void
  onSelect?: () => void
  selected?: boolean
}

export default function ImagePreview({ 
  image, 
  onDelete, 
  onSelect,
  selected = false 
}: ImagePreviewProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        setIsDeleting(true)
        await deleteImage(image.id, image.url)
        onDelete && onDelete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete image')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleClick = () => {
    onSelect && onSelect()
  }

  return (
    <div 
      className={`
        relative rounded-lg overflow-hidden shadow-md 
        hover:shadow-lg transition-shadow cursor-pointer
        ${selected ? 'ring-2 ring-blue-500' : ''}
      `}
      onClick={handleClick}
    >
      <div className="aspect-square relative bg-gray-100">
        {!imageError ? (
          <Image
            src={image.url}
            alt="X-ray"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            Image failed to load
          </div>
        )}
      </div>
      
      <div className="p-3 bg-white">
        <p className="text-sm text-gray-500 truncate">
          Added: {new Date(image.created_at).toLocaleDateString()}
        </p>
        
        {onDelete && (
          <div className="mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
        
        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  )
} 