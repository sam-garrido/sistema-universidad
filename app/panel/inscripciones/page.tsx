'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const supabase = createClient()

  const cargar = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('alumno_id', user.id)
      .order('fecha_inscripcion', { ascending: false })

    setInscripciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const solicitarReinscripcion = async () => {
    setEnviando(true)
    setMensaje('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('semestre')
      .eq('id', user.id)
      .single()

    const { error } = await supabase.from('inscripciones').insert({
      alumno_id: user.id,
      ciclo_escolar: '2026-2027 B',
      semestre: (alumno?.semestre || 1) + 1,
      estatus: 'pendiente',
    })

    if (!error) {
      setMensaje('Solicitud de reinscripción enviada. Está pendiente de confirmación.')
      cargar()
    } else {
      setMensaje('Ocurrió un error al enviar la solicitud.')
    }

    setEnviando(false)
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const colorEstatus = (estatus: string) => {
    if (estatus === 'confirmada') return 'text-green-600'
    if (estatus === 'cancelada') return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-purple-700 my-4">Inscripciones</h1>

      <button
        onClick={solicitarReinscripcion}
        disabled={enviando}
        className="mb-6 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
      >
        {enviando ? 'Enviando...' : 'Solicitar reinscripción'}
      </button>

      {mensaje && <p className="mb-4 text-sm text-gray-700">{mensaje}</p>}

      {inscripciones.length === 0 ? (
        <p className="text-gray-500">No tienes inscripciones registradas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-purple-50">
              <tr>
                <th className="p-3">Ciclo escolar</th>
                <th className="p-3">Semestre</th>
                <th className="p-3">Estatus</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="p-3">{i.ciclo_escolar}</td>
                  <td className="p-3">{i.semestre}</td>
                  <td className={`p-3 font-medium ${colorEstatus(i.estatus)}`}>{i.estatus}</td>
                  <td className="p-3">{new Date(i.fecha_inscripcion).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}