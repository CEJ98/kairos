import { Card, CardContent } from '@/components/ui/card'

type WorkoutRow = {
  id: string
  name: string
  createdAt: string | Date
}

export function WorkoutTable({ rows }: { rows: WorkoutRow[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 text-gray-900">{w.name}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(w.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                    No hay rutinas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

