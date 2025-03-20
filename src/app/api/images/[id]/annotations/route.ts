import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

interface Params {
  params: {
    id: string
  }
}

// GET /api/images/[id]/annotations - Get annotations for a specific image
export async function GET(request: Request, { params }: Params) {
  const imageId = params.id

  const { data, error } = await supabase
    .from('annotations')
    .select('*')
    .eq('image_id', imageId)
    .order('created_at', { ascending: false })
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If no annotations found, return empty data
  if (!data) {
    return NextResponse.json(null)
  }

  return NextResponse.json(data)
}

// POST /api/images/[id]/annotations - Create or update annotations
export async function POST(request: Request, { params }: Params) {
  const imageId = params.id
  const body = await request.json()
  
  const { patientId, objects } = body
  
  if (!patientId) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400 }
    )
  }
  
  if (!objects || !Array.isArray(objects)) {
    return NextResponse.json(
      { error: 'Objects array is required' },
      { status: 400 }
    )
  }

  try {
    // Check if annotation exists
    const { data: existingAnnotation } = await supabase
      .from('annotations')
      .select('id')
      .eq('image_id', imageId)
      .single()

    let result
    const now = new Date().toISOString()
    
    if (existingAnnotation) {
      // Update existing annotation
      const { data, error } = await supabase
        .from('annotations')
        .update({
          objects,
          updated_at: now
        })
        .eq('id', existingAnnotation.id)
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      result = data
    } else {
      // Create new annotation
      const { data, error } = await supabase
        .from('annotations')
        .insert({
          id: uuidv4(),
          patient_id: patientId,
          image_id: imageId,
          objects,
          created_at: now,
          updated_at: now
        })
        .select()
        .single()
      
      if (error) {
        throw error
      }
      
      result = data
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save annotations' },
      { status: 500 }
    )
  }
} 