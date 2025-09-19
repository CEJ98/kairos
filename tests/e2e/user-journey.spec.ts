/**
 * End-to-End User Journey Tests for Kairos Fitness
 * Tests complete user flows from registration to workout completion
 * Enhanced with comprehensive test scenarios and edge cases
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const testUser = {
  name: 'E2E Test User',
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe'
}

const testTrainer = {
  name: 'E2E Test Trainer',
  email: `e2e-trainer-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Jane',
  lastName: 'Trainer'
}

// Test helpers
async function waitForPageLoad(page: Page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout })
}

test.describe('Complete User Journey', () => {
  test.describe.configure({ mode: 'serial' })

  test('User Registration and Profile Setup Flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/')
    await page.click('text=Registrarse')
    
    // Fill registration form
    await page.fill('[name="name"]', testUser.name)
    await page.fill('[name="email"]', testUser.email)
    await page.fill('[name="password"]', testUser.password)
    await page.selectOption('[name="role"]', 'CLIENT')
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Verify successful registration
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Bienvenido')).toBeVisible()
    
    // Complete profile setup
    await page.click('text=Completar Perfil')
    
    // Fill profile information
    await page.fill('[name="age"]', '25')
    await page.fill('[name="weight"]', '70')
    await page.fill('[name="height"]', '175')
    await page.selectOption('[name="gender"]', 'MALE')
    await page.selectOption('[name="fitnessGoal"]', 'MUSCLE_GAIN')
    await page.selectOption('[name="activityLevel"]', 'MODERATE')
    
    // Save profile
    await page.click('button:has-text("Guardar Perfil")')
    
    // Verify profile completion
    await expect(page.locator('text=Perfil completado')).toBeVisible()
  })

  test('Workout Creation and Execution Flow', async ({ page }) => {
    // Login as existing user
    await loginAsUser(page, testUser)
    
    // Navigate to workouts
    await page.click('text=Rutinas')
    await expect(page).toHaveURL('/dashboard/workouts')
    
    // Create new workout
    await page.click('text=Nueva Rutina')
    await expect(page).toHaveURL('/dashboard/workouts/new')
    
    // Fill workout details
    await page.fill('[name="name"]', 'E2E Test Workout')
    await page.fill('[name="description"]', 'A test workout created by E2E tests')
    await page.selectOption('[name="category"]', 'STRENGTH')
    await page.fill('[name="duration"]', '45')
    
    // Add exercises
    await page.click('text=Agregar Ejercicio')
    await page.click('[data-testid="exercise-push-ups"]') // Assuming test data exists
    
    // Configure exercise
    await page.fill('[name="sets"]', '3')
    await page.fill('[name="reps"]', '12')
    await page.fill('[name="restTime"]', '60')
    
    // Add another exercise
    await page.click('text=Agregar Ejercicio')
    await page.click('[data-testid="exercise-squats"]')
    
    // Configure second exercise
    await page.fill('[name="sets"]', '3')
    await page.fill('[name="reps"]', '15')
    await page.fill('[name="restTime"]', '90')
    
    // Save workout
    await page.click('button:has-text("Guardar Rutina")')
    
    // Verify workout created
    await expect(page).toHaveURL('/dashboard/workouts')
    await expect(page.locator('text=E2E Test Workout')).toBeVisible()
    
    // Start workout session
    await page.click('[data-testid="start-workout-button"]')
    await expect(page).toHaveURL(/\/dashboard\/workouts\/.*\/start/)
    
    // Complete first exercise
    await expect(page.locator('text=Push-ups')).toBeVisible()
    await page.click('button:has-text("Completar Serie")')
    await page.click('button:has-text("Completar Serie")')
    await page.click('button:has-text("Completar Serie")')
    
    // Move to next exercise
    await page.click('button:has-text("Siguiente Ejercicio")')
    
    // Complete second exercise
    await expect(page.locator('text=Squats')).toBeVisible()
    await page.click('button:has-text("Completar Serie")')
    await page.click('button:has-text("Completar Serie")')
    await page.click('button:has-text("Completar Serie")')
    
    // Finish workout
    await page.click('button:has-text("Finalizar Rutina")')
    
    // Rate workout
    await page.click('[data-testid="rating-5"]')
    await page.fill('[name="notes"]', 'Great workout!')
    await page.click('button:has-text("Guardar Sesión")')
    
    // Verify workout completion
    await expect(page).toHaveURL('/dashboard/progress')
    await expect(page.locator('text=¡Rutina completada!')).toBeVisible()
  })

  test('Trainer Registration and Client Management', async ({ page }) => {
    // Register as trainer
    await page.goto('/signup')
    
    await page.fill('[name="name"]', testTrainer.name)
    await page.fill('[name="email"]', testTrainer.email)
    await page.fill('[name="password"]', testTrainer.password)
    await page.selectOption('[name="role"]', 'TRAINER')
    
    await page.click('button[type="submit"]')
    
    // Complete trainer profile
    await page.click('text=Completar Perfil')
    
    await page.fill('[name="bio"]', 'Professional fitness trainer with 5 years of experience')
    await page.fill('[name="experience"]', '5')
    await page.fill('[name="hourlyRate"]', '50')
    await page.click('text=Strength Training')
    await page.click('text=Weight Loss')
    
    await page.click('button:has-text("Guardar Perfil")')
    
    // Navigate to trainer dashboard
    await page.click('text=Modo Entrenador')
    await expect(page).toHaveURL('/dashboard/trainer')
    
    // View clients section
    await page.click('text=Clientes')
    await expect(page).toHaveURL('/dashboard/trainer/clients')
    
    // Verify trainer features are available
    await expect(page.locator('text=Gestionar Clientes')).toBeVisible()
    await expect(page.locator('text=Crear Rutina Personalizada')).toBeVisible()
  })

  test('Payment and Subscription Flow', async ({ page }) => {
    // Login as user
    await loginAsUser(page, testUser)
    
    // Navigate to pricing
    await page.goto('/pricing')
    
    // Select Pro plan
    await page.click('[data-testid="select-pro-plan"]')
    
    // Verify checkout page
    await expect(page).toHaveURL('/checkout')
    await expect(page.locator('text=Plan Pro')).toBeVisible()
    await expect(page.locator('text=$19.99')).toBeVisible()
    
    // Note: In a real test environment, you would:
    // 1. Use Stripe test mode
    // 2. Fill payment details with test card numbers
    // 3. Complete the payment flow
    // 4. Verify subscription activation
    
    // For now, we'll just verify the checkout page loads correctly
    await expect(page.locator('[data-testid="stripe-payment-element"]')).toBeVisible()
    await expect(page.locator('button:has-text("Pagar Ahora")')).toBeVisible()
  })

  test('Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test mobile navigation
    await page.goto('/')
    
    // Mobile menu should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Desktop navigation should be hidden
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeHidden()
    
    // Login on mobile
    await loginAsUser(page, testUser)
    
    // Test mobile dashboard
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible()
    
    // Test workout creation on mobile
    await page.click('text=Rutinas')
    await page.click('text=Nueva Rutina')
    
    // Mobile-specific form should be responsive
    const nameField = page.locator('[name="name"]')
    await expect(nameField).toBeVisible()
    
    // Test that form elements are properly sized for mobile
    const fieldBox = await nameField.boundingBox()
    expect(fieldBox?.width).toBeGreaterThan(300)
  })

  test('Accessibility Compliance', async ({ page }) => {
    // Install axe-core for accessibility testing
    await page.addInitScript(() => {
      // @ts-ignore
      window.axe = require('axe-core')
    })
    
    // Test main pages for accessibility
    const pagesToTest = [
      '/',
      '/signin',
      '/signup', 
      '/pricing',
      '/dashboard',
      '/dashboard/workouts'
    ]
    
    for (const pagePath of pagesToTest) {
      await page.goto(pagePath)
      
      // Run accessibility audit
      const accessibilityResults = await page.evaluate(() => {
        // @ts-ignore
        return window.axe.run()
      })
      
      // Check for violations
      expect(accessibilityResults.violations).toEqual([])
    }
  })
})

// Helper functions
async function loginAsUser(page: Page, user: typeof testUser) {
  await page.goto('/signin')
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', user.password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
}

async function logoutUser(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('text=Cerrar Sesión')
  await expect(page).toHaveURL('/')
}