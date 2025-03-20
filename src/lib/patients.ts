import { supabase } from './supabase'
import type { Patient } from '@/types/database'

// Mock patient data for development
const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    dateOfBirth: '1985-05-15',
    gender: 'male',
    medicalRecordNumber: 'MRN12345',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Smith',
    dateOfBirth: '1990-10-20',
    gender: 'female',
    medicalRecordNumber: 'MRN67890',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Alex Johnson',
    dateOfBirth: '1978-03-08',
    gender: 'other',
    medicalRecordNumber: 'MRN45678',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

/**
 * Get all patients
 */
export async function getPatients(): Promise<Patient[]> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => resolve(mockPatients), 500)
  })
}

/**
 * Get a patient by ID
 */
export async function getPatient(id: string): Promise<Patient | null> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const patient = mockPatients.find(p => p.id === id) || null
      resolve(patient)
    }, 300)
  })
}

/**
 * Create a new patient
 */
export async function createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
  // In a real app, this would post to an API or database
  const newPatient: Patient = {
    id: String(mockPatients.length + 1),
    ...patientData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return new Promise(resolve => {
    setTimeout(() => {
      mockPatients.push(newPatient)
      resolve(newPatient)
    }, 500)
  })
}

export async function updatePatient(
  id: string,
  name: string
): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
} 