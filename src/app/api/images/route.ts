import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadXray } from '@/lib/storage'

// POST /api/images - Upload a new image
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const patientId = formData.get('patientId') as string
  
  if (!file) {
    return NextResponse.json(
      { error: 'File is required' },
      { status: 400 }
    )
  }
  
  if (!patientId) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400 }
    )
  }

  try {
    // Upload to Supabase Storage
    const { url, path } = await uploadXray(file, patientId)
    
    // Save image record in database
    const { data, error } = await supabase
      .from('images')
      .insert({
        patient_id: patientId,
        url
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
} 