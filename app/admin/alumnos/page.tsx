'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminAlumnosPage() {
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [carreras, setCarreras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const formVacio = {
    email: '',
    password: '',
    matricula: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    carrera: '',
    semestre: 1,
  }

  const [form, setForm] = useState(formVacio)

  const supabase = createClient()

  const cargar = async () => {
    const { data } = await supabase.from('alumnos').select('*').order('created_at', { ascending: false })
    const { data: carrerasData } = await supabase.from('carreras').select('*').order('nombre')
    setAlumnos(data || [])
    setCarreras(carrerasData || [])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const actualizarCampo = (campo: string, valor: string | number) => {
    setForm({ ...form, [campo]: valor })
  }

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(formVacio)
    setMensaje('')
    setMostrarForm(true)
  }

  const abrirEditar = (alumno: any) => {
    setEditandoId(alumno.id)
    setForm({
      email: '', // no editable aquí, el correo se gestiona desde Authentication
      password: '',
      matricula: alumno.matricula,
      nombre: alumno.nombre,
      apellido_paterno: alumno.apellido_paterno,
      apellido_materno: alumno.apellido_materno || '',
      carrera: alumno.carrera,
      semestre: alumno.semestre,
    })
    setMensaje('')
    setMostrarForm(true)
  }

  const guardarAlumno = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setMensaje('')

    if (editandoId) {
      // Modo edición: solo actualizamos el perfil, no el correo/contraseña
      const { error } = await supabase
        .from('alumnos')
        .update({
          matricula: form.matricula,
          nombre: form.nombre,
          apellido_paterno: form.apellido_paterno,
          apellido_materno: form.apellido_materno,
          carrera: form.carrera,
          semestre: form.semestre,
        })
        .eq('id', editandoId)

      if (error) {
        setMensaje(`Error: ${error.message}`)
      } else {
        setMensaje('Alumno actualizado correctamente.')
        setMostrarForm(false)
        setEditandoId(null)
        cargar()
      }
    } else {
      // Modo alta: crea usuario + perfil vía API route
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
        setMostrarForm(false)
        cargar()
      }
    }

    setGuardando(false)
  }

  const eliminarAlumno = async (id: string, nombreCompleto: string) => {
    const confirmar = confirm(`¿Seguro que quieres eliminar a ${nombreCompleto}? Esta acción no se puede deshacer.`)
    if (!confirmar) return

    const res = await fetch('/api/admin/eliminar-alumno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumnoId: id }),
    })

    const data = await res.json()

    if (!res.ok) {
      alert(`Error al eliminar: ${data.error}`)
    } else {
      cargar()
    }
  }

  if (loading) return <p className="p-8">Cargando...</p>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Link href="/admin" className="text-blue-600 hover:underline">← Volver al panel</Link>
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <button
          onClick={mostrarForm ? () => setMostrarForm(false) : abrirNuevo}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo alumno'}
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={guardarAlumno} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-bold text-gray-700">
            {editandoId ? 'Editar alumno' : 'Nuevo alumno'}
          </h2>

          {!editandoId && (
            <>
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
            </>
          )}

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
            <select required value={form.carrera}
              onChange={(e) => actualizarCampo('carrera', e.target.value)}
              className="w-full border rounded px-3 py-2">
              <option value="">Selecciona una carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            {mensaje && <p className="text-sm mb-2 text-gray-700">{mensaje}</p>}
            <button type="submit" disabled={guardando}
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar alumno'}
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
              <th className="p-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.matricula}</td>
                <td className="p-3">{a.nombre} {a.apellido_paterno} {a.apellido_materno}</td>
                <td className="p-3">{a.carrera}</td>
                <td className="p-3">{a.semestre}</td>
                <td className="p-3 space-x-3">
                  <button onClick={() => abrirEditar(a)} className="text-blue-600 hover:underline text-sm">
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarAlumno(a.id, `${a.nombre} ${a.apellido_paterno}`)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
