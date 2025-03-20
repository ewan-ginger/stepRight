import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import PatientList from '@/components/patients/PatientList'
import { getPatients } from '@/lib/patients'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  const patients = await getPatients()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <Link href="/patients/new" passHref>
          <Button>Add New Patient</Button>
        </Link>
      </div>
      
      <PatientList patients={patients} />
    </div>
  )
} 