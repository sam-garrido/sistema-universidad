'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data } = await supabase
        .from('administradores')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!data) {
        router.push('/admin/login')
        return
      }

      setAdmin(data)
      setLoading(false)
    }

    verificar()
  }, [])

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return <p className="p-8">Cargando...</p>

    const secciones = [
    { nombre: 'Alumnos', href: '/admin/alumnos' },
    { nombre: 'Pagos', href: '/admin/pagos' },
    { nombre: 'Inscripciones', href: '/admin/inscripciones' },
    { nombre: 'Calificaciones', href: '/admin/calificaciones' },
    { nombre: 'Recursos Bibliográficos', href: '/admin/recursos' },
    { nombre: 'Horarios (Imagen)', href: '/admin/horarios-imagen' },
    { nombre: 'Catálogos (Materias/Carreras)', href: '/admin/catalogos' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
            <header className="flex justify-between items-center bg-gray-800 text-white px-8 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="h-22 w-auto" />
          <h1 className="text-xl font-bold">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-6">
          <span>{admin?.nombre}</span>
          <button onClick={cerrarSesion} className="text-red-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav className="grid grid-cols-2 md:grid-cols-5 gap-4 p-8">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-lg shadow p-6 text-center font-semibold text-gray-700 hover:shadow-md transition"
          >
            {s.nombre}
          </Link>
        ))}
      </nav>
    </div>
  )
}