export interface Patient {
  id: string
  name: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  medicalRecordNumber?: string
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: string
  patientId: string
  url: string
  viewType: 'top' | 'side'
  createdAt: string
  updatedAt: string
}

export interface Annotation {
  id: string
  imageId: string
  patientId: string
  type: 'line' | 'ellipse' | 'point' | 'angle'
  data: AnnotationData
  createdAt: string
  updatedAt: string
}

export type AnnotationData = 
  | LineAnnotation
  | EllipseAnnotation
  | PointAnnotation
  | AngleAnnotation

export interface LineAnnotation {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
}

export interface EllipseAnnotation {
  cx: number
  cy: number
  rx: number
  ry: number
  color: string
  width: number
}

export interface PointAnnotation {
  x: number
  y: number
  radius: number
  color: string
}

export interface AngleAnnotation {
  x1: number
  y1: number
  x2: number
  y2: number
  x3: number
  y3: number
  color: string
  width: number
}

export interface ExportedFile {
  id: string
  created_at: string
  patient_id: string
  image_id: string
  url: string
  type: 'dxf'
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      images: {
        Row: Image
        Insert: Omit<Image, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Image, 'id' | 'created_at' | 'updated_at'>>
      }
      exported_files: {
        Row: ExportedFile
        Insert: Omit<ExportedFile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExportedFile, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 