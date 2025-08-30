import Link from 'next/link'
import { Dumbbell } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 gradient-bg">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center gap-3 mb-8">
            <Dumbbell className="h-12 w-12 text-white" />
            <span className="text-4xl font-bold text-white">Kairos</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-4">
            Tu fitness journey comienza aquí
          </h2>
          <p className="text-xl text-green-100 max-w-md mx-auto">
            Únete a miles de usuarios que ya están transformando sus vidas con rutinas personalizadas
          </p>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Dumbbell className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">Kairos</span>
            </Link>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  )
}