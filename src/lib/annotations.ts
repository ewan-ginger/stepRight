import type { Annotation } from '@/types/database'

// Mock annotations store for development
let mockAnnotations: Annotation[] = []

/**
 * Get all annotations for a specific image
 */
export async function getImageAnnotations(imageId: string): Promise<Annotation[]> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const annotations = mockAnnotations.filter(anno => anno.imageId === imageId)
      resolve(annotations)
    }, 300)
  })
}

/**
 * Get all annotations for a patient
 */
export async function getPatientAnnotations(patientId: string): Promise<Annotation[]> {
  // In a real app, this would fetch from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const annotations = mockAnnotations.filter(anno => anno.patientId === patientId)
      resolve(annotations)
    }, 300)
  })
}

/**
 * Create a new annotation
 */
export async function createAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Annotation> {
  // In a real app, this would post to an API or database
  const newAnnotation: Annotation = {
    id: String(mockAnnotations.length + 1),
    ...annotation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  return new Promise(resolve => {
    setTimeout(() => {
      mockAnnotations.push(newAnnotation)
      resolve(newAnnotation)
    }, 200)
  })
}

/**
 * Update an existing annotation
 */
export async function updateAnnotation(id: string, data: Partial<Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Annotation | null> {
  // In a real app, this would put to an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const index = mockAnnotations.findIndex(anno => anno.id === id)
      if (index === -1) {
        resolve(null)
        return
      }
      
      const updatedAnnotation: Annotation = {
        ...mockAnnotations[index],
        ...data,
        updatedAt: new Date().toISOString()
      }
      
      mockAnnotations[index] = updatedAnnotation
      resolve(updatedAnnotation)
    }, 200)
  })
}

/**
 * Delete an annotation
 */
export async function deleteAnnotation(id: string): Promise<boolean> {
  // In a real app, this would delete from an API or database
  return new Promise(resolve => {
    setTimeout(() => {
      const initialLength = mockAnnotations.length
      mockAnnotations = mockAnnotations.filter(anno => anno.id !== id)
      resolve(mockAnnotations.length < initialLength)
    }, 200)
  })
} 