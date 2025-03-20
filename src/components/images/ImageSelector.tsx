'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import ImageGallery from './ImageGallery'
import type { Image } from '@/types/database'

interface ImageSelectorProps {
  images: Image[]
  onImageSelect: (image: Image | null) => void
  selectedImageId?: string | null
}

export default function ImageSelector({ 
  images, 
  onImageSelect,
  selectedImageId
}: ImageSelectorProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(
    selectedImageId 
      ? images.find(img => img.id === selectedImageId) || null 
      : null
  )

  const handleImageSelect = (image: Image) => {
    setSelectedImage(image)
  }

  const handleConfirm = () => {
    onImageSelect(selectedImage)
  }

  const handleCancel = () => {
    setSelectedImage(null)
    onImageSelect(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Select an X-ray for Annotation</h2>
      
      <ImageGallery 
        images={images} 
        onImageSelect={handleImageSelect}
        selectable={true}
      />
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedImage}
        >
          Use Selected Image
        </Button>
      </div>
    </div>
  )
} 