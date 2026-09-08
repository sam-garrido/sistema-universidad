'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase
      .from('inscripciones')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('fecha_inscripcion', { ascending: false })

    setInscripciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const verFicha = async (rutaArchivo: string) => {
    const { data, error } = await supabase.storage
      .from('comprobantes')
      .createSignedUrl(rutaArchivo, 60) // enlace válido por 60 segundos

    if (error || !data) {
      alert('No se pudo abrir la ficha de depósito.')
      return
    }

    window.open(data.signedUrl, '_blank')
  }

    const actualizarEstatus = async (id: string, nuevoEstatus: string, alumnoId: string, semestre: number, concepto: string, monto: number, nombreCompleto: string, matricula: string, folio: string) => {
    await supabase.from('inscripciones').update({ estatus: nuevoEstatus }).eq('id', id)

    if (nuevoEstatus === 'confirmada') {
      await supabase.from('alumnos').update({ semestre }).eq('id', alumnoId)

      const { data: pagoInsertado, error } = await supabase
        .from('pagos')
        .insert({
          alumno_id: alumnoId,
          concepto,
          monto,
          estatus: 'pagado',
          fecha_pago: new Date().toISOString(),
        })
        .select()
        .single()

      if (!error && pagoInsertado) {
        await fetch('/api/generar-comprobante', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagoId: pagoInsertado.id,
            alumnoId,
            nombreCompleto,
            matricula,
            concepto,
            monto,
            folio,
          }),
        })
      }
    }

    cargar()
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const colorEstatus = (estatus: string) => {
    if (estatus === 'confirmada') return 'text-green-600'
    if (estatus === 'cancelada') return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold my-4">Gestión de Inscripciones</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Folio</th>
              <th className="p-3">Alumno</th>
              <th className="p-3">Ciclo / Semestre</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Referencia</th>
              <th className="p-3">Ficha</th>
              <th className="p-3">Estatus</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-3 text-xs">{i.folio || '-'}</td>
                <td className="p-3">{i.alumnos?.matricula} - {i.alumnos?.nombre} {i.alumnos?.apellido_paterno}</td>
                <td className="p-3">{i.ciclo_escolar} / {i.semestre}</td>
                <td className="p-3">{i.monto ? `$${Number(i.monto).toFixed(2)}` : '-'}</td>
                <td className="p-3 text-xs">{i.numero_referencia || '-'}</td>
                <td className="p-3">
                  {i.ficha_deposito_url ? (
                    <button onClick={() => verFicha(i.ficha_deposito_url)} className="text-blue-600 hover:underline text-sm">
                      Ver ficha
                    </button>
                  ) : '-'}
                </td>
                <td className={`p-3 font-medium ${colorEstatus(i.estatus)}`}>{i.estatus}</td>
                <td className="p-3 space-x-3">
                  {i.estatus === 'pendiente' && (
                    <>
                                            <button
                        onClick={() => actualizarEstatus(i.id, 'confirmada', i.alumno_id, i.semestre, `Inscripción ${i.ciclo_escolar}`, i.monto, `${i.alumnos?.nombre} ${i.alumnos?.apellido_paterno}`, i.alumnos?.matricula, i.folio)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => actualizarEstatus(i.id, 'cancelada', i.alumno_id, i.semestre, '', 0, '', '', '')}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}