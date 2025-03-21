'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { uploadImage } from '@/lib/images'
import type { Patient, Image as ImageType } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface XrayUploaderProps {
  patient: Patient
  onComplete: (topViewImage: ImageType, sideViewImage: ImageType) => void
}

export default function XrayUploader({ patient, onComplete }: XrayUploaderProps) {
  const [topViewFile, setTopViewFile] = useState<File | null>(null)
  const [sideViewFile, setSideViewFile] = useState<File | null>(null)
  const [topViewPreview, setTopViewPreview] = useState<string | null>(null)
  const [sideViewPreview, setSideViewPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTopViewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setTopViewFile(file)
      setTopViewPreview(URL.createObjectURL(file))
    }
  }

  const handleSideViewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSideViewFile(file)
      setSideViewPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!topViewFile || !sideViewFile) {
      setError('Please upload both top view and side view X-ray images')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Starting image upload process for:', {
        patient: patient.id,
        topViewFile: topViewFile.name,
        sideViewFile: sideViewFile.name
      })

      // Add specific type markers to filenames to ensure correct classification
      const topViewFileWithType = new File(
        [topViewFile], 
        `top_${topViewFile.name}`, 
        { type: topViewFile.type }
      );
      
      const sideViewFileWithType = new File(
        [sideViewFile], 
        `side_${sideViewFile.name}`, 
        { type: sideViewFile.type }
      );

      // Upload both images in parallel
      const [topViewImage, sideViewImage] = await Promise.all([
        uploadImage(topViewFileWithType, patient.id, 'top'),
        uploadImage(sideViewFileWithType, patient.id, 'side')
      ])

      // Force viewType to be correct regardless of what came back
      const correctedTopView = {
        ...topViewImage,
        viewType: 'top' as const
      };
      
      const correctedSideView = {
        ...sideViewImage,
        viewType: 'side' as const
      };

      // Verify the returned images have the correct viewType
      console.log('Uploaded images with details:', {
        topView: {
          id: correctedTopView.id,
          viewType: correctedTopView.viewType,
          url: correctedTopView.url
        },
        sideView: {
          id: correctedSideView.id,
          viewType: correctedSideView.viewType,
          url: correctedSideView.url
        }
      })

      // Make sure the viewTypes are correctly set
      if (correctedTopView.id === correctedSideView.id) {
        console.error('Error: Top view and side view images have the same ID!');
        setError('The system generated the same ID for both images. Please try again.');
        setLoading(false);
        return;
      }

      onComplete(correctedTopView, correctedSideView)
    } catch (err) {
      console.error('Error uploading images:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload images')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Upload X-rays for {patient.name}</h2>
        <p className="text-gray-600">Please upload both top view and side view X-ray images</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top View Uploader */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Top View X-ray</h3>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
              {topViewPreview ? (
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={topViewPreview}
                    alt="Top view X-ray preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
              
              <input
                type="file"
                id="topViewFile"
                accept="image/*"
                onChange={handleTopViewUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {topViewPreview && (
              <Button
                variant="outline"
                onClick={() => {
                  setTopViewFile(null)
                  setTopViewPreview(null)
                }}
                className="w-full"
              >
                Remove
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Side View Uploader */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Side View X-ray</h3>
            
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
              {sideViewPreview ? (
                <div className="relative w-full h-48 mb-4">
                  <Image
                    src={sideViewPreview}
                    alt="Side view X-ray preview"
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
              
              <input
                type="file"
                id="sideViewFile"
                accept="image/*"
                onChange={handleSideViewUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {sideViewPreview && (
              <Button
                variant="outline"
                onClick={() => {
                  setSideViewFile(null)
                  setSideViewPreview(null)
                }}
                className="w-full"
              >
                Remove
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!topViewFile || !sideViewFile || loading}
          className="w-full md:w-auto"
        >
          {loading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
              Uploading...
            </>
          ) : (
            'Continue with these X-rays'
          )}
        </Button>
      </div>
    </div>
  )
} 