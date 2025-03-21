'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getPatient } from '@/lib/patients'
import { getImage } from '@/lib/images'
import CanvasComponent from '@/components/canvas/Canvas'
import type { Patient, Image } from '@/types/database'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

// Match the step enum in the landing page
enum Step {
  SELECT_PATIENT,
  UPLOAD_XRAYS,
  EDGE_DETECTION,
  ANNOTATION
}

export default function AnnotatePage() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient')
  const topViewId = searchParams.get('topView')
  const sideViewId = searchParams.get('sideView')
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [topViewImage, setTopViewImage] = useState<Image | null>(null)
  const [sideViewImage, setSideViewImage] = useState<Image | null>(null)
  const [activeView, setActiveView] = useState<'top' | 'side'>('top')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!patientId || !topViewId || !sideViewId) {
        setError('Missing required parameters')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Load patient and images in parallel
        const [patientData, topImage, sideImage] = await Promise.all([
          getPatient(patientId),
          getImage(topViewId),
          getImage(sideViewId)
        ])
        
        if (!patientData) {
          setError('Patient not found')
          return
        }
        
        if (!topImage || !sideImage) {
          setError('One or more images not found')
          return
        }
        
        setPatient(patientData)
        setTopViewImage(topImage)
        setSideViewImage(sideImage)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [patientId, topViewId, sideViewId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading annotation workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !patient || !topViewImage || !sideViewImage) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error || 'Could not load annotation workspace'}</p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => router.back()} 
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Edge Detection
        </button>
      </div>
      
      {/* Patient information card */}
      <Card className="p-4 mb-4 bg-blue-50 border border-blue-100">
        <div className="flex items-center">
          <div>
            <h3 className="font-semibold text-blue-800">Patient</h3>
            <p className="text-blue-600">{patient.name}, {patient.medicalRecordNumber || 'No MRN'}</p>
          </div>
        </div>
      </Card>
      
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Step 1: Select Patient */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              1
            </div>
            <span className="font-medium">Select Patient</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 2: Upload X-rays */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              2
            </div>
            <span className="font-medium">Upload X-rays</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 3: Edge Detection */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-2`}>
              3
            </div>
            <span className="font-medium">Edge Detection</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 bg-blue-600`}></div>
          
          {/* Step 4: Annotation (current step) */}
          <div className={`flex items-center text-blue-600`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white mr-2`}>
              4
            </div>
            <span className="font-medium">Annotation</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Annotating X-rays for {patient.name}
          </h1>
          <p className="text-gray-600">
            Use the tools below to annotate the X-ray images
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeView === 'top'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
              onClick={() => setActiveView('top')}
            >
              Top View
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeView === 'side'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
              onClick={() => setActiveView('side')}
            >
              Side View
            </button>
          </div>
        </div>
      </div>
      
      {/* Canvas component for annotation */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {activeView === 'top' ? (
          <CanvasComponent
            imageUrl={topViewImage.url}
            patientId={patient.id}
            imageId={topViewImage.id}
          />
        ) : (
          <CanvasComponent
            imageUrl={sideViewImage.url}
            patientId={patient.id}
            imageId={sideViewImage.id}
          />
        )}
      </div>
    </div>
  )
} 