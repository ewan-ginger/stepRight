'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'
import { uploadImage } from '@/lib/images'
import type { Image as ImageType } from '@/types/database'

interface XrayUploaderProps {
  patientId: string
  onComplete: (topViewImage: ImageType, sideViewImage: ImageType) => void
}

type ViewType = 'top' | 'side'

export default function XrayUploader({ patientId, onComplete }: XrayUploaderProps) {
  const [uploading, setUploading] = useState<ViewType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [topViewImage, setTopViewImage] = useState<ImageType | null>(null)
  const [sideViewImage, setSideViewImage] = useState<ImageType | null>(null)

  const handleUpload = async (file: File, viewType: ViewType) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    try {
      setUploading(viewType)
      setError(null)
      
      const uploadedImage = await uploadImage(file, patientId)
      
      if (viewType === 'top') {
        setTopViewImage(uploadedImage)
      } else {
        setSideViewImage(uploadedImage)
      }
      
      // If both images are uploaded, call the complete handler
      if (
        (viewType === 'top' && sideViewImage) || 
        (viewType === 'side' && topViewImage)
      ) {
        onComplete(
          viewType === 'top' ? uploadedImage : topViewImage!, 
          viewType === 'side' ? uploadedImage : sideViewImage!
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(null)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, viewType: ViewType) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleUpload(files[0], viewType)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload X-ray Images</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top View Uploader */}
        <div>
          <h3 className="text-lg font-medium mb-2">Top View X-ray</h3>
          
          {topViewImage ? (
            <div className="relative aspect-square border rounded-lg overflow-hidden">
              <Image 
                src={topViewImage.url}
                alt="Top view X-ray"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                Top View
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="top-view-upload"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'top')}
                accept="image/*"
                disabled={!!uploading}
              />
              
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 mb-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              
              <p className="mb-2 text-sm font-medium text-gray-700">
                Upload Top View X-ray
              </p>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('top-view-upload')?.click()}
                disabled={!!uploading}
              >
                {uploading === 'top' ? 'Uploading...' : 'Select File'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Side View Uploader */}
        <div>
          <h3 className="text-lg font-medium mb-2">Side View X-ray</h3>
          
          {sideViewImage ? (
            <div className="relative aspect-square border rounded-lg overflow-hidden">
              <Image 
                src={sideViewImage.url}
                alt="Side view X-ray"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                Side View
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                id="side-view-upload"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'side')}
                accept="image/*"
                disabled={!!uploading}
              />
              
              <svg 
                className="mx-auto h-12 w-12 text-gray-400 mb-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              
              <p className="mb-2 text-sm font-medium text-gray-700">
                Upload Side View X-ray
              </p>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={() => document.getElementById('side-view-upload')?.click()}
                disabled={!!uploading}
              >
                {uploading === 'side' ? 'Uploading...' : 'Select File'}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
      
      {topViewImage && sideViewImage && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => onComplete(topViewImage, sideViewImage)}
            className="w-full sm:w-auto"
          >
            Continue to Annotation
          </Button>
        </div>
      )}
    </div>
  )
} 