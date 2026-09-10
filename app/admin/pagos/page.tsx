'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<any[]>([])
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState('')

  const [form, setForm] = useState({
    alumno_id: '',
    concepto: '',
    monto: '',
    estatus: 'pendiente',
    fecha_limite: '',
    comprobante_url: '',
  })

  const supabase = createClient()

  const cargar = async () => {
    const { data: pagosData } = await supabase
      .from('pagos')
      .select('*, alumnos(nombre, apellido_paterno, matricula)')
      .order('fecha_pago', { ascending: false })

    const { data: alumnosData } = await supabase
      .from('alumnos')
      .select('id, nombre, apellido_paterno, matricula')
      .order('nombre')

    setPagos(pagosData || [])
    setAlumnos(alumnosData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string) => {
    setForm({ ...form, [campo]: valor })
  }

  const registrarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const { error } = await supabase.from('pagos').insert({
      alumno_id: form.alumno_id,
      concepto: form.concepto,
      monto: Number(form.monto),
      estatus: form.estatus,
      fecha_limite: form.fecha_limite || null,
      comprobante_url: form.comprobante_url || null,
    })

    if (error) {
      setMensaje(`Error: ${error.message}`)
    } else {
      setMensaje('Pago registrado correctamente.')
      setForm({ alumno_id: '', concepto: '', monto: '', estatus: 'pendiente', fecha_limite: '', comprobante_url: '' })
      setMostrarForm(false)
      cargar()
    }

    setGuardando(false)
  }

  const marcarComoPagado = async (id: string) => {
    await supabase.from('pagos').update({ estatus: 'pagado', fecha_pago: new Date().toISOString() }).eq('id', id)

    const pago = pagos.find((p) => p.id === id)
    if (pago) {
      await fetch('/api/generar-comprobante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagoId: pago.id,
          alumnoId: pago.alumno_id,
          nombreCompleto: `${pago.alumnos?.nombre} ${pago.alumnos?.apellido_paterno}`,
          matricula: pago.alumnos?.matricula,
          concepto: pago.concepto,
          monto: pago.monto,
          folio: `PAG-${pago.id.slice(0, 8)}`,
        }),
      })
    }

    cargar()
  }

  const pagosFiltrados = pagos.filter((p) => {
    const texto = `${p.alumnos?.matricula || ''} ${p.alumnos?.nombre || ''} ${p.alumnos?.apellido_paterno || ''} ${p.concepto}`.toLowerCase()
    const coincideBusqueda = texto.includes(busqueda.toLowerCase())
    const coincideEstatus = !filtroEstatus || p.estatus === filtroEstatus
    return coincideBusqueda && coincideEstatus
  })

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          {mostrarForm ? 'Cancelar' : '+ Registrar pago / adeudo'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={registrarPago} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1">Concepto</label>
            <input type="text" required value={form.concepto}
              onChange={(e) => actualizarCampo('concepto', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Monto</label>
            <input type="number" step="0.01" required value={form.monto}
              onChange={(e) => actualizarCampo('monto', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estatus</label>
            <select value={form.estatus}
              onChange={(e) => actualizarCampo('estatus', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha límite (si es adeudo)</label>
            <input type="date" value={form.fecha_limite}
              onChange={(e) => actualizarCampo('fecha_limite', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">URL del comprobante (opcional)</label>
            <input type="text" value={form.comprobante_url}
              onChange={(e) => actualizarCampo('comprobante_url', e.target.value)}
              className="w-full border rounded px-3 py-2" placeholder="Link del PDF en Supabase Storage" />
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

      {/* Búsqueda y filtro */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por alumno, matrícula o concepto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Todos los estatus</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Alumno</th>
              <th className="p-3">Concepto</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Estatus</th>
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pagosFiltrados.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.alumnos?.matricula} - {p.alumnos?.nombre} {p.alumnos?.apellido_paterno}</td>
                <td className="p-3">{p.concepto}</td>
                <td className="p-3">${Number(p.monto).toFixed(2)}</td>
                <td className={`p-3 font-medium ${p.estatus === 'pagado' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {p.estatus}
                </td>
                <td className="p-3">
                  {p.estatus === 'pendiente' && (
                    <button onClick={() => marcarComoPagado(p.id)} className="text-blue-600 hover:underline text-sm">
                      Marcar como pagado
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {pagosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No se encontraron pagos con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}