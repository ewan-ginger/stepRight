import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Params {
  params: {
    id: string
  }
}

// GET /api/patients/[id]/images - Get images for a specific patient
export async function GET(request: Request, { params }: Params) {
  const id = params.id

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
} 