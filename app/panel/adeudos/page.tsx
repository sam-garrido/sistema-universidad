'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdeudosPage() {
  const [adeudos, setAdeudos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_id', user.id)
        .eq('estatus', 'pendiente')
        .order('fecha_limite', { ascending: true })

      setAdeudos(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) return <p className="p-8">Cargando...</p>

  const total = adeudos.reduce((sum, a) => sum + Number(a.monto), 0)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-red-600 my-4">Adeudos</h1>

      {adeudos.length === 0 ? (
        <p className="text-green-600 font-medium">No tienes adeudos pendientes. ✓</p>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
            <table className="w-full text-left">
              <thead className="bg-red-50">
                <tr>
                  <th className="p-3">Concepto</th>
                  <th className="p-3">Monto</th>
                  <th className="p-3">Fecha límite</th>
                </tr>
              </thead>
              <tbody>
                {adeudos.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.concepto}</td>
                    <td className="p-3">${Number(a.monto).toFixed(2)}</td>
                    <td className="p-3">{a.fecha_limite || 'Sin definir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-right font-bold text-lg">Total: ${total.toFixed(2)}</p>
        </>
      )}
    </div>
  )
}
