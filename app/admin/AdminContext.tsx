'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Admin = {
  id: string
  nombre: string
  puesto: string
  rol: 'control_escolar' | 'maestros'
}

type AdminContextType = {
  admin: Admin | null
  loading: boolean
}

const AdminContext = createContext<AdminContextType>({ admin: null, loading: true })

export function useAdmin() {
  return useContext(AdminContext)
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

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

      // Protección de rutas por rol
      const rutasControlEscolar = ['/admin/alumnos', '/admin/pagos', '/admin/horarios-imagen', '/admin/inscripciones', '/admin/catalogos', '/admin/administradores']
      const rutasMaestros = ['/admin/calificaciones', '/admin/recursos']

      const esRutaControlEscolar = rutasControlEscolar.some((r) => pathname.startsWith(r))
      const esRutaMaestros = rutasMaestros.some((r) => pathname.startsWith(r))

      if (data.rol === 'maestros' && esRutaControlEscolar) {
        router.push('/admin')
        return
      }

      if (data.rol === 'control_escolar' && esRutaMaestros) {
        router.push('/admin')
        return
      }

      setLoading(false)
    }

    verificar()
  }, [pathname])

  return (
    <AdminContext.Provider value={{ admin, loading }}>
      {children}
    </AdminContext.Provider>
  )
}