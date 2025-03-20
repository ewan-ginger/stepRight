'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PatientSelector from '@/components/PatientSelector'
import XrayUploader from '@/components/XrayUploader'
import type { Patient, Image } from '@/types/database'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

enum Step {
  SELECT_PATIENT,
  UPLOAD_XRAYS,
  EDGE_DETECTION,
  ANNOTATION
}

export default function Home() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>(Step.SELECT_PATIENT)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [uploadedImages, setUploadedImages] = useState<{
    topView: Image | null;
    sideView: Image | null;
  }>({ topView: null, sideView: null })

  // Handle patient selection
  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentStep(Step.UPLOAD_XRAYS)
  }

  // Return to select patient step
  const handleBackToPatientSelect = () => {
    setCurrentStep(Step.SELECT_PATIENT)
  }

  // Handle image upload completion
  const handleUploadComplete = (topViewImage: Image, sideViewImage: Image) => {
    setUploadedImages({
      topView: topViewImage,
      sideView: sideViewImage
    })
    
    // Navigate to the edge detection page with query parameters
    router.push(`/edge-detection?patient=${selectedPatient?.id}&topView=${topViewImage.id}&sideView=${sideViewImage.id}`)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">StepRight X-ray Annotation</h1>
        <p className="text-gray-600">
          Annotate foot X-rays to help diagnose and track foot conditions
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Step 1: Select Patient */}
          <div className={`flex items-center ${currentStep >= Step.SELECT_PATIENT ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === Step.SELECT_PATIENT 
                ? 'bg-blue-600 text-white' 
                : currentStep > Step.SELECT_PATIENT 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
            } mr-2`}>
              {currentStep > Step.SELECT_PATIENT ? '✓' : '1'}
            </div>
            <span className="font-medium">Select Patient</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= Step.UPLOAD_XRAYS ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 2: Upload X-rays */}
          <div className={`flex items-center ${currentStep >= Step.UPLOAD_XRAYS ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === Step.UPLOAD_XRAYS 
                ? 'bg-blue-600 text-white' 
                : currentStep > Step.UPLOAD_XRAYS 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
            } mr-2`}>
              {currentStep > Step.UPLOAD_XRAYS ? '✓' : '2'}
            </div>
            <span className="font-medium">Upload X-rays</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= Step.EDGE_DETECTION ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 3: Edge Detection */}
          <div className={`flex items-center ${currentStep >= Step.EDGE_DETECTION ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === Step.EDGE_DETECTION 
                ? 'bg-blue-600 text-white' 
                : currentStep > Step.EDGE_DETECTION 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
            } mr-2`}>
              {currentStep > Step.EDGE_DETECTION ? '✓' : '3'}
            </div>
            <span className="font-medium">Edge Detection</span>
          </div>
          
          {/* Connector */}
          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= Step.ANNOTATION ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          {/* Step 4: Annotation */}
          <div className={`flex items-center ${currentStep >= Step.ANNOTATION ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === Step.ANNOTATION 
                ? 'bg-blue-600 text-white' 
                : currentStep > Step.ANNOTATION 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
            } mr-2`}>
              {currentStep > Step.ANNOTATION ? '✓' : '4'}
            </div>
            <span className="font-medium">Annotation</span>
          </div>
        </div>
      </div>

      {/* Selected patient summary (if any) */}
      {selectedPatient && currentStep === Step.UPLOAD_XRAYS && (
        <Card className="p-4 mb-4 bg-blue-50 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">Selected Patient</h3>
              <p className="text-blue-600">{selectedPatient.name}, {selectedPatient.medicalRecordNumber || 'No MRN'}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToPatientSelect}
            >
              Change
            </Button>
          </div>
        </Card>
      )}

      {/* Step content */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {currentStep === Step.SELECT_PATIENT && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select a Patient</h2>
            <PatientSelector onPatientSelected={handlePatientSelected} />
          </div>
        )}
        
        {currentStep === Step.UPLOAD_XRAYS && selectedPatient && (
          <XrayUploader 
            patient={selectedPatient} 
            onComplete={handleUploadComplete} 
          />
        )}
      </div>
    </main>
  )
} 