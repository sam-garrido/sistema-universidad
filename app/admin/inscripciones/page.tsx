'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('inscripciones')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('fecha_inscripcion', { ascending: false })

    setInscripciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarEstatus = async (id: string, nuevoEstatus: string, alumnoId: string, semestre: number) => {
    await supabase.from('inscripciones').update({ estatus: nuevoEstatus }).eq('id', id)

    // Si se confirma, actualizamos también el semestre actual del alumno
    if (nuevoEstatus === 'confirmada') {
      await supabase.from('alumnos').update({ semestre }).eq('id', alumnoId)
    }

    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const colorEstatus = (estatus: string) => {
    if (estatus === 'confirmada') return 'text-green-600'
    if (estatus === 'cancelada') return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold my-4">Gestión de Inscripciones</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Alumno</th>
              <th className="p-3">Ciclo escolar</th>
              <th className="p-3">Semestre</th>
              <th className="p-3">Estatus</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3">{i.alumnos?.matricula} - {i.alumnos?.nombre} {i.alumnos?.apellido_paterno}</td>
                <td className="p-3">{i.ciclo_escolar}</td>
                <td className="p-3">{i.semestre}</td>
                <td className={`p-3 font-medium ${colorEstatus(i.estatus)}`}>{i.estatus}</td>
                <td className="p-3">{new Date(i.fecha_inscripcion).toLocaleDateString('es-MX')}</td>
                <td className="p-3 space-x-3">
                  {i.estatus === 'pendiente' && (
                    <>
                      <button
                        onClick={() => actualizarEstatus(i.id, 'confirmada', i.alumno_id, i.semestre)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => actualizarEstatus(i.id, 'cancelada', i.alumno_id, i.semestre)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}