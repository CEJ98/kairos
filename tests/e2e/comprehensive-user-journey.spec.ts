/**
 * Comprehensive End-to-End User Journey Tests for Kairos Fitness
 * Tests advanced user flows, edge cases, and error scenarios
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Enhanced test data with more realistic scenarios
const testUsers = {
  newUser: {
    email: `newuser-${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    firstName: 'Alex',
    lastName: 'Johnson',
    age: '28',
    weight: '75',
    height: '180',
    fitnessLevel: 'intermediate'
  },
  existingUser: {
    email: 'existing-user@example.com',
    password: 'ExistingPassword123!',
    firstName: 'Maria',
    lastName: 'Garcia'
  },
  trainerUser: {
    email: `trainer-${Date.now()}@example.com`,
    password: 'TrainerPassword123!',
    firstName: 'Coach',
    lastName: 'Wilson',
    bio: 'Certified personal trainer with 8 years experience',
    specializations: ['strength', 'weight-loss', 'bodybuilding']
  }
}

// Test fixtures and helpers
async function createUserAccount(page: Page, userData: typeof testUsers.newUser) {
  await page.goto('/auth/register')
  
  await page.fill('[name="firstName"]', userData.firstName)
  await page.fill('[name="lastName"]', userData.lastName)
  await page.fill('[name="email"]', userData.email)
  await page.fill('[name="password"]', userData.password)
  await page.check('[name="acceptTerms"]')
  
  await page.click('button[type="submit"]')
}

async function signInUser(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/auth/signin')
  
  await page.fill('[name="email"]', credentials.email)
  await page.fill('[name="password"]', credentials.password)
  
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

async function completeOnboarding(page: Page, preferences: any) {
  await page.waitForURL('**/onboarding')
  
  // Personal information
  await page.fill('[name="age"]', preferences.age)
  await page.fill('[name="weight"]', preferences.weight)
  await page.fill('[name="height"]', preferences.height)
  await page.click('[data-testid="next-step"]')
  
  // Fitness level
  await page.click(`[data-testid="fitness-level-${preferences.fitnessLevel}"]`)
  await page.click('[data-testid="next-step"]')
  
  // Goals selection
  await page.check('[data-testid="goal-weight-loss"]')
  await page.check('[data-testid="goal-muscle-gain"]')
  await page.click('[data-testid="next-step"]')
  
  // Preferences
  await page.selectOption('[name="workoutFrequency"]', '4')
  await page.selectOption('[name="sessionDuration"]', '45')
  await page.selectOption('[name="preferredTime"]', 'morning')
  
  await page.click('[data-testid="complete-onboarding"]')
  await page.waitForURL('**/dashboard')
}

