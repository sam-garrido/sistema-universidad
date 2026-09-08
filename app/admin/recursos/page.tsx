'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminRecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const [form, setForm] = useState({
    titulo: '',
    autor: '',
    materia: '',
    carrera: '',
    semestre: 1,
  })

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('recursos_bibliograficos')
      .select('*')
      .order('created_at', { ascending: false })

    setRecursos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor })
  }

  const subirRecurso = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivo) {
      setMensaje('Selecciona un archivo PDF.')
      return
    }

    setGuardando(true)
    setMensaje('')

    // 1. Subir el archivo al bucket "recursos"
    const nombreArchivo = `${Date.now()}-${archivo.name}`
    const { error: uploadError } = await supabase.storage
      .from('recursos')
      .upload(nombreArchivo, archivo)

    if (uploadError) {
      setMensaje(`Error al subir el archivo: ${uploadError.message}`)
      setGuardando(false)
      return
    }

    // 2. Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage.from('recursos').getPublicUrl(nombreArchivo)

    // 3. Registrar el recurso en la base de datos
    const { error: insertError } = await supabase.from('recursos_bibliograficos').insert({
      titulo: form.titulo,
      autor: form.autor,
      materia: form.materia,
      carrera: form.carrera,
      semestre: Number(form.semestre),
      archivo_url: urlData.publicUrl,
    })

    if (insertError) {
      setMensaje(`Error al registrar: ${insertError.message}`)
    } else {
      setMensaje('Recurso subido correctamente.')
      setForm({ titulo: '', autor: '', materia: '', carrera: '', semestre: 1 })
      setArchivo(null)
      setMostrarForm(false)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarRecurso = async (id: string) => {
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
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          {mostrarForm ? 'Cancelar' : '+ Subir recurso'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={subirRecurso} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
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
            <input type="text" value={form.materia}
              onChange={(e) => actualizarCampo('materia', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Carrera</label>
            <input type="text" value={form.carrera}
              onChange={(e) => actualizarCampo('carrera', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
            <input type="number" min={1} required value={form.semestre}
              onChange={(e) => setForm({ ...form, semestre: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Archivo PDF</label>
            <input type="file" accept="application/pdf" required
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              {guardando ? 'Subiendo...' : 'Subir recurso'}
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
              <button onClick={() => eliminarRecurso(r.id)} className="text-red-600 hover:underline text-sm">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
