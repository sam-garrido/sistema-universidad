'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const DATOS_BANCARIOS = {
  banco: 'Banco de Ejemplo',
  titular: 'Universidad Ejemplo A.C.',
  cuenta: '0123456789',
  clabe: '012180001234567895',
}

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<any[]>([])
  const [alumno, setAlumno] = useState<any>(null)
  const [costo, setCosto] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [referencia, setReferencia] = useState('')
  const [ficha, setFicha] = useState<File | null>(null)

    const router = useRouter()
  const supabase = createClient()

    const cargar = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: alumnoData } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id', user.id)
      .single()

    setAlumno(alumnoData)

    const siguienteSemestre = (alumnoData?.semestre || 1) + 1
    const { data: costoData } = await supabase
      .from('costos_inscripcion')
      .select('monto')
      .eq('semestre', siguienteSemestre)
      .single()

    setCosto(costoData?.monto ?? null)

    const { data: inscripcionesData } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('alumno_id', user.id)
      .order('fecha_inscripcion', { ascending: false })

    setInscripciones(inscripcionesData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const enviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ficha) {
      setMensaje('Sube la foto o PDF de tu ficha de depósito.')
      return
    }
    if (!referencia.trim()) {
      setMensaje('Escribe el número de referencia bancaria.')
      return
    }

    setEnviando(true)
    setMensaje('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !alumno) return

    // 1. Subir la ficha de depósito a una carpeta con el UID del alumno
    const nombreArchivo = `${user.id}/${Date.now()}-${ficha.name}`
    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(nombreArchivo, ficha)

    if (uploadError) {
      setMensaje(`Error al subir la ficha: ${uploadError.message}`)
      setEnviando(false)
      return
    }

    // 2. Generar folio único
    const folio = `INS-${alumno.matricula}-${Date.now()}`
    const siguienteSemestre = (alumno.semestre || 1) + 1

    // 3. Registrar la solicitud de inscripción
    const { error } = await supabase.from('inscripciones').insert({
      alumno_id: user.id,
      ciclo_escolar: '2026-2027 B',
      semestre: siguienteSemestre,
      estatus: 'pendiente',
      folio,
      numero_referencia: referencia,
      ficha_deposito_url: nombreArchivo,
      monto: costo,
    })

    if (error) {
      setMensaje(`Error al registrar la solicitud: ${error.message}`)
    } else {
      setMensaje(`Solicitud enviada. Tu folio es: ${folio}. Está pendiente de verificación.`)
      setReferencia('')
      setFicha(null)
      setMostrarForm(false)
      cargar()
    }

    setEnviando(false)
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const colorEstatus = (estatus: string) => {
    if (estatus === 'confirmada') return 'text-green-600'
    if (estatus === 'cancelada') return 'text-red-600'
    return 'text-yellow-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/panel" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <h1 className="text-2xl font-bold text-purple-700 my-4">Inscripciones</h1>

      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        className="mb-6 bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
      >
        {mostrarForm ? 'Cancelar' : 'Solicitar inscripción / reinscripción'}
      </button>

      {mostrarForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 max-w-lg">
          <h2 className="font-bold mb-3">Datos para tu depósito</h2>
          <div className="bg-purple-50 rounded p-4 mb-4 text-sm space-y-1">
            <p><strong>Banco:</strong> {DATOS_BANCARIOS.banco}</p>
            <p><strong>A nombre de:</strong> {DATOS_BANCARIOS.titular}</p>
            <p><strong>Cuenta:</strong> {DATOS_BANCARIOS.cuenta}</p>
            <p><strong>CLABE:</strong> {DATOS_BANCARIOS.clabe}</p>
            <p><strong>Monto a depositar:</strong> {costo != null ? `$${Number(costo).toFixed(2)}` : 'No definido, contacta a la escuela'}</p>
          </div>

          <form onSubmit={enviarSolicitud} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número de referencia del depósito</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ficha de depósito (foto o PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFicha(e.target.files?.[0] || null)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            {mensaje && <p className="text-sm text-gray-700">{mensaje}</p>}
            <button
              type="submit"
              disabled={enviando}
              className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800"
            >
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </div>
      )}

      {inscripciones.length === 0 ? (
        <p className="text-gray-500">No tienes inscripciones registradas.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-purple-50">
              <tr>
                <th className="p-3">Folio</th>
                <th className="p-3">Ciclo escolar</th>
                <th className="p-3">Semestre</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Estatus</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {inscripciones.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="p-3 text-xs">{i.folio}</td>
                  <td className="p-3">{i.ciclo_escolar}</td>
                  <td className="p-3">{i.semestre}</td>
                  <td className="p-3">{i.monto ? `$${Number(i.monto).toFixed(2)}` : '-'}</td>
                  <td className={`p-3 font-medium ${colorEstatus(i.estatus)}`}>{i.estatus}</td>
                  <td className="p-3">{new Date(i.fecha_inscripcion).toLocaleDateString('es-MX')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}