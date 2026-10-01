'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useAdmin } from '../AdminContext'

type Administrador = {
  id: string
  nombre: string
  puesto: string
  rol: 'control_escolar' | 'maestros'
  created_at: string
}

export default function AdministradoresPage() {
  const { admin: miAdmin } = useAdmin()
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

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', puesto: '', rol: 'control_escolar' })
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')

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

  const abrirEdicion = (a: Administrador) => {
    setEditandoId(a.id)
    setEditForm({ nombre: a.nombre, puesto: a.puesto || '', rol: a.rol })
    setErrorEdicion('')
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setErrorEdicion('')
  }

  const guardarEdicion = async (id: string) => {
    setGuardandoEdicion(true)
    setErrorEdicion('')

    const res = await fetch('/api/admin/editar-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorEdicion(data.error || 'No se pudo guardar el cambio.')
      setGuardandoEdicion(false)
      return
    }

    setEditandoId(null)
    setGuardandoEdicion(false)
    cargarAdmins()
  }

  const eliminarAdmin = async (a: Administrador) => {
    const confirmar = confirm(`¿Eliminar a ${a.nombre}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const res = await fetch('/api/admin/eliminar-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(`No se pudo eliminar: ${data.error}`)
    } else {
      cargarAdmins()
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Administradores</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Nuevo administrador</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="sm:col-span-2">
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
        </div>

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        {exito && <p className="text-green-600 text-sm mt-4">{exito}</p>}

        <button
          type="submit"
          disabled={guardando}
          className="mt-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 w-full sm:w-auto"
        >
          {guardando ? 'Creando...' : 'Crear administrador'}
        </button>
      </form>

      <h2 className="font-semibold text-lg mb-3">Administradores actuales</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : admins.length === 0 ? (
        <p className="text-gray-500">Aún no hay administradores registrados.</p>
      ) : (
        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-4">
              {editandoId === a.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Puesto</label>
                    <input
                      type="text"
                      value={editForm.puesto}
                      onChange={(e) => setEditForm({ ...editForm, puesto: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Rol</label>
                    <select
                      value={editForm.rol}
                      onChange={(e) => setEditForm({ ...editForm, rol: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="control_escolar">Control Escolar</option>
                      <option value="maestros">Maestros</option>
                    </select>
                  </div>
                  {errorEdicion && <p className="text-red-600 text-sm">{errorEdicion}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => guardarEdicion(a.id)}
                      disabled={guardandoEdicion}
                      className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 flex-1 sm:flex-none"
                    >
                      {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 flex-1 sm:flex-none"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{a.nombre}</p>
                    <p className="text-sm text-gray-500">{a.puesto || 'Sin puesto especificado'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full ${
                        a.rol === 'control_escolar'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {a.rol === 'control_escolar' ? 'Control Escolar' : 'Maestros'}
                    </span>
                    {a.rol === 'maestros' && (
                      <Link
                        href={`/admin/administradores/${a.id}/asignaciones`}
                        className="text-blue-600 hover:underline text-sm font-medium whitespace-nowrap"
                      >
                        Asignar materias
                      </Link>
                    )}
                    <button
                      onClick={() => abrirEdicion(a)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      Editar
                    </button>
                    {a.id !== miAdmin?.id && (
                      <button
                        onClick={() => eliminarAdmin(a)}
                        className="text-red-600 hover:underline text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}