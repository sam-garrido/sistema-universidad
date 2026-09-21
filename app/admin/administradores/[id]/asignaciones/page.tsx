'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Materia = {
  id: string
  nombre: string
  semestre: number
  carrera: string
}

type Asignacion = {
  id: string
  materia_id: string
  grupo: string
  ciclo_escolar: string
  materias: Materia
}

export default function AsignacionesDocentePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [docente, setDocente] = useState<{ nombre: string } | null>(null)
  const [materias, setMaterias] = useState<Materia[]>([])
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [materiaId, setMateriaId] = useState('')
  const [grupo, setGrupo] = useState('')

  const cargarDatos = async () => {
    const [{ data: docenteData }, { data: materiasData }, { data: asignacionesData }] = await Promise.all([
      supabase.from('administradores').select('nombre').eq('id', id).single(),
      supabase.from('materias').select('*').order('carrera').order('semestre'),
      supabase
        .from('asignaciones_docente')
        .select('id, materia_id, grupo, ciclo_escolar, materias(id, nombre, semestre, carrera)')
        .eq('docente_id', id),
    ])

    setDocente(docenteData)
    setMaterias(materiasData || [])
    setAsignaciones((asignacionesData as any) || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [id])

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materiaId || !grupo) return
    setGuardando(true)
    setError('')

    const { error } = await supabase.from('asignaciones_docente').insert({
      docente_id: id,
      materia_id: materiaId,
      grupo,
    })

    if (error) {
      if (error.code === '23505') {
        setError('Esa materia y grupo ya están asignados a otro maestro en este ciclo escolar. Revisa las asignaciones existentes.')
      } else {
        setError('Hubo un problema al guardar la asignación. Intenta de nuevo.')
      }
      setGuardando(false)
      return
    }

    setMateriaId('')
    setGrupo('')
    setGuardando(false)
    cargarDatos()
  }

  const handleEliminar = async (asignacionId: string) => {
    if (!confirm('¿Quitar esta asignación al maestro?')) return
    await supabase.from('asignaciones_docente').delete().eq('id', asignacionId)
    cargarDatos()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <Link href="/admin/administradores" className="text-blue-600 hover:underline text-sm">
        ← Volver a Administradores
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-1">Materias asignadas</h1>
      <p className="text-gray-600 mb-6">Maestro: <strong>{docente?.nombre}</strong></p>

      <form onSubmit={handleAgregar} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8 space-y-4">
        <h2 className="font-semibold">Asignar nueva materia</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Materia</label>
          <select
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Selecciona una materia</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} — {m.carrera} (Sem. {m.semestre})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grupo</label>
          <input
            type="text"
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            placeholder="Ej. A, 1, Único"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full sm:w-auto"
        >
          {guardando ? 'Guardando...' : 'Asignar'}
        </button>
      </form>

      <h2 className="font-semibold text-lg mb-3">Asignaciones actuales</h2>
      {asignaciones.length === 0 ? (
        <p className="text-gray-500">Este maestro aún no tiene materias asignadas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Materia</th>
                <th className="p-3">Carrera</th>
                <th className="p-3">Semestre</th>
                <th className="p-3">Grupo</th>
                <th className="p-3">Ciclo</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.materias?.nombre}</td>
                  <td className="p-3">{a.materias?.carrera}</td>
                  <td className="p-3">{a.materias?.semestre}</td>
                  <td className="p-3">{a.grupo}</td>
                  <td className="p-3">{a.ciclo_escolar}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      onClick={() => handleEliminar(a.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}