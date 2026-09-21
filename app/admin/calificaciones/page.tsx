'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAdmin } from '../AdminContext'

export default function AdminCalificacionesPage() {
  const { admin } = useAdmin()
  const [calificaciones, setCalificaciones] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [materiasAsignadas, setMateriasAsignadas] = useState<any[]>([])
  const [cicloActual, setCicloActual] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroSemestre, setFiltroSemestre] = useState('')

  const formVacio = {
    alumno_id: '',
    materia: '',
    calificacion: '',
  }

  const [form, setForm] = useState(formVacio)

  const supabase = createClient()

  const cargar = async () => {
    if (!admin) return

    const { data: califData } = await supabase
      .from('calificaciones')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('semestre', { ascending: true })

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido_paterno, matricula')
      .order('nombre')

    const { data: asignacionesData } = await supabase
      .from('asignaciones_docente')
      .select('materias(id, nombre, semestre)')
      .eq('docente_id', admin.id)

    const materiasUnicas = Array.from(
      new Map(
        (asignacionesData || [])
          .map((a: any) => a.materias)
          .filter(Boolean)
          .map((m: any) => [m.id, m])
      ).values()
    )

    const { data: cicloData } = await supabase.rpc('ciclo_escolar_actual')

    setCalificaciones(califData || [])
    setAlumnos(alumnosData || [])
    setMateriasAsignadas(materiasUnicas)
    setCicloActual(cicloData || '')
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [admin])

  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor })
  }

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(formVacio)
    setMensaje('')
    setMostrarForm(true)
  }

  const abrirEditar = (c: any) => {
    setEditandoId(c.id)
    setForm({
      alumno_id: c.alumno_id,
      materia: c.materia,
      calificacion: c.calificacion,
    })
    setMensaje('')
    setMostrarForm(true)
  }

  const semestreDeLaMateria = materiasAsignadas.find((m: any) => m.nombre === form.materia)?.semestre

  const guardarCalificacion = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const materiaSeleccionada = materiasAsignadas.find((m: any) => m.nombre === form.materia)

    const payload = {
      alumno_id: form.alumno_id,
      semestre: materiaSeleccionada?.semestre,
      materia: form.materia,
      calificacion: Number(form.calificacion),
      ciclo_escolar: cicloActual,
    }

    let error
    if (editandoId) {
      ;({ error } = await supabase.from('calificaciones').update(payload).eq('id', editandoId))
    } else {
      ;({ error } = await supabase.from('calificaciones').insert(payload))
    }

    if (error) {
      setMensaje('No puedes registrar esta calificación: el alumno o la materia no está entre tus asignaciones.')
    } else {
      setMensaje(editandoId ? 'Calificación actualizada.' : 'Calificación registrada correctamente.')
      setForm(formVacio)
      setMostrarForm(false)
      setEditandoId(null)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarCalificacion = async (id: string) => {
    const confirmar = confirm('¿Eliminar esta calificación?')
    if (!confirmar) return
    await supabase.from('calificaciones').delete().eq('id', id)
    cargar()
  }

  const semestresDisponibles = Array.from(new Set(calificaciones.map((c) => c.semestre))).sort((a, b) => a - b)

  const calificacionesFiltradas = calificaciones.filter((c) => {
    const texto = `${c.alumnos?.matricula || ''} ${c.alumnos?.nombre || ''} ${c.alumnos?.apellido_paterno || ''} ${c.materia}`.toLowerCase()
    const coincideBusqueda = texto.includes(busqueda.toLowerCase())
    const coincideSemestre = !filtroSemestre || String(c.semestre) === filtroSemestre
    return coincideBusqueda && coincideSemestre
  })

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 my-4">
        <h1 className="text-2xl font-bold">Gestión de Calificaciones</h1>
        <button
          onClick={mostrarForm ? () => setMostrarForm(false) : abrirNuevo}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
        >
          {mostrarForm ? 'Cancelar' : '+ Registrar calificación'}
        </button>
      </div>

      {materiasAsignadas.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg p-4 mb-4">
          Aún no tienes materias asignadas. Pide a Control Escolar que te asigne una materia y grupo para poder registrar calificaciones.
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={guardarCalificacion} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h2 className="sm:col-span-2 font-bold text-gray-700">
            {editandoId ? 'Editar calificación' : 'Nueva calificación'}
          </h2>

          <div className="sm:col-span-2">
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
            <select required value={form.materia}
              onChange={(e) => actualizarCampo('materia', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Selecciona una materia</option>
              {materiasAsignadas.map((m: any) => (
                <option key={m.id} value={m.nombre}>
                  {m.nombre} (Sem. {m.semestre})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
            <input
              type="text"
              disabled
              value={semestreDeLaMateria || '—'}
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Calificación</label>
            <input type="number" step="0.1" min={0} max={10} required value={form.calificacion}
              onChange={(e) => actualizarCampo('calificacion', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ciclo escolar</label>
            <input
              type="text"
              disabled
              value={cicloActual}
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-500"
            />
          </div>
          <div className="sm:col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full sm:w-auto">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por alumno, matrícula o materia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={filtroSemestre}
          onChange={(e) => setFiltroSemestre(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Todos los semestres</option>
          {semestresDisponibles.map((s) => (
            <option key={s} value={s}>Semestre {s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
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
            {calificacionesFiltradas.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.alumnos?.matricula} - {c.alumnos?.nombre} {c.alumnos?.apellido_paterno}</td>
                <td className="p-3">{c.semestre}</td>
                <td className="p-3">{c.materia}</td>
                <td className={`p-3 font-medium ${c.calificacion >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.calificacion}
                </td>
                <td className="p-3">{c.ciclo_escolar || '-'}</td>
                <td className="p-3 space-x-3 whitespace-nowrap">
                  <button onClick={() => abrirEditar(c)} className="text-blue-600 hover:underline text-sm">
                    Editar
                  </button>
                  <button onClick={() => eliminarCalificacion(c.id)} className="text-red-600 hover:underline text-sm">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {calificacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No se encontraron calificaciones con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}