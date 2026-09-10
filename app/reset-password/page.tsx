'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [listoParaCambiar, setListoParaCambiar] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Cuando el alumno llega desde el enlace del correo, Supabase crea una sesión temporal
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setListoParaCambiar(true)
      }
    })

    // Por si el evento ya se disparó antes de montar el listener
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setListoParaCambiar(true)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setGuardando(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(`Error: ${error.message}`)
      setGuardando(false)
      return
    }

    setMensaje('Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4 text-center text-blue-700">Nueva contraseña</h1>

        {!listoParaCambiar && !mensaje && (
          <p className="text-sm text-gray-500 text-center">
            Verificando el enlace de recuperación...
          </p>
        )}

        {listoParaCambiar && !mensaje && (
          <form onSubmit={cambiarPassword}>
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              required
            />
            <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
              required
            />

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800"
            >
              {guardando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {mensaje && <p className="text-sm text-green-600 text-center">{mensaje}</p>}
      </div>
    </div>
  )
}