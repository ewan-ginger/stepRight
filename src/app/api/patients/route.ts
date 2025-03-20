import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/patients - Get all patients
export async function GET() {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/patients - Create a new patient
export async function POST(request: Request) {
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
    .insert({ name })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
} 