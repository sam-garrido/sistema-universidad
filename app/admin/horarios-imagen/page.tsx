'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminHorariosImagenPage() {
  const [horarios, setHorarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [semestre, setSemestre] = useState(1)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('horario_imagenes')
      .select('*')
      .order('semestre', { ascending: true })

    setHorarios(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const subirHorario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archivo) {
      setMensaje('Selecciona una imagen.')
      return
    }

    setGuardando(true)
    setMensaje('')

    const nombreArchivo = `semestre-${semestre}-${Date.now()}-${archivo.name}`
    const { error: uploadError } = await supabase.storage
      .from('horarios')
      .upload(nombreArchivo, archivo)

    if (uploadError) {
      setMensaje(`Error al subir: ${uploadError.message}`)
      setGuardando(false)
      return
    }

    const { data: urlData } = supabase.storage.from('horarios').getPublicUrl(nombreArchivo)

    // "upsert" reemplaza la imagen si ya existía una para ese semestre
    const { error } = await supabase
      .from('horario_imagenes')
      .upsert({ semestre, imagen_url: urlData.publicUrl, actualizado_en: new Date().toISOString() })

    if (error) {
      setMensaje(`Error al registrar: ${error.message}`)
    } else {
      setMensaje(`Horario del semestre ${semestre} actualizado.`)
      setArchivo(null)
      cargar()
    }

    setGuardando(false)
  }

  const eliminarHorario = async (sem: number) => {
    await supabase.from('horario_imagenes').delete().eq('semestre', sem)
    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold my-4">Horarios por Semestre (Imagen)</h1>

      <form onSubmit={subirHorario} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 flex flex-col gap-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Semestre</label>
          <input type="number" min={1} required value={semestre}
            onChange={(e) => setSemestre(Number(e.target.value))}
            className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Imagen del horario</label>
          <input type="file" accept="image/*" required
            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            className="w-full border rounded px-3 py-2" />
        </div>
        {mensaje && <p className="text-sm text-gray-700">{mensaje}</p>}
        <button type="submit" disabled={guardando}
          className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 w-full sm:w-auto">
          {guardando ? 'Subiendo...' : 'Subir / Actualizar horario'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {horarios.map((h) => (
          <div key={h.semestre} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold">Semestre {h.semestre}</h2>
              <button onClick={() => eliminarHorario(h.semestre)} className="text-red-600 hover:underline text-sm">
                Eliminar
              </button>
            </div>
            <img src={h.imagen_url} alt={`Horario semestre ${h.semestre}`} className="w-full rounded border" />
          </div>
        ))}
      </div>
    </div>
  )
}