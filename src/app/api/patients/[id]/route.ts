import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface Params {
  params: {
    id: string
  }
}

// GET /api/patients/[id] - Get a specific patient
export async function GET(request: Request, { params }: Params) {
  const id = params.id

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    )
  }

  return NextResponse.json(data)
}

// PATCH /api/patients/[id] - Update a patient
export async function PATCH(request: Request, { params }: Params) {
  const id = params.id
  const body = await request.json()
  
  const { name } = body
  
  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('patients')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 }
    )
  }

  return NextResponse.json(data)
}

// DELETE /api/patients/[id] - Delete a patient
export async function DELETE(request: Request, { params }: Params) {
  const id = params.id

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
} 