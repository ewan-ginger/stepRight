'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Patient } from '@/types/database'

interface PatientCardProps {
  patient: Patient
  onDelete: (id: string) => Promise<void>
}

export default function PatientCard({ patient, onDelete }: PatientCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (confirm('Are you sure you want to delete this patient?')) {
      try {
        setIsDeleting(true)
        await onDelete(patient.id)
      } catch (error) {
        console.error('Failed to delete patient:', error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-medium">{patient.name}</h3>
      <p className="text-sm text-gray-500">
        Added: {new Date(patient.created_at).toLocaleDateString()}
      </p>
      
      <div className="mt-4 flex space-x-2">
        <Link href={`/patients/${patient.id}`} passHref>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
        <Link href={`/patients/${patient.id}/edit`} passHref>
          <Button variant="secondary" size="sm">
            Edit
          </Button>
        </Link>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  )
} 