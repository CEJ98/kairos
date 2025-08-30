/**
 * Mock handlers for user endpoints
 */

import { http, HttpResponse } from 'msw'

const mockUsers = [
  {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CLIENT',
    avatar: null,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trainer-id',
    email: 'trainer@example.com',
    name: 'Test Trainer',
    role: 'TRAINER',
    avatar: null,
    isVerified: true,
    createdAt: new Date().toISOString(),
  },
]

export const userHandlers = [
  // Get user profile
  http.get('/api/users/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json(mockUsers[0])
  }),

  // Update user profile
  http.put('/api/users/profile', async ({ request }) => {
    const body = await request.json() as any
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const updatedUser = { ...mockUsers[0], ...body }
    return HttpResponse.json(updatedUser)
  }),

  // Get user by ID
  http.get('/api/users/:id', ({ params }) => {
    const user = mockUsers.find(u => u.id === params.id)
    
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Remove sensitive information
    const { ...publicUser } = user
    return HttpResponse.json(publicUser)
  }),
]