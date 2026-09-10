'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    pagosPendientes: 0,
    ingresosMes: 0,
    inscripcionesPendientes: 0,
  })
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
      await cargarEstadisticas()
      setLoading(false)
    }

    verificar()
  }, [])

  const cargarEstadisticas = async () => {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const [
      { count: totalAlumnos },
      { count: pagosPendientes },
      { data: pagosDelMes },
      { count: inscripcionesPendientes },
    ] = await Promise.all([
      supabase.from('alumnos').select('*', { count: 'exact', head: true }),
      supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('estatus', 'pendiente'),
      supabase.from('pagos').select('monto').eq('estatus', 'pagado').gte('fecha_pago', inicioMes.toISOString()),
      supabase.from('inscripciones').select('*', { count: 'exact', head: true }).eq('estatus', 'pendiente'),
    ])

    const ingresosMes = (pagosDelMes || []).reduce((sum, p) => sum + Number(p.monto), 0)

    setStats({
      totalAlumnos: totalAlumnos || 0,
      pagosPendientes: pagosPendientes || 0,
      ingresosMes,
      inscripcionesPendientes: inscripcionesPendientes || 0,
    })
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) return <p className="p-8">Cargando...</p>

  const secciones = [
    { nombre: 'Alumnos', href: '/admin/alumnos' },
    { nombre: 'Pagos', href: '/admin/pagos' },
    { nombre: 'Horarios (Imagen)', href: '/admin/horarios-imagen' },
    { nombre: 'Inscripciones', href: '/admin/inscripciones' },
    { nombre: 'Calificaciones', href: '/admin/calificaciones' },
    { nombre: 'Recursos Bibliográficos', href: '/admin/recursos' },
    { nombre: 'Catálogos (Materias/Carreras)', href: '/admin/catalogos' },
  ]

  const tarjetas = [
    { titulo: 'Total de Alumnos', valor: stats.totalAlumnos, color: 'text-blue-700', href: '/admin/alumnos' },
    { titulo: 'Pagos Pendientes', valor: stats.pagosPendientes, color: 'text-orange-600', href: '/admin/pagos' },
    { titulo: 'Ingresos del Mes', valor: `$${stats.ingresosMes.toFixed(2)}`, color: 'text-green-600', href: '/admin/pagos' },
    { titulo: 'Inscripciones Pendientes', valor: stats.inscripcionesPendientes, color: 'text-purple-600', href: '/admin/inscripciones' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex justify-between items-center bg-gray-800 text-white px-8 py-4">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="h-16 w-auto" />
          <h1 className="text-xl font-bold">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-6">
          <span>{admin?.nombre}</span>
          <button onClick={cerrarSesion} className="text-red-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 pb-0">
        {tarjetas.map((t) => (
          <Link
            key={t.titulo}
            href={t.href}
            className="bg-white rounded-lg shadow p-5 hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500">{t.titulo}</p>
            <p className={`text-2xl font-bold ${t.color}`}>{t.valor}</p>
          </Link>
        ))}
      </div>

      <nav className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8">
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