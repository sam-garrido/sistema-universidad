'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminAlumnosPage() {
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    matricula: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    carrera: '',
    semestre: 1,
  })

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase.from('alumnos').select('*').order('created_at', { ascending: false })
    setAlumnos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string | number) => {
    setForm({ ...form, [campo]: valor })
  }

  const crearAlumno = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    const res = await fetch('/api/admin/crear-alumno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setMensaje(`Error: ${data.error}`)
    } else {
      setMensaje('Alumno creado correctamente.')
      setForm({
        email: '', password: '', matricula: '', nombre: '',
        apellido_paterno: '', apellido_materno: '', carrera: '', semestre: 1,
      })
      setMostrarForm(false)
      cargar()
    }

    setGuardando(false)
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo alumno'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={crearAlumno} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Correo</label>
            <input type="email" required value={form.email}
              onChange={(e) => actualizarCampo('email', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input type="text" required value={form.password}
              onChange={(e) => actualizarCampo('password', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Matrícula</label>
            <input type="text" required value={form.matricula}
              onChange={(e) => actualizarCampo('matricula', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Semestre</label>
            <input type="number" required min={1} value={form.semestre}
              onChange={(e) => actualizarCampo('semestre', Number(e.target.value))}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input type="text" required value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellido paterno</label>
            <input type="text" required value={form.apellido_paterno}
              onChange={(e) => actualizarCampo('apellido_paterno', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellido materno</label>
            <input type="text" value={form.apellido_materno}
              onChange={(e) => actualizarCampo('apellido_materno', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Carrera</label>
            <input type="text" required value={form.carrera}
              onChange={(e) => actualizarCampo('carrera', e.target.value)}
              className="w-full border rounded px-3 py-2" />
          </div>

          <div className="col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              {guardando ? 'Guardando...' : 'Guardar alumno'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">Matrícula</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Carrera</th>
              <th className="p-3">Semestre</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.matricula}</td>
                <td className="p-3">{a.nombre} {a.apellido_paterno} {a.apellido_materno}</td>
                <td className="p-3">{a.carrera}</td>
                <td className="p-3">{a.semestre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}