import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const { email, password, nombre, puesto, rol } = await request.json()

  if (!email || !password || !nombre || !rol) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  if (rol !== 'control_escolar' && rol !== 'maestros') {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'No se pudo crear el usuario' }, { status: 400 })
  }

  const { error: dbError } = await supabaseAdmin
    .from('administradores')
    .insert({ id: authData.user.id, nombre, puesto: puesto || '', rol })

  if (dbError) {
    // Si falla el insert, eliminamos el usuario de auth para no dejarlo huérfano
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}