'use client'

import React from 'react'
import Link from 'next/link'
import PatientForm from '@/components/patients/PatientForm'
import { createPatient } from '@/lib/patients'

export default function NewPatientPage() {
  const handleSubmit = async (name: string) => {
    await createPatient(name)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/patients" className="text-blue-500 hover:underline">
          ← Back to Patients
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Patient</h1>
        <PatientForm onSubmit={handleSubmit} />
      </div>
    </div>
  )
} 