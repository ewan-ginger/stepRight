'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import PatientSelector from '@/components/PatientSelector'
import XrayUploader from '@/components/XrayUploader'
import type { Patient, Image } from '@/types/database'

enum Step {
  SELECT_PATIENT,
  UPLOAD_XRAYS
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

  // Handle image upload completion
  const handleUploadComplete = (topViewImage: Image, sideViewImage: Image) => {
    // Navigate to the annotation page with query parameters
    router.push(`/annotate?patient=${selectedPatient?.id}&topView=${topViewImage.id}&sideView=${sideViewImage.id}`)
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
          <div className={`flex items-center ${currentStep >= Step.SELECT_PATIENT ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= Step.SELECT_PATIENT ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} mr-2`}>
              1
            </div>
            <span className="font-medium">Select Patient</span>
          </div>
          
          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= Step.UPLOAD_XRAYS ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          
          <div className={`flex items-center ${currentStep >= Step.UPLOAD_XRAYS ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= Step.UPLOAD_XRAYS ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} mr-2`}>
              2
            </div>
            <span className="font-medium">Upload X-rays</span>
          </div>
        </div>
      </div>

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