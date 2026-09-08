'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default function HorarioPage() {
  const [horario, setHorario] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('horario')
        .select('*')
        .eq('alumno_id', user.id)
        .order('hora_inicio', { ascending: true })

      setHorario(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-green-700 my-4">Horario de Clases</h1>

      {horario.length === 0 ? (
        <p className="text-gray-500">Aún no tienes materias registradas en tu horario.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {DIAS.map((dia) => (
            <div key={dia} className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-center mb-3 text-gray-700">{dia}</h2>
              {horario
                .filter((h) => h.dia === dia)
                .map((h) => (
                  <div key={h.id} className="mb-3 p-2 bg-green-50 rounded">
                    <p className="font-semibold text-sm">{h.materia}</p>
                    <p className="text-xs text-gray-500">{h.hora_inicio} - {h.hora_fin}</p>
                    <p className="text-xs text-gray-500">Aula: {h.aula}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}