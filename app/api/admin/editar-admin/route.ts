import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { id, nombre, puesto, rol } = await req.json()

  if (!id || !nombre || !rol) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  if (rol !== 'control_escolar' && rol !== 'maestros') {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('administradores')
    .update({ nombre, puesto, rol })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}