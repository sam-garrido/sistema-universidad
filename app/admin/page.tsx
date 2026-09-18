'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAdmin } from './AdminContext'

export default function AdminPage() {
  const { admin, loading: adminLoading } = useAdmin()
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    pagosPendientes: 0,
    ingresosMes: 0,
    inscripcionesPendientes: 0,
  })
  const [cicloActual, setCicloActual] = useState('')
  const [loadingStats, setLoadingStats] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!admin) return
    cargarEstadisticas()
    supabase.rpc('ciclo_escolar_actual').then(({ data }) => setCicloActual(data || ''))
  }, [admin])

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
    setLoadingStats(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (adminLoading || !admin) return <p className="p-8">Cargando...</p>

  const esControlEscolar = admin.rol === 'control_escolar'
  const esMaestro = admin.rol === 'maestros'

  const secciones = [
    esControlEscolar && { nombre: 'Alumnos', href: '/admin/alumnos' },
    esControlEscolar && { nombre: 'Pagos', href: '/admin/pagos' },
    esControlEscolar && { nombre: 'Horarios (Imagen)', href: '/admin/horarios-imagen' },
    esControlEscolar && { nombre: 'Inscripciones', href: '/admin/inscripciones' },
    esControlEscolar && { nombre: 'Catálogos (Materias/Carreras)', href: '/admin/catalogos' },
    esControlEscolar && { nombre: 'Administradores', href: '/admin/administradores' },
    esMaestro && { nombre: 'Calificaciones', href: '/admin/calificaciones' },
    esMaestro && { nombre: 'Recursos Bibliográficos', href: '/admin/recursos' },
  ].filter(Boolean) as { nombre: string; href: string }[]

  const tarjetasBase = [
    esControlEscolar && { titulo: 'Total de Alumnos', valor: stats.totalAlumnos, color: 'text-blue-700', href: '/admin/alumnos' },
    esControlEscolar && { titulo: 'Pagos Pendientes', valor: stats.pagosPendientes, color: 'text-orange-600', href: '/admin/pagos' },
    esControlEscolar && { titulo: 'Ingresos del Mes', valor: `$${stats.ingresosMes.toFixed(2)}`, color: 'text-green-600', href: '/admin/pagos' },
    esControlEscolar && { titulo: 'Inscripciones Pendientes', valor: stats.inscripcionesPendientes, color: 'text-purple-600', href: '/admin/inscripciones' },
  ].filter(Boolean) as { titulo: string; valor: string | number; color: string; href: string }[]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-800 text-white px-4 sm:px-8 py-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="h-12 sm:h-16 w-auto" />
          <h1 className="text-lg sm:text-xl font-bold">Panel de Administración</h1>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6">
          <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">Ciclo: {cicloActual}</span>
          <span>{admin.nombre}</span>
          <button onClick={cerrarSesion} className="text-red-400 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="px-4 sm:px-8 pt-6">
        {esControlEscolar ? (
          <p className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
            Bienvenido/a. Desde aquí puedes dar de alta alumnos, registrar pagos e inscripciones,
            actualizar el catálogo de materias y carreras, y administrar a los demás usuarios del sistema.
          </p>
        ) : (
          <p className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
            Bienvenido/a. Desde aquí puedes capturar las calificaciones de tus grupos asignados
            y consultar los recursos bibliográficos disponibles.
          </p>
        )}
      </div>

      {esControlEscolar && !loadingStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-8 pb-0">
          {tarjetasBase.map((t) => (
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
      )}

      <nav className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-8">
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