import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'Falta el id del administrador' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Borrar el usuario de Auth también borra su fila en administradores,
  // gracias al "on delete cascade" que ya tiene esa tabla.
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}