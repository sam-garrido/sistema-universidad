'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function HorarioPage() {
  const [imagenUrl, setImagenUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: alumno } = await supabase
        .from('alumnos')
        .select('semestre')
        .eq('id', user.id)
        .single()

      const { data: horario } = await supabase
        .from('horario_imagenes')
        .select('imagen_url')
        .eq('semestre', alumno?.semestre)
        .single()

      setImagenUrl(horario?.imagen_url || null)
      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-green-700 my-4">Horario de Clases</h1>

      {imagenUrl ? (
        <div className="bg-white rounded-lg shadow p-4 max-w-3xl">
          <img src={imagenUrl} alt="Horario de clases" className="w-full rounded" />
        </div>
      ) : (
        <p className="text-gray-500">Aún no se ha publicado el horario para tu semestre.</p>
      )}
    </div>
  )
}