import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getPatient } from '@/lib/patients'
import { notFound } from 'next/navigation'

interface PatientPageProps {
  params: {
    id: string
  }
}

export default async function PatientPage({ params }: PatientPageProps) {
  const patient = await getPatient(params.id)
  
  if (!patient) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/patients" className="text-blue-500 hover:underline">
          ← Back to Patients
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <div className="flex space-x-2">
            <Link href={`/patients/${patient.id}/edit`} passHref>
              <Button variant="outline">Edit Patient</Button>
            </Link>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-4">
          <p className="text-gray-500">
            <span className="font-medium">Patient ID:</span> {patient.id}
          </p>
          <p className="text-gray-500">
            <span className="font-medium">Created:</span> {new Date(patient.created_at).toLocaleString()}
          </p>
          <p className="text-gray-500">
            <span className="font-medium">Last Updated:</span> {new Date(patient.updated_at).toLocaleString()}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/patients/${patient.id}/images`} passHref>
            <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <h2 className="text-xl font-semibold mb-2">X-ray Images</h2>
              <p className="text-gray-600 mb-3">View and manage X-ray images</p>
              <span className="text-blue-500">View Images →</span>
            </div>
          </Link>
          
          <div className="border rounded-lg p-4 opacity-60">
            <h2 className="text-xl font-semibold mb-2">Annotations</h2>
            <p className="text-gray-600 mb-3">View and create annotations</p>
            <span className="text-gray-400">Coming soon</span>
          </div>
          
          <div className="border rounded-lg p-4 opacity-60">
            <h2 className="text-xl font-semibold mb-2">Correction Plans</h2>
            <p className="text-gray-600 mb-3">Create and manage correction plans</p>
            <span className="text-gray-400">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
} 