'use client'

import React from 'react'
import PatientCard from './PatientCard'
import { deletePatient } from '@/lib/patients'
import { useRouter } from 'next/navigation'
import type { Patient } from '@/types/database'

interface PatientListProps {
  patients: Patient[]
}

export default function PatientList({ patients }: PatientListProps) {
  const router = useRouter()
  
  const handleDelete = async (id: string) => {
    await deletePatient(id)
    router.refresh()
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No patients yet. Add your first patient to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((patient) => (
        <PatientCard 
          key={patient.id} 
          patient={patient} 
          onDelete={handleDelete} 
        />
      ))}
    </div>
  )
} 