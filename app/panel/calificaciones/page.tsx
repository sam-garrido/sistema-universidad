'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CalificacionesPage() {
  const [calificaciones, setCalificaciones] = useState<any[]>([])
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

      const { data } = await supabase
        .from('calificaciones')
        .select('*')
        .eq('alumno_id', user.id)
        .order('semestre', { ascending: true })

      setCalificaciones(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) return <p className="p-8">Cargando...</p>

  // Agrupamos las calificaciones por semestre
  const porSemestre: Record<number, any[]> = {}
  calificaciones.forEach((c) => {
    if (!porSemestre[c.semestre]) porSemestre[c.semestre] = []
    porSemestre[c.semestre].push(c)
  })

  const semestres = Object.keys(porSemestre).map(Number).sort((a, b) => a - b)

  const promedio = (materias: any[]) => {
    const suma = materias.reduce((acc, m) => acc + Number(m.calificacion), 0)
    return (suma / materias.length).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-red-600 my-4">Calificaciones</h1>

      {semestres.length === 0 ? (
        <p className="text-gray-500">Aún no tienes calificaciones registradas.</p>
      ) : (
        semestres.map((sem) => (
          <div key={sem} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 overflow-x-auto">
            <div className="flex justify-between items-center mb-3 min-w-[420px] sm:min-w-0">
              <h2 className="font-bold text-gray-800">Semestre {sem}</h2>
              <span className="text-sm font-medium text-gray-600">
                Promedio: {promedio(porSemestre[sem])}
              </span>
            </div>
            <table className="w-full text-left min-w-[420px]">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Materia</th>
                  <th className="py-2">Calificación</th>
                  <th className="py-2">Ciclo</th>
                </tr>
              </thead>
              <tbody>
                {porSemestre[sem].map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2">{c.materia}</td>
                    <td className={`py-2 font-medium ${c.calificacion >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                      {c.calificacion}
                    </td>
                    <td className="py-2 text-gray-500">{c.ciclo_escolar || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}