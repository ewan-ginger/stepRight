import { supabase } from './supabase'
import type { Image } from '@/types/database'

// Mock image data for development
const mockImages: Image[] = [
  {
    id: '1',
    patientId: '1',
    url: '/mock/patient1-top.jpg',
    viewType: 'top',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    patientId: '1',
    url: '/mock/patient1-side.jpg',
    viewType: 'side',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    patientId: '2',
    url: '/mock/patient2-top.jpg',
    viewType: 'top',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    patientId: '2',
    url: '/mock/patient2-side.jpg',
    viewType: 'side',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    patientId: '3',
    url: '/mock/patient3-top.jpg',
    viewType: 'top',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    patientId: '3',
    url: '/mock/patient3-side.jpg',
    viewType: 'side',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

/**
 * Get all images
 */
export async function getImages(): Promise<Image[]> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => resolve(mockImages), 500)
  })
}

/**
 * Get images for a specific patient
 */
export async function getPatientImages(patientId: string): Promise<Image[]> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const images = mockImages.filter(img => img.patientId === patientId)
      resolve(images)
    }, 300)
  })
}

/**
 * Get a specific image by ID
 */
export async function getImage(id: string): Promise<Image | null> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const image = mockImages.find(img => img.id === id) || null
      resolve(image)
    }, 200)
  })
}

/**
 * Upload a new image
 */
export async function uploadImage(file: File, patientId: string, viewType: 'top' | 'side'): Promise<Image> {
  // In a real app, this would upload to storage and save metadata to a database
  
  // Create a mock URL for development
  const objectURL = URL.createObjectURL(file)
  
  const newImage: Image = {
    id: String(mockImages.length + 1),
    patientId,
    url: objectURL, // In production, this would be the CDN URL
    viewType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return new Promise(resolve => {
    // Simulate a delay for upload
    setTimeout(() => {
      mockImages.push(newImage)
      resolve(newImage)
    }, 1000)
  })
}

export async function deleteImage(id: string, url: string): Promise<void> {
  // Extract path from URL or storage reference
  const path = url.split('/').pop() || ''
  
  try {
    // First delete the file from storage
    await supabase.storage
      .from('xrays')
      .remove([path])
    
    // Then delete the database record
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to delete image')
  }
} 