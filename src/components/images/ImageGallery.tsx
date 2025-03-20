'use client'

import React, { useState } from 'react'
import ImagePreview from './ImagePreview'
import { useRouter } from 'next/navigation'
import type { Image } from '@/types/database'

interface ImageGalleryProps {
  images: Image[]
  onImageSelect?: (image: Image) => void
  selectable?: boolean
}

export default function ImageGallery({ 
  images, 
  onImageSelect,
  selectable = false
}: ImageGalleryProps) {
  const router = useRouter()
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const handleDelete = () => {
    router.refresh()
  }

  const handleSelect = (image: Image) => {
    setSelectedImageId(image.id)
    onImageSelect && onImageSelect(image)
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No images available. Upload an X-ray to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <ImagePreview 
          key={image.id} 
          image={image} 
          onDelete={handleDelete}
          onSelect={selectable ? () => handleSelect(image) : undefined}
          selected={selectable && selectedImageId === image.id}
        />
      ))}
    </div>
  )
} 