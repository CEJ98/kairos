/*
  Simple smoke tester for key routes.
  Usage: BASE_URL=http://localhost:3000 npm run smoke
*/

type Result = {
  route: string
  status: number
  redirected: boolean
  location?: string | null
  ok: boolean
  note?: string
}

const BASE_URL = process.env.BASE_URL || process.env.SMOKE_BASE_URL || 'http://localhost:3000'
const ROUTES = ['/', '/signin', '/signup', '/dashboard', '/dashboard/workouts']

function withTimeout<T>(p: Promise<T>, ms = 8000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  // @ts-ignore
  return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), ms))]).finally(() => clearTimeout(t))
}

async function check(route: string): Promise<Result> {
  try {
    const res = (await withTimeout(
      fetch(new URL(route, BASE_URL), { redirect: 'manual' })
    )) as Response

    const status = res.status
    const isRedirect = status >= 300 && status < 400
    const location = res.headers.get('location')

    // Accept 200 OK or any redirect for smoke purposes
    const ok = status === 200 || isRedirect
    const note = isRedirect ? `redirect -> ${location || ''}` : 'ok'

    return { route, status, redirected: isRedirect, location, ok, note }
  } catch (err: any) {
    return { route, status: -1, redirected: false, ok: false, note: err?.message || 'error' }
  }
}

async function main() {
  console.log(`Smoke test against: ${BASE_URL}`)
  const results = [] as Result[]

  for (const r of ROUTES) {
    const res = await check(r)
    results.push(res)
  }

  // Report
  console.log('\nRoute                Status   Note')
  console.log('-----------------------------------------')
  for (const r of results) {
    const padRoute = r.route.padEnd(20)
    const padStatus = String(r.status).padEnd(8)
    console.log(`${padRoute} ${padStatus} ${r.note || ''}`)
  }

  const failed = results.filter(r => !r.ok)
  console.log('\nSummary:')
  console.log(`  Passed: ${results.length - failed.length}`)
  console.log(`  Failed: ${failed.length}`)

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main()

