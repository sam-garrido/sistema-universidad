'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminCalificacionesPage() {
  const [calificaciones, setCalificaciones] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    alumno_id: '',
    semestre: 1,
    materia: '',
    calificacion: '',
    ciclo_escolar: '',
  })

  const supabase = createClient()

  const cargar = async () => {
    const { data: califData } = await supabase
      .from('calificaciones')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('semestre', { ascending: true })

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido_paterno, matricula')
      .order('nombre')

    setCalificaciones(califData || [])
    setAlumnos(alumnosData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string | number) => {
    setForm({ ...form, [campo]: valor })
  }

  const agregarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('calificaciones').insert({
      alumno_id: form.alumno_id,
      semestre: Number(form.semestre),
      materia: form.materia,
      calificacion: Number(form.calificacion),
      ciclo_escolar: form.ciclo_escolar,
    })

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setMensaje('Calificación registrada correctamente.')
      setForm({ alumno_id: '', semestre: 1, materia: '', calificacion: '', ciclo_escolar: '' })
      setMostrarForm(false)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarCalificacion = async (id: string) => {
    await supabase.from('calificaciones').delete().eq('id', id)
    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Gestión de Calificaciones</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Registrar calificación'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={agregarCalificacion} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Alumno</label>
            <select required value={form.alumno_id}
              onChange={(e) => actualizarCampo('alumno_id', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Selecciona un alumno</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.matricula} - {a.nombre} {a.apellido_paterno}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Materia</label>
            <input type="text" required value={form.materia}
              onChange={(e) => actualizarCampo('materia', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
            <input type="number" required min={1} value={form.semestre}
              onChange={(e) => actualizarCampo('semestre', Number(e.target.value))}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Calificación</label>
            <input type="number" step="0.1" min={0} max={10} required value={form.calificacion}
              onChange={(e) => actualizarCampo('calificacion', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciclo escolar</label>
            <input type="text" placeholder="2025-2026 A" value={form.ciclo_escolar}
              onChange={(e) => actualizarCampo('ciclo_escolar', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Alumno</th>
              <th className="p-3">Semestre</th>
              <th className="p-3">Materia</th>
              <th className="p-3">Calificación</th>
              <th className="p-3">Ciclo</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {calificaciones.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.alumnos?.matricula} - {c.alumnos?.nombre} {c.alumnos?.apellido_paterno}</td>
                <td className="p-3">{c.semestre}</td>
                <td className="p-3">{c.materia}</td>
                <td className={`p-3 font-medium ${c.calificacion >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.calificacion}
                </td>
                <td className="p-3">{c.ciclo_escolar || '-'}</td>
                <td className="p-3">
                  <button onClick={() => eliminarCalificacion(c.id)} className="text-red-600 hover:underline text-sm">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}