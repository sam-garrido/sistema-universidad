'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default function AdminHorariosPage() {
  const [horario, setHorario] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    alumno_id: '',
    materia: '',
    dia: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
  })

  const supabase = createClient()

  const cargar = async () => {
    const { data: horarioData } = await supabase
      .from('horario')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('dia')

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido_paterno, matricula')
      .order('nombre')

    setHorario(horarioData || [])
    setAlumnos(alumnosData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor })
  }

  const agregarClase = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('horario').insert({
      alumno_id: form.alumno_id,
      materia: form.materia,
      dia: form.dia,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      aula: form.aula,
    })

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setMensaje('Clase agregada correctamente.')
      setForm({ alumno_id: '', materia: '', dia: 'Lunes', hora_inicio: '', hora_fin: '', aula: '' })
      setMostrarForm(false)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarClase = async (id: string) => {
    await supabase.from('horario').delete().eq('id', id)
    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Gestión de Horarios</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
        >
          {mostrarForm ? 'Cancelar' : '+ Agregar clase'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={agregarClase} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">Día</label>
            <select value={form.dia}
              onChange={(e) => actualizarCampo('dia', e.target.value)}
              className="w-full border rounded px-3 py-2">
              {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora inicio</label>
            <input type="time" required value={form.hora_inicio}
              onChange={(e) => actualizarCampo('hora_inicio', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hora fin</label>
            <input type="time" required value={form.hora_fin}
              onChange={(e) => actualizarCampo('hora_fin', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Aula</label>
            <input type="text" value={form.aula}
              onChange={(e) => actualizarCampo('aula', e.target.value)}
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
              <th className="p-3">Materia</th>
              <th className="p-3">Día</th>
              <th className="p-3">Horario</th>
              <th className="p-3">Aula</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {horario.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="p-3">{h.alumnos?.matricula} - {h.alumnos?.nombre} {h.alumnos?.apellido_paterno}</td>
                <td className="p-3">{h.materia}</td>
                <td className="p-3">{h.dia}</td>
                <td className="p-3">{h.hora_inicio} - {h.hora_fin}</td>
                <td className="p-3">{h.aula}</td>
                <td className="p-3">
                  <button onClick={() => eliminarClase(h.id)} className="text-red-600 hover:underline text-sm">
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