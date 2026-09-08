'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function RecursosPage() {
  const [recursos, setRecursos] = useState<any[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from('recursos_bibliograficos')
        .select('*')
        .order('created_at', { ascending: false })

      setRecursos(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  const filtrados = recursos.filter((r) =>
    `${r.titulo} ${r.autor} ${r.materia}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <p className="p-8">Cargando...</p>

    return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-blue-700 my-4">Recursos Bibliográficos</h1>

      <input
        type="text"
        placeholder="Buscar por título, autor o materia..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="w-full max-w-md border rounded px-3 py-2 mb-6"
      />

      {filtrados.length === 0 ? (
        <p className="text-gray-500">No se encontraron recursos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtrados.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-gray-800">{r.titulo}</h2>
              <p className="text-sm text-gray-500">{r.autor}</p>
              <p className="text-sm text-gray-500 mb-3">{r.materia}</p>
                            <a href={r.archivo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Ver / Descargar PDF</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}