/**
 * Mock handlers for authentication endpoints
 */

import { http, HttpResponse } from 'msw'

export const authHandlers = [
  // Registration endpoint
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as any
    
    // Simulate validation errors
    if (!body.email) {
      return HttpResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }
    
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Ya existe una cuenta con este email' },
        { status: 400 }
      )
    }
    
    // Simulate successful registration
    return HttpResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user: {
          id: 'test-user-id',
          email: body.email,
          name: body.name,
          role: body.role || 'CLIENT',
        },
      },
      { status: 201 }
    )
  }),

  // NextAuth session endpoint
  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CLIENT',
      },
    })
  }),

  // Rate limiting test endpoint
  http.get('/api/auth/test-rate-limit', () => {
    return HttpResponse.json({ success: true })
  }),
]