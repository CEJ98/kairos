import Link from 'next/link'

export default function LocalizedSignUpTrainerPlaceholder() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign Up - Trainer</h1>
      <p className="mb-4">Placeholder de registro para entrenadores.</p>
      <div className="flex gap-4">
        <Link href="/signin" className="underline">Ir a Iniciar sesión</Link>
        <Link href="/" className="underline">Inicio</Link>
      </div>
    </main>
  )
}