test.describe('Comprehensive User Journey Tests', () => {
  test.describe('Advanced Registration & Authentication', () => {
    test('should handle complete new user registration with email verification', async ({ page }) => {
      await test.step('Register new user account', async () => {
        await createUserAccount(page, testUsers.newUser)
        
        // Should show verification required message
        await expect(page.locator('[data-testid="email-verification-required"]')).toBeVisible()
        await expect(page.locator('text=Please check your email')).toBeVisible()
      })

      await test.step('Handle email verification simulation', async () => {
        // In real tests, you'd integrate with email service
        // For demo, we'll simulate clicking verification link
        await page.goto(`/auth/verify-email?token=mock-token&email=${testUsers.newUser.email}`)
        
        await expect(page.locator('[data-testid="email-verified"]')).toBeVisible()
        await page.click('[data-testid="proceed-to-onboarding"]')
      })

      await test.step('Complete comprehensive onboarding', async () => {
        await completeOnboarding(page, testUsers.newUser)
        
        // Verify dashboard shows personalized content
        await expect(page.locator('[data-testid="personalized-dashboard"]')).toBeVisible()
        await expect(page.locator(`text=Welcome, ${testUsers.newUser.firstName}!`)).toBeVisible()
      })

      await test.step('Verify user preferences are saved', async () => {
        await page.click('[data-testid="user-settings"]')
        
        await expect(page.locator('[data-testid="saved-fitness-level"]')).toContainText('intermediate')
        await expect(page.locator('[data-testid="saved-goals"]')).toContainText('Weight Loss')
        await expect(page.locator('[data-testid="saved-goals"]')).toContainText('Muscle Gain')
      })
    })

    test('should handle social authentication flow', async ({ page }) => {
      await page.goto('/auth/signin')
      
      await test.step('Initiate Google OAuth', async () => {
        // Mock OAuth response
        await page.route('**/api/auth/oauth/google', (route) => {
          route.fulfill({
            status: 302,
            headers: {
              'Location': 'https://accounts.google.com/oauth/authorize?...'
            }
          })
        })
        
        await page.click('[data-testid="google-signin"]')
      })

      await test.step('Handle OAuth callback', async () => {
        // Simulate successful OAuth return
        await page.goto('/auth/callback/google?code=mock-code&state=mock-state')
        
        // Should either redirect to dashboard or onboarding
        const url = page.url()
        expect(url).toMatch(/\/(dashboard|onboarding)/)
      })
    })

    test('should handle multi-factor authentication setup', async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Access security settings', async () => {
        await page.click('[data-testid="user-menu"]')
        await page.click('[data-testid="security-settings"]')
        
        await expect(page.locator('[data-testid="security-dashboard"]')).toBeVisible()
      })

      await test.step('Enable 2FA', async () => {
        await page.click('[data-testid="enable-2fa"]')
        
        // Should show QR code for authenticator app
        await expect(page.locator('[data-testid="2fa-qr-code"]')).toBeVisible()
        await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible()
        
        // Simulate entering verification code
        await page.fill('[name="verificationCode"]', '123456')
        await page.click('[data-testid="verify-2fa"]')
        
        await expect(page.locator('[data-testid="2fa-enabled"]')).toBeVisible()
      })

      await test.step('Test 2FA login flow', async () => {
        // Sign out and sign back in to test 2FA
        await page.click('[data-testid="sign-out"]')
        
        await signInUser(page, testUsers.existingUser)
        
        // Should prompt for 2FA code
        await expect(page.locator('[data-testid="2fa-challenge"]')).toBeVisible()
        
        await page.fill('[name="twoFactorCode"]', '123456')
        await page.click('[data-testid="verify-2fa-code"]')
        
        await page.waitForURL('**/dashboard')
        await expect(page.locator('[data-testid="dashboard"]')).toBeVisible()
      })
    })
  })

  test.describe('Advanced Workout Management', () => {
    test.beforeEach(async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
    })

    test('should create and customize complex workout routines', async ({ page }) => {
      await test.step('Create advanced workout with supersets', async () => {
        await page.click('[data-testid="create-workout"]')
        await page.waitForURL('**/dashboard/workouts/new')
        
        // Basic workout info
        await page.fill('[name="workoutName"]', 'Advanced Upper Body Circuit')
        await page.fill('[name="description"]', 'High-intensity upper body workout with supersets')
        await page.selectOption('[name="category"]', 'strength')
        await page.selectOption('[name="difficulty"]', 'advanced')
        
        // Add superset
        await page.click('[data-testid="add-superset"]')
        
        // First exercise in superset
        await page.click('[data-testid="add-exercise-to-superset"]')
        await page.selectOption('[data-testid="exercise-selector"]', 'bench-press')
        await page.fill('[name="sets"]', '4')
        await page.fill('[name="reps"]', '8-10')
        await page.fill('[name="weight"]', '80')
        
        // Second exercise in superset
        await page.click('[data-testid="add-exercise-to-superset"]')
        await page.selectOption('[data-testid="exercise-selector"]', 'incline-dumbbell-fly')
        await page.fill('[name="sets"]', '4')
        await page.fill('[name="reps"]', '12-15')
        await page.fill('[name="weight"]', '25')
        
        // Set superset rest time
        await page.fill('[name="supersetRest"]', '120')
        
        // Add individual exercise
        await page.click('[data-testid="add-individual-exercise"]')
        await page.selectOption('[data-testid="exercise-selector"]', 'pull-ups')
        await page.fill('[name="sets"]', '3')
        await page.fill('[name="reps"]', '8-12')
        await page.fill('[name="restTime"]', '90')
        
        await page.click('[data-testid="save-workout"]')
      })

      await test.step('Verify workout structure', async () => {
        await page.waitForURL('**/dashboard/workouts')
        
        // Find created workout
        const workoutCard = page.locator('[data-testid="workout-Advanced Upper Body Circuit"]')
        await expect(workoutCard).toBeVisible()
        
        // Check workout details
        await workoutCard.click()
        
        await expect(page.locator('[data-testid="superset-indicator"]')).toBeVisible()
        await expect(page.locator('[data-testid="exercise-count"]')).toContainText('3 exercises')
        await expect(page.locator('[data-testid="estimated-time"]')).toBeVisible()
      })
    })

    test('should track progressive overload across sessions', async ({ page }) => {
      await test.step('Start workout with previous session data', async () => {
        await page.click('[data-testid="my-workouts"]')
        await page.click('[data-testid="workout-bench-press-routine"] [data-testid="start-workout"]')
        
        // Should show previous performance
        await expect(page.locator('[data-testid="previous-performance"]')).toBeVisible()
        await expect(page.locator('[data-testid="last-weight"]')).toContainText('kg')
      })

      await test.step('Record improved performance', async () => {
        // First exercise - increase weight
        const previousWeight = await page.locator('[data-testid="previous-weight"]').textContent()
        const newWeight = (parseInt(previousWeight!) + 2.5).toString()
        
        await page.fill('[data-testid="current-weight"]', newWeight)
        
        // Complete sets with improved performance
        await page.click('[data-testid="complete-set-1"]')
        await page.fill('[data-testid="actual-reps"]', '10') // Higher than previous
        
        await page.click('[data-testid="complete-set-2"]')
        await page.fill('[data-testid="actual-reps"]', '9')
        
        await page.click('[data-testid="complete-set-3"]')
        await page.fill('[data-testid="actual-reps"]', '8')
      })

      await test.step('Finish workout and review progress', async () => {
        await page.click('[data-testid="finish-workout"]')
        
        // Should show progress comparison
        await expect(page.locator('[data-testid="progress-improvement"]')).toBeVisible()
        await expect(page.locator('[data-testid="weight-increase"]')).toContainText('+2.5kg')
        
        // Rate session
        await page.click('[data-testid="rating-4"]')
        await page.fill('[name="sessionNotes"]', 'Felt stronger today, increased weight successfully')
        
        await page.click('[data-testid="save-session"]')
        
        // Verify progress is recorded
        await page.waitForURL('**/dashboard/progress')
        await expect(page.locator('[data-testid="recent-pr"]')).toBeVisible()
      })
    })

    test('should use AI workout recommendations effectively', async ({ page }) => {
      await test.step('Access AI workout generator', async () => {
        await page.click('[data-testid="ai-workout-generator"]')
        await page.waitForURL('**/dashboard/ai/workout-generator')
        
        await expect(page.locator('[data-testid="ai-generator-form"]')).toBeVisible()
      })

      await test.step('Configure detailed preferences', async () => {
        // Target muscle groups
        await page.check('[data-testid="muscle-chest"]')
        await page.check('[data-testid="muscle-back"]')
        await page.check('[data-testid="muscle-shoulders"]')
        
        // Available equipment
        await page.check('[data-testid="equipment-dumbbells"]')
        await page.check('[data-testid="equipment-barbell"]')
        await page.check('[data-testid="equipment-pull-up-bar"]')
        
        // Workout parameters
        await page.selectOption('[name="duration"]', '60')
        await page.selectOption('[name="intensity"]', 'high')
        await page.selectOption('[name="workoutType"]', 'strength')
        
        // Specify limitations
        await page.fill('[name="injuries"]', 'Minor shoulder impingement')
        await page.fill('[name="preferences"]', 'Prefer compound movements, avoid isolation exercises')
        
        await page.click('[data-testid="generate-ai-workout"]')
      })

      await test.step('Review and modify AI suggestions', async () => {
        await page.waitForSelector('[data-testid="generated-workout"]')
        
        // Verify AI considered preferences
        await expect(page.locator('[data-testid="workout-duration"]')).toContainText('60')
        await expect(page.locator('[data-testid="compound-exercises"]')).toBeVisible()
        
        // Modify AI suggestion
        await page.click('[data-testid="modify-exercise-2"]')
        await page.selectOption('[data-testid="replacement-exercise"]', 'dumbbell-row')
        await page.click('[data-testid="apply-modification"]')
        
        // Adjust workout parameters
        await page.click('[data-testid="adjust-difficulty"]')
        await page.selectOption('[name="newDifficulty"]', 'intermediate')
        
        await page.click('[data-testid="save-modified-workout"]')
      })

      await test.step('Execute AI-generated workout', async () => {
        await page.click('[data-testid="start-ai-workout"]')
        
        // Should include AI coaching tips
        await expect(page.locator('[data-testid="ai-coaching-tip"]')).toBeVisible()
        
        // Complete workout with AI guidance
        await page.click('[data-testid="complete-set-1"]')
        
        // AI should provide form feedback
        await expect(page.locator('[data-testid="form-feedback"]')).toBeVisible()
        
        // Finish workout
        await page.click('[data-testid="finish-ai-workout"]')
        
        // Rate AI workout experience
        await page.click('[data-testid="ai-rating-5"]')
        await page.fill('[name="aiWorkoutFeedback"]', 'Great exercise selection, perfect for my goals')
        
        await page.click('[data-testid="submit-ai-feedback"]')
      })
    })
  })

  test.describe('Advanced Progress Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
    })

    test('should provide comprehensive progress analytics', async ({ page }) => {
      await test.step('Access advanced analytics dashboard', async () => {
        await page.click('[data-testid="progress-analytics"]')
        await page.waitForURL('**/dashboard/analytics')
        
        await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
      })

      await test.step('View strength progression analytics', async () => {
        await page.click('[data-testid="strength-analytics"]')
        
        // Check various strength metrics
        await expect(page.locator('[data-testid="total-volume-chart"]')).toBeVisible()
        await expect(page.locator('[data-testid="one-rep-max-progression"]')).toBeVisible()
        await expect(page.locator('[data-testid="exercise-pr-timeline"]')).toBeVisible()
        
        // Filter by exercise
        await page.selectOption('[data-testid="exercise-filter"]', 'bench-press')
        await expect(page.locator('[data-testid="exercise-specific-chart"]')).toBeVisible()
        
        // Change time range
        await page.selectOption('[data-testid="time-range"]', '6-months')
        await expect(page.locator('[data-testid="long-term-progression"]')).toBeVisible()
      })

      await test.step('Analyze body composition trends', async () => {
        await page.click('[data-testid="body-composition-tab"]')
        
        // Add new measurement
        await page.click('[data-testid="add-measurement"]')
        await page.selectOption('[name="type"]', 'body-fat')
        await page.fill('[name="value"]', '12.5')
        await page.click('[data-testid="save-measurement"]')
        
        // View composition trends
        await expect(page.locator('[data-testid="body-fat-trend"]')).toBeVisible()
        await expect(page.locator('[data-testid="lean-mass-trend"]')).toBeVisible()
        
        // Set composition goals
        await page.click('[data-testid="set-composition-goal"]')
        await page.fill('[name="targetBodyFat"]', '10')
        await page.fill('[name="targetDate"]', '2024-12-31')
        await page.click('[data-testid="save-goal"]')
        
        await expect(page.locator('[data-testid="goal-progress-indicator"]')).toBeVisible()
      })

      await test.step('Generate detailed progress reports', async () => {
        await page.click('[data-testid="generate-report"]')
        
        // Configure report parameters
        await page.selectOption('[name="reportType"]', 'comprehensive')
        await page.selectOption('[name="timeframe"]', 'quarterly')
        await page.check('[data-testid="include-photos"]')
        await page.check('[data-testid="include-measurements"]')
        await page.check('[data-testid="include-workouts"]')
        
        await page.click('[data-testid="create-report"]')
        
        // Verify report content
        await expect(page.locator('[data-testid="progress-summary"]')).toBeVisible()
        await expect(page.locator('[data-testid="achievement-highlights"]')).toBeVisible()
        await expect(page.locator('[data-testid="improvement-areas"]')).toBeVisible()
        
        // Export report
        const downloadPromise = page.waitForEvent('download')
        await page.click('[data-testid="export-pdf"]')
        const download = await downloadPromise
        
        expect(download.suggestedFilename()).toMatch(/progress-report.*\.pdf/)
      })
    })
  })

  test.describe('Trainer-Client Interaction Flow', () => {
    test('should facilitate complete trainer-client workflow', async ({ page, context }) => {
      await test.step('Trainer creates client profile', async () => {
        // Sign in as trainer
        await page.goto('/auth/signin')
        await page.fill('[name="email"]', testUsers.trainerUser.email)
        await page.fill('[name="password"]', testUsers.trainerUser.password)
        await page.click('button[type="submit"]')
        
        await page.click('[data-testid="trainer-dashboard"]')
        await page.click('[data-testid="add-new-client"]')
        
        // Create client profile
        await page.fill('[name="clientName"]', 'Sarah Mitchell')
        await page.fill('[name="clientEmail"]', 'sarah.mitchell@example.com')
        await page.fill('[name="clientPhone"]', '+1-555-0123')
        
        // Set client goals and assessment
        await page.check('[data-testid="goal-weight-loss"]')
        await page.check('[data-testid="goal-strength"]')
        
        await page.fill('[name="currentWeight"]', '65')
        await page.fill('[name="targetWeight"]', '58')
        await page.fill('[name="fitnessLevel"]', 'beginner')
        
        await page.click('[data-testid="save-client-profile"]')
        
        await expect(page.locator('[data-testid="client-added-success"]')).toBeVisible()
      })

      await test.step('Create personalized workout plan', async () => {
        await page.click('[data-testid="create-client-workout"]')
        
        // Build personalized workout
        await page.fill('[name="workoutName"]', 'Sarah\'s Beginner Full Body')
        await page.fill('[name="workoutDescription"]', 'Introductory full-body routine focusing on form and basic movements')
        
        // Add exercises with detailed instructions
        await page.click('[data-testid="add-exercise"]')
        await page.selectOption('[data-testid="exercise-selector"]', 'bodyweight-squat')
        await page.fill('[name="sets"]', '3')
        await page.fill('[name="reps"]', '12-15')
        await page.fill('[name="trainerNotes"]', 'Focus on depth and knee tracking. Watch for knee valgus.')
        
        await page.click('[data-testid="add-exercise"]')
        await page.selectOption('[data-testid="exercise-selector"]', 'assisted-pushup')
        await page.fill('[name="sets"]', '3')
        await page.fill('[name="reps"]', '8-10')
        await page.fill('[name="trainerNotes"]', 'Use band or incline as needed. Progress to regular pushups.')
        
        // Set progression plan
        await page.click('[data-testid="add-progression-plan"]')
        await page.fill('[name="progressionWeeks"]', '4')
        await page.fill('[name="progressionNotes"]', 'Increase reps by 2 each week, then add weight/difficulty')
        
        await page.click('[data-testid="assign-to-client"]')
        await page.selectOption('[data-testid="client-selector"]', 'sarah.mitchell@example.com')
        
        await page.click('[data-testid="send-workout-plan"]')
      })

      await test.step('Client receives and follows workout plan', async () => {
        // Switch to client perspective (new tab/context)
        const clientPage = await context.newPage()
        
        // Simulate client receiving email notification
        await clientPage.goto('/client/workout-invitation?token=mock-invitation-token')
        
        // Client accepts workout plan
        await expect(clientPage.locator('[data-testid="workout-invitation"]')).toBeVisible()
        await clientPage.click('[data-testid="accept-workout-plan"]')
        
        // Client creates account if needed
        await clientPage.fill('[name="password"]', 'ClientPassword123!')
        await clientPage.fill('[name="confirmPassword"]', 'ClientPassword123!')
        await clientPage.click('[data-testid="complete-registration"]')
        
        // Client starts assigned workout
        await clientPage.click('[data-testid="start-assigned-workout"]')
        
        // Follow trainer instructions
        await expect(clientPage.locator('[data-testid="trainer-instructions"]')).toBeVisible()
        await expect(clientPage.locator('text=Focus on depth and knee tracking')).toBeVisible()
        
        // Complete workout with feedback
        await clientPage.click('[data-testid="complete-set-1"]')
        await clientPage.selectOption('[data-testid="difficulty-feedback"]', 'appropriate')
        
        await clientPage.click('[data-testid="complete-workout"]')
        
        // Provide session feedback to trainer
        await clientPage.fill('[name="sessionFeedback"]', 'Great workout! Squats felt challenging but manageable.')
        await clientPage.selectOption('[name="overallDifficulty"]', '7')
        await clientPage.click('[data-testid="send-feedback-to-trainer"]')
        
        await clientPage.close()
      })

      await test.step('Trainer reviews client progress', async () => {
        // Back to trainer page
        await page.reload()
        await page.click('[data-testid="client-progress-notifications"]')
        
        // Review client session
        await expect(page.locator('[data-testid="new-client-session"]')).toBeVisible()
        await page.click('[data-testid="review-sarah-session"]')
        
        // Analyze client performance
        await expect(page.locator('[data-testid="session-completion-rate"]')).toContainText('100%')
        await expect(page.locator('[data-testid="client-feedback"]')).toContainText('challenging but manageable')
        
        // Provide coaching feedback
        await page.fill('[name="trainerFeedback"]', 'Excellent job completing your first workout! Focus on form over speed.')
        await page.selectOption('[name="nextSessionAdjustment"]', 'maintain')
        
        await page.click('[data-testid="send-coach-feedback"]')
        
        // Schedule next session
        await page.click('[data-testid="schedule-next-session"]')
        await page.fill('[name="sessionDate"]', '2024-02-15')
        await page.fill('[name="sessionTime"]', '10:00')
        await page.click('[data-testid="confirm-schedule"]')
      })
    })
  })

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page, context }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Handle offline workout session', async () => {
        // Start a workout
        await page.click('[data-testid="my-workouts"]')
        await page.click('[data-testid="start-workout-0"]')
        
        // Simulate network failure
        await context.setOffline(true)
        
        // Continue workout offline
        await page.click('[data-testid="complete-set-1"]')
        
        // Should show offline indicator
        await expect(page.locator('[data-testid="offline-mode"]')).toBeVisible()
        await expect(page.locator('[data-testid="data-will-sync"]')).toBeVisible()
        
        // Complete workout offline
        await page.click('[data-testid="finish-workout-offline"]')
        
        // Data should be stored locally
        await expect(page.locator('[data-testid="stored-locally"]')).toBeVisible()
        
        // Restore network
        await context.setOffline(false)
        
        // Should sync automatically
        await expect(page.locator('[data-testid="syncing-data"]')).toBeVisible()
        await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
      })

      await test.step('Handle API errors during workout creation', async () => {
        // Mock API failure
        await page.route('**/api/workouts', (route) => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal server error' })
          })
        })
        
        await page.click('[data-testid="create-new-workout"]')
        await page.fill('[name="workoutName"]', 'Error Test Workout')
        await page.click('[data-testid="save-workout"]')
        
        // Should show retry mechanism
        await expect(page.locator('[data-testid="save-failed"]')).toBeVisible()
        await expect(page.locator('[data-testid="retry-save"]')).toBeVisible()
        
        // Clear route mock and retry
        await page.unroute('**/api/workouts')
        await page.click('[data-testid="retry-save"]')
        
        // Should succeed on retry
        await expect(page.locator('[data-testid="workout-saved"]')).toBeVisible()
      })
    })

    test('should handle data validation errors', async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Handle invalid workout data', async () => {
        await page.click('[data-testid="create-workout"]')
        
        // Try to save with invalid data
        await page.fill('[name="workoutName"]', '') // Empty name
        await page.fill('[name="duration"]', '-10') // Negative duration
        
        await page.click('[data-testid="save-workout"]')
        
        // Should show validation errors
        await expect(page.locator('[data-testid="name-required-error"]')).toBeVisible()
        await expect(page.locator('[data-testid="duration-invalid-error"]')).toBeVisible()
        
        // Form should not submit
        expect(page.url()).toContain('/new')
      })

      await test.step('Handle invalid measurement data', async () => {
        await page.click('[data-testid="add-measurement"]')
        
        await page.selectOption('[name="type"]', 'weight')
        await page.fill('[name="value"]', '999') // Unrealistic weight
        await page.fill('[name="date"]', '2025-12-31') // Future date
        
        await page.click('[data-testid="save-measurement"]')
        
        // Should show validation warnings
        await expect(page.locator('[data-testid="value-warning"]')).toBeVisible()
        await expect(page.locator('[data-testid="future-date-error"]')).toBeVisible()
      })
    })

    test('should handle session timeouts and re-authentication', async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Simulate session timeout', async () => {
        // Mock expired session
        await page.route('**/api/**', (route) => {
          if (route.request().headers()['authorization']) {
            route.fulfill({
              status: 401,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Session expired' })
            })
          } else {
            route.continue()
          }
        })
        
        // Try to access protected resource
        await page.click('[data-testid="my-workouts"]')
        
        // Should redirect to login with message
        await expect(page.locator('[data-testid="session-expired"]')).toBeVisible()
        await expect(page).toHaveURL('**/auth/signin')
        
        // Re-authenticate
        await page.fill('[name="email"]', testUsers.existingUser.email)
        await page.fill('[name="password"]', testUsers.existingUser.password)
        await page.click('button[type="submit"]')
        
        // Should redirect back to original page
        await expect(page).toHaveURL('**/dashboard/workouts')
      })
    })
  })

  test.describe('Performance & Load Testing', () => {
    test('should handle high user interaction loads', async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Rapid navigation stress test', async () => {
        const startTime = Date.now()
        
        // Rapidly navigate between sections
        const sections = [
          'dashboard',
          'workouts',
          'progress',
          'community',
          'settings'
        ]
        
        for (let i = 0; i < 3; i++) {
          for (const section of sections) {
            await page.click(`[data-testid="${section}-tab"]`)
            await page.waitForSelector(`[data-testid="${section}-content"]`, { timeout: 2000 })
          }
        }
        
        const totalTime = Date.now() - startTime
        
        // Should handle rapid navigation without errors
        expect(totalTime).toBeLessThan(30000) // 30 seconds for all navigation
        await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible()
      })

      await test.step('Large dataset rendering performance', async () => {
        await page.goto('/dashboard/analytics')
        
        // Load analytics with large dataset
        await page.selectOption('[data-testid="time-range"]', 'all-time')
        await page.selectOption('[data-testid="data-granularity"]', 'daily')
        
        const startRender = Date.now()
        await page.waitForSelector('[data-testid="analytics-chart"]')
        const renderTime = Date.now() - startRender
        
        // Should render large dataset within reasonable time
        expect(renderTime).toBeLessThan(5000) // 5 seconds
        
        // Chart should be interactive
        await page.hover('[data-testid="chart-datapoint-0"]')
        await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
      })
    })

    test('should maintain accessibility under load', async ({ page }) => {
      await signInUser(page, testUsers.existingUser)
      
      await test.step('Keyboard navigation performance', async () => {
        // Navigate through all focusable elements rapidly
        let tabCount = 0
        const maxTabs = 50
        
        while (tabCount < maxTabs) {
          await page.keyboard.press('Tab')
          tabCount++
          
          // Check that focus is visible and responsive
          const focusedElement = page.locator(':focus')
          await expect(focusedElement).toBeVisible()
        }
        
        // Should maintain focus ring visibility
        await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid')
      })

      await test.step('Screen reader compatibility under load', async () => {
        // Navigate with screen reader commands simulation
        await page.keyboard.press('H') // Next heading
        await page.keyboard.press('H')
        await page.keyboard.press('H')
        
        // Verify ARIA labels remain accurate
        const landmarks = await page.locator('[role="main"], [role="navigation"], [role="complementary"]').count()
        expect(landmarks).toBeGreaterThan(0)
        
        // Verify form labels are present
        await page.click('[data-testid="create-workout"]')
        const labeledInputs = await page.locator('input[aria-labelledby], input[aria-label]').count()
        expect(labeledInputs).toBeGreaterThan(0)
      })
    })
  })
})