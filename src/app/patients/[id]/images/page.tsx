'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import ImageUploader from '@/components/images/ImageUploader'
import ImageGallery from '@/components/images/ImageGallery'
import { getPatient } from '@/lib/patients'
import { getPatientImages } from '@/lib/images'
import { useParams, useRouter } from 'next/navigation'
import type { Patient, Image } from '@/types/database'

export default function PatientImagesPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const id = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const patientData = await getPatient(id)
        if (!patientData) {
          setError('Patient not found')
          return
        }
        
        const imagesData = await getPatientImages(id)
        
        setPatient(patientData)
        setImages(imagesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const handleUploadComplete = async () => {
    try {
      const imagesData = await getPatientImages(id)
      setImages(imagesData)
    } catch (err) {
      console.error('Failed to refresh images:', err)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (error || !patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error || 'Patient not found'}</p>
        <Link href="/patients" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to Patients
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/patients/${id}`} className="text-blue-500 hover:underline">
          ← Back to Patient
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{patient.name} - X-ray Images</h1>
        <p className="text-gray-600">Upload and manage X-ray images for this patient</p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Upload New X-ray</h2>
        <ImageUploader patientId={id} onUploadComplete={handleUploadComplete} />
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Patient X-rays</h2>
        <ImageGallery images={images} />
      </div>
    </div>
  )
} 