import { supabase } from './supabase'

const XRAYS_BUCKET = 'xrays'
const DXF_EXPORTS_BUCKET = 'dxf-exports'

export async function uploadXray(file: File, patientId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${patientId}/${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError, data } = await supabase.storage
    .from(XRAYS_BUCKET)
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from(XRAYS_BUCKET)
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath
  }
}

export async function uploadDXF(file: File, patientId: string, imageId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${patientId}/${imageId}/${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError, data } = await supabase.storage
    .from(DXF_EXPORTS_BUCKET)
    .upload(filePath, file)

  if (uploadError) {
    throw uploadError
  }

  const { data: { publicUrl } } = supabase.storage
    .from(DXF_EXPORTS_BUCKET)
    .getPublicUrl(filePath)

  return {
    url: publicUrl,
    path: filePath
  }
}

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw error
  }
} 