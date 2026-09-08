import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, matricula, nombre, apellido_paterno, apellido_materno, carrera, semestre } = body

  const supabaseAdmin = createAdminClient()

  // 1. Crear el usuario de autenticación
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (userError || !userData.user) {
    return NextResponse.json({ error: userError?.message || 'No se pudo crear el usuario' }, { status: 400 })
  }

  // 2. Insertar el perfil en la tabla alumnos
  const { error: alumnoError } = await supabaseAdmin.from('alumnos').insert({
    id: userData.user.id,
    matricula,
    nombre,
    apellido_paterno,
    apellido_materno,
    carrera,
    semestre,
  })

  if (alumnoError) {
    // Si falla el perfil, eliminamos el usuario para no dejar registros huérfanos
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    return NextResponse.json({ error: alumnoError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}