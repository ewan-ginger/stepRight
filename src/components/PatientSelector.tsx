'use client'

import React, { useEffect, useState } from 'react'
import { getPatients } from '@/lib/patients'
import type { Patient } from '@/types/database'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PatientSelectorProps {
  onPatientSelected: (patient: Patient) => void
}

export default function PatientSelector({ onPatientSelected }: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true)
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

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.medicalRecordNumber && 
      patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading patients...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name or medical record number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {filteredPatients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No patients found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <Card 
              key={patient.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onPatientSelected(patient)}
            >
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg">{patient.name}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p><span className="font-medium">DoB:</span> {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                  {patient.medicalRecordNumber && (
                    <p><span className="font-medium">MRN:</span> {patient.medicalRecordNumber}</p>
                  )}
                  <p><span className="font-medium">Gender:</span> {patient.gender}</p>
                </div>
                <div className="mt-4">
                  <Button className="w-full">Select Patient</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 