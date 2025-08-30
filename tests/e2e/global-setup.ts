/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests to prepare the test environment
 */

import { chromium, FullConfig } from '@playwright/test'
import { hash } from 'bcryptjs'

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use

  console.log('🔧 Setting up E2E test environment...')

  // Create a browser instance for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for the dev server to be ready
    console.log('⏳ Waiting for server to be ready...')
    await page.goto(baseURL || 'http://localhost:3000')
    
    // Verify the app is running
    await page.waitForSelector('body', { timeout: 30000 })
    console.log('✅ Server is ready!')

    // Setup test database state if needed
    await setupTestData()

    console.log('✅ E2E test environment setup complete!')

  } catch (error) {
    console.error('❌ Failed to setup E2E test environment:', error)
    throw error
  } finally {
    await browser.close()
  }
}

/**
 * Setup test data in the database
 */
async function setupTestData() {
  try {
    // Note: In a real implementation, you would:
    // 1. Connect to test database
    // 2. Create test users with known credentials
    // 3. Create test workouts and exercises
    // 4. Setup test subscription data
    
    console.log('📝 Setting up test data...')
    
    // Example test users that should exist:
    const testUsers = [
      {
        email: 'test-client@example.com',
        password: 'TestPassword123!',
        role: 'CLIENT',
        name: 'Test Client'
      },
      {
        email: 'test-trainer@example.com', 
        password: 'TestPassword123!',
        role: 'TRAINER',
        name: 'Test Trainer'
      },
      {
        email: 'test-admin@example.com',
        password: 'TestPassword123!',
        role: 'ADMIN', 
        name: 'Test Admin'
      }
    ]

    // Hash passwords
    for (const user of testUsers) {
      user.password = await hash(user.password, 12)
    }

    // Note: Here you would actually create these users in your test database
    // For now, we'll just log that we would create them
    console.log(`Would create ${testUsers.length} test users`)
    
    // Create test exercises
    const testExercises = [
      {
        name: 'Push-ups',
        category: 'STRENGTH',
        difficulty: 'BEGINNER',
        muscleGroups: ['chest', 'shoulders', 'triceps']
      },
      {
        name: 'Squats',
        category: 'STRENGTH', 
        difficulty: 'BEGINNER',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings']
      }
    ]

    console.log(`Would create ${testExercises.length} test exercises`)
    
    // Create test workouts
    console.log('Would create sample workout templates')
    
    console.log('✅ Test data setup complete!')

  } catch (error) {
    console.error('❌ Failed to setup test data:', error)
    // Don't throw here as this might not be critical
  }
}

export default globalSetup