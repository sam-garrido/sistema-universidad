'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminRecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([])
  const [materias, setMaterias] = useState<any[]>([])
  const [carreras, setCarreras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const formVacio = {
    titulo: '',
    autor: '',
    materia: '',
    carrera: '',
    semestre: 1,
  }

  const [form, setForm] = useState(formVacio)

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('recursos_bibliograficos')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: materiasData } = await supabase.from('materias').select('*').order('semestre')
    const { data: carrerasData } = await supabase.from('carreras').select('*').order('nombre')

    setRecursos(data || [])
    setMaterias(materiasData || [])
    setCarreras(carrerasData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor })
  }

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(formVacio)
    setArchivo(null)
    setMensaje('')
    setMostrarForm(true)
  }

  const abrirEditar = (r: any) => {
    setEditandoId(r.id)
    setForm({
      titulo: r.titulo,
      autor: r.autor || '',
      materia: r.materia || '',
      carrera: r.carrera || '',
      semestre: r.semestre || 1,
    })
    setArchivo(null)
    setMensaje('')
    setMostrarForm(true)
  }

  const guardarRecurso = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editandoId && !archivo) {
      setMensaje('Selecciona un archivo PDF.')
      return
    }

    setGuardando(true)
    setMensaje('')

    let archivoUrl: string | undefined

    // Si se seleccionó un archivo nuevo (alta, o reemplazo en edición), lo subimos
    if (archivo) {
      const nombreArchivo = `${Date.now()}-${archivo.name}`
      const { error: uploadError } = await supabase.storage
        .from('recursos')
        .upload(nombreArchivo, archivo)

      if (uploadError) {
        setMensaje(`Error al subir el archivo: ${uploadError.message}`)
        setGuardando(false)
        return
      }

      const { data: urlData } = supabase.storage.from('recursos').getPublicUrl(nombreArchivo)
      archivoUrl = urlData.publicUrl
    }

    const payload: any = {
      titulo: form.titulo,
      autor: form.autor,
      materia: form.materia,
      carrera: form.carrera,
      semestre: Number(form.semestre),
    }
    if (archivoUrl) payload.archivo_url = archivoUrl

    let error
    if (editandoId) {
      ;({ error } = await supabase.from('recursos_bibliograficos').update(payload).eq('id', editandoId))
    } else {
      ;({ error } = await supabase.from('recursos_bibliograficos').insert(payload))
    }

    if (error) {
      setMensaje(`Error al registrar: ${error.message}`)
    } else {
      setMensaje(editandoId ? 'Recurso actualizado correctamente.' : 'Recurso subido correctamente.')
      setForm(formVacio)
      setArchivo(null)
      setMostrarForm(false)
      setEditandoId(null)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarRecurso = async (id: string) => {
    const confirmar = confirm('¿Eliminar este recurso bibliográfico?')
    if (!confirmar) return
    await supabase.from('recursos_bibliograficos').delete().eq('id', id)
    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Recursos Bibliográficos</h1>
        <button
          onClick={mostrarForm ? () => setMostrarForm(false) : abrirNuevo}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          {mostrarForm ? 'Cancelar' : '+ Subir recurso'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardarRecurso} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-bold text-gray-700">
            {editandoId ? 'Editar recurso' : 'Nuevo recurso'}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-1">Título</label>
            <input type="text" required value={form.titulo}
              onChange={(e) => actualizarCampo('titulo', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Autor</label>
            <input type="text" value={form.autor}
              onChange={(e) => actualizarCampo('autor', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Materia</label>
            <select value={form.materia}
              onChange={(e) => actualizarCampo('materia', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Selecciona una materia</option>
              {materias.map((m) => (
                <option key={m.id} value={m.nombre}>{m.nombre} (Sem. {m.semestre})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Carrera</label>
            <select value={form.carrera}
              onChange={(e) => actualizarCampo('carrera', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Selecciona una carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
                        <input type="number" min={1} required value={form.semestre}
              onChange={(e) => setForm({ ...form, semestre: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">
              Archivo PDF {editandoId && <span className="text-gray-400 font-normal">(déjalo vacío para conservar el actual)</span>}
            </label>
            <input type="file" accept="application/pdf" required={!editandoId}
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Subir recurso'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recursos.map((r) => (
          <div key={r.id} className="bg-white rounded-lg shadow p-4">
            <h2 className="font-bold text-gray-800">{r.titulo}</h2>
            <p className="text-sm text-gray-500">{r.autor}</p>
            <p className="text-sm text-gray-500">{r.materia}</p>
            <p className="text-xs text-gray-400 mb-3">Semestre {r.semestre}</p>
            <div className="flex justify-between items-center">
              <a href={r.archivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                Ver PDF
              </a>
              <div className="space-x-3">
                <button onClick={() => abrirEditar(r)} className="text-blue-600 hover:underline text-sm">
                  Editar
                </button>
                <button onClick={() => eliminarRecurso(r.id)} className="text-red-600 hover:underline text-sm">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}