'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import PatientForm from '@/components/patients/PatientForm'
import { getPatient, updatePatient } from '@/lib/patients'
import { useParams, useRouter } from 'next/navigation'
import type { Patient } from '@/types/database'

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const id = params.id as string

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true)
        const data = await getPatient(id)
        
        if (!data) {
          setError('Patient not found')
          return
        }
        
        setPatient(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPatient()
  }, [id])

  const handleSubmit = async (name: string) => {
    await updatePatient(id, name)
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
      
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Patient</h1>
        <PatientForm patient={patient} onSubmit={handleSubmit} />
      </div>
    </div>
  )
} 