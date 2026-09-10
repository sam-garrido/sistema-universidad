import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { alumnoId } = await req.json()

  const supabaseAdmin = createAdminClient()

  // Al eliminar el usuario de autenticación, la tabla "alumnos" se borra
  // automáticamente en cascada (así se configuró desde el inicio).
  const { error } = await supabaseAdmin.auth.admin.deleteUser(alumnoId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}