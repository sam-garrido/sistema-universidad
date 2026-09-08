'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function PanelPage() {
  const [alumno, setAlumno] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('alumnos')
        .select('*')
        .eq('id', user.id)
        .single()

      setAlumno(data)
      setLoading(false)
    }

    cargarDatos()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const accesos = [
    { nombre: 'Horario de Clases', href: '/panel/horario', color: 'text-green-600' },
    { nombre: 'Adeudos', href: '/panel/adeudos', color: 'text-red-500' },
    { nombre: 'Pagos', href: '/panel/pagos', color: 'text-orange-500' },
    { nombre: 'Inscripciones', href: '/panel/inscripciones', color: 'text-purple-600' },
    { nombre: 'Recursos Bibliográficos', href: '/panel/recursos', color: 'text-blue-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex justify-between items-center bg-white shadow px-8 py-4">
        <h1 className="text-2xl font-bold text-blue-700">Portal de Alumnos</h1>
        <div className="flex items-center gap-6">
          <span className="text-gray-700">
            {alumno ? `${alumno.nombre} ${alumno.apellido_paterno}` : ''}
          </span>
          <button onClick={cerrarSesion} className="text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="grid grid-cols-2 md:grid-cols-5 gap-4 p-8">
        {accesos.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="bg-white rounded-lg shadow p-6 text-center hover:shadow-md transition"
          >
            <p className={`font-semibold ${a.color}`}>{a.nombre}</p>
          </Link>
        ))}
      </nav>

      {alumno && (
        <div className="mx-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2">Mi información</h2>
          <p><strong>Nombre:</strong> {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}</p>
          <p><strong>Matrícula:</strong> {alumno.matricula}</p>
          <p><strong>Carrera:</strong> {alumno.carrera}</p>
          <p><strong>Semestre:</strong> {alumno.semestre}</p>
        </div>
      )}
    </div>
  )
}