'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function PagosPage() {
  const [pagos, setPagos] = useState<any[]>([])
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
        .eq('estatus', 'pagado')
        .order('fecha_pago', { ascending: false })

      setPagos(data || [])
      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-orange-600 my-4">Historial de Pagos</h1>

      {pagos.length === 0 ? (
        <p className="text-gray-500">Aún no tienes pagos registrados.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-orange-50">
              <tr>
                <th className="p-3">Concepto</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Fecha de pago</th>
                <th className="p-3">Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.concepto}</td>
                  <td className="p-3">${Number(p.monto).toFixed(2)}</td>
                  <td className="p-3">{new Date(p.fecha_pago).toLocaleDateString('es-MX')}</td>
                  <td className="p-3">
                    {p.comprobante_url ? (
                      <a href={p.comprobante_url} target="_blank" className="text-blue-600 hover:underline">
                        Ver / Descargar
                      </a>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
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