'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  const enviarCorreo = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setMensaje('')
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Ocurrió un error. Verifica tu correo e intenta de nuevo.')
    } else {
      setMensaje('Si el correo existe en nuestro sistema, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).')
    }

    setEnviando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={enviarCorreo} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4 text-center text-blue-700">Recuperar contraseña</h1>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <label className="block text-sm font-medium mb-1">Correo</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          required
        />

        {mensaje && <p className="text-sm text-green-600 mb-4">{mensaje}</p>}
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800"
        >
          {enviando ? 'Enviando...' : 'Enviar enlace'}
        </button>

        <p className="text-center mt-4">
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </div>
  )
}