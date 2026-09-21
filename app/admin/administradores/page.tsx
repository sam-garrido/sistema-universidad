'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Administrador = {
  id: string
  nombre: string
  puesto: string
  rol: 'control_escolar' | 'maestros'
  created_at: string
}

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Administrador[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    nombre: '',
    puesto: '',
    rol: 'control_escolar',
  })

  const supabase = createClient()

  const cargarAdmins = async () => {
    const { data } = await supabase
      .from('administradores')
      .select('*')
      .order('created_at', { ascending: false })
    setAdmins(data || [])
    setLoading(false)
  }

  useEffect(() => {
    cargarAdmins()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    setExito('')

    const res = await fetch('/api/admin/crear-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Ocurrió un error')
      setGuardando(false)
      return
    }

    setExito('Administrador creado correctamente')
    setForm({ email: '', password: '', nombre: '', puesto: '', rol: 'control_escolar' })
    setGuardando(false)
    cargarAdmins()
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Administradores</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8 space-y-4">
        <h2 className="font-semibold text-lg">Nuevo administrador</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Puesto</label>
          <input
            type="text"
            value={form.puesto}
            onChange={(e) => setForm({ ...form, puesto: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="control_escolar">Control Escolar</option>
            <option value="maestros">Maestros</option>
          </select>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {exito && <p className="text-green-600 text-sm">{exito}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full sm:w-auto"
        >
          {guardando ? 'Creando...' : 'Crear administrador'}
        </button>
      </form>

      <h2 className="font-semibold text-lg mb-3">Administradores actuales</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-left min-w-[560px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Puesto</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.nombre}</td>
                  <td className="p-3">{a.puesto}</td>
                  <td className="p-3">{a.rol === 'control_escolar' ? 'Control Escolar' : 'Maestros'}</td>
                  <td className="p-3 whitespace-nowrap">
                    {a.rol === 'maestros' && (
                      <Link
                        href={`/admin/administradores/${a.id}/asignaciones`}
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Asignar materias
                      </Link>
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