'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminCatalogosPage() {
  const [carreras, setCarreras] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [nuevaCarrera, setNuevaCarrera] = useState('')
  const [editandoCarreraId, setEditandoCarreraId] = useState<string | null>(null)

  const [nuevaMateria, setNuevaMateria] = useState({ nombre: '', semestre: 1, carrera: '' })
  const [editandoMateriaId, setEditandoMateriaId] = useState<string | null>(null)

  const [mensaje, setMensaje] = useState('')

  const supabase = createClient()

  const cargar = async () => {
    const { data: carrerasData } = await supabase.from('carreras').select('*').order('nombre')
    const { data: materiasData } = await supabase.from('materias').select('*').order('semestre')
    setCarreras(carrerasData || [])
    setMaterias(materiasData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  // --- Carreras ---
  const guardarCarrera = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaCarrera.trim()) return

    let error
    if (editandoCarreraId) {
      ;({ error } = await supabase.from('carreras').update({ nombre: nuevaCarrera }).eq('id', editandoCarreraId))
    } else {
      ;({ error } = await supabase.from('carreras').insert({ nombre: nuevaCarrera }))
    }

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setNuevaCarrera('')
      setEditandoCarreraId(null)
      cargar()
    }
  }

  const editarCarrera = (c: any) => {
    setEditandoCarreraId(c.id)
    setNuevaCarrera(c.nombre)
  }

  const cancelarEdicionCarrera = () => {
    setEditandoCarreraId(null)
    setNuevaCarrera('')
  }

  const eliminarCarrera = async (id: string) => {
    const confirmar = confirm('¿Eliminar esta carrera del catálogo?')
    if (!confirmar) return
    await supabase.from('carreras').delete().eq('id', id)
    cargar()
  }

  // --- Materias ---
  const guardarMateria = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevaMateria.nombre.trim() || !nuevaMateria.carrera) return

    let error
    if (editandoMateriaId) {
      ;({ error } = await supabase.from('materias').update(nuevaMateria).eq('id', editandoMateriaId))
    } else {
      ;({ error } = await supabase.from('materias').insert(nuevaMateria))
    }

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setNuevaMateria({ nombre: '', semestre: 1, carrera: '' })
      setEditandoMateriaId(null)
      cargar()
    }
  }

  const editarMateria = (m: any) => {
    setEditandoMateriaId(m.id)
    setNuevaMateria({ nombre: m.nombre, semestre: m.semestre, carrera: m.carrera || '' })
  }

  const cancelarEdicionMateria = () => {
    setEditandoMateriaId(null)
    setNuevaMateria({ nombre: '', semestre: 1, carrera: '' })
  }

  const eliminarMateria = async (id: string) => {
    const confirmar = confirm('¿Eliminar esta materia del catálogo?')
    if (!confirmar) return
    await supabase.from('materias').delete().eq('id', id)
    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold my-4">Catálogos: Carreras y Materias</h1>

      {mensaje && <p className="text-sm text-red-600 mb-4">{mensaje}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carreras */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="font-bold mb-3">Carreras</h2>
          <form onSubmit={guardarCarrera} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Nombre de la carrera"
              value={nuevaCarrera}
              onChange={(e) => setNuevaCarrera(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
                {editandoCarreraId ? 'Guardar' : 'Agregar'}
              </button>
              {editandoCarreraId && (
                <button type="button" onClick={cancelarEdicionCarrera} className="flex-1 sm:flex-none bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <ul className="divide-y">
            {carreras.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between items-center gap-2 py-2">
                <span>{c.nombre}</span>
                <div className="space-x-3 whitespace-nowrap">
                  <button onClick={() => editarCarrera(c)} className="text-blue-600 hover:underline text-sm">
                    Editar
                  </button>
                  <button onClick={() => eliminarCarrera(c.id)} className="text-red-600 hover:underline text-sm">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Materias */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="font-bold mb-3">Materias</h2>
          <form onSubmit={guardarMateria} className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Nombre de la materia"
              value={nuevaMateria.nombre}
              onChange={(e) => setNuevaMateria({ ...nuevaMateria, nombre: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={nuevaMateria.carrera}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, carrera: e.target.value })}
                className="flex-1 border rounded px-3 py-2"
              >
                <option value="">Selecciona carrera</option>
                {carreras.map((c) => (
                  <option key={c.id} value={c.nombre}>{c.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                placeholder="Semestre"
                value={nuevaMateria.semestre}
                onChange={(e) => setNuevaMateria({ ...nuevaMateria, semestre: Number(e.target.value) })}
                className="sm:w-24 border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 sm:flex-none bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800">
                {editandoMateriaId ? 'Guardar cambios' : 'Agregar materia'}
              </button>
              {editandoMateriaId && (
                <button type="button" onClick={cancelarEdicionMateria} className="flex-1 sm:flex-none bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <ul className="divide-y max-h-64 overflow-y-auto">
            {materias.map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between items-center gap-2 py-2">
                <span>{m.nombre} <span className="text-gray-400 text-sm">(Sem. {m.semestre})</span></span>
                <div className="space-x-3 whitespace-nowrap">
                  <button onClick={() => editarMateria(m)} className="text-blue-600 hover:underline text-sm">
                    Editar
                  </button>
                  <button onClick={() => eliminarMateria(m.id)} className="text-red-600 hover:underline text-sm">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}