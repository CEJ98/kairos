/**
 * Mock Service Worker Server Configuration
 * Handles API mocking for testing environment
 */

import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { workoutHandlers } from './handlers/workouts'
import { userHandlers } from './handlers/users'
import { stripeHandlers } from './handlers/stripe'

// Combine all handlers
export const server = setupServer(
  ...authHandlers,
  ...workoutHandlers,
  ...userHandlers,
  ...stripeHandlers,
)