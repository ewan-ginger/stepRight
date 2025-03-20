'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { getPatients, createPatient } from '@/lib/patients'
import type { Patient } from '@/types/database'

interface PatientSelectorProps {
  onSelectPatient: (patient: Patient) => void
}

export default function PatientSelector({ onSelectPatient }: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [newPatientName, setNewPatientName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients()
        setPatients(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patients')
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPatientName.trim()) {
      setError('Please enter a patient name')
      return
    }
    
    try {
      setIsCreating(true)
      setError(null)
      const patient = await createPatient(newPatientName)
      setPatients(prev => [patient, ...prev])
      setNewPatientName('')
      onSelectPatient(patient)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create patient')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    onSelectPatient(patient)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading patients...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Select or Create a Patient</h2>
      
      <form onSubmit={handleCreatePatient} className="mb-6">
        <div className="flex items-center">
          <input
            type="text"
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            placeholder="Enter new patient name"
            className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreating}
          />
          <Button 
            type="submit" 
            className="rounded-l-none"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </form>
      
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Existing Patients</h3>
        
        {patients.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No patients yet. Create your first patient above.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {patients.map((patient) => (
              <div 
                key={patient.id}
                className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSelectPatient(patient)}
              >
                <p className="font-medium">{patient.name}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(patient.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 