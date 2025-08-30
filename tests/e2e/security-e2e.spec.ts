/**
 * End-to-End Security Tests for Kairos Fitness
 * Tests security measures in a real browser environment
 */

import { test, expect, Page } from '@playwright/test'

test.describe('Security E2E Tests', () => {
  
  test.describe('Authentication Security', () => {
    test('should prevent access to protected routes without authentication', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard')
      
      // Should be redirected to signin
      await expect(page).toHaveURL('/signin')
      
      // Try to access trainer dashboard
      await page.goto('/dashboard/trainer')
      await expect(page).toHaveURL('/signin')
      
      // Try to access admin routes
      await page.goto('/dashboard/admin')
      await expect(page).toHaveURL('/signin')
    })

    test('should enforce rate limiting on login attempts', async ({ page }) => {
      await page.goto('/signin')
      
      const invalidCredentials = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.fill('[name="email"]', invalidCredentials.email)
        await page.fill('[name="password"]', invalidCredentials.password)
        await page.click('button[type="submit"]')
        
        if (i < 4) {
          // First 5 attempts should show invalid credentials
          await expect(page.locator('text=Credenciales inválidas')).toBeVisible()
        } else {
          // 6th attempt should be rate limited
          await expect(page.locator('text=Too many authentication attempts')).toBeVisible()
        }
        
        // Wait a bit between attempts
        await page.waitForTimeout(100)
      }
      
      // Verify rate limiting is active
      await page.fill('[name="email"]', 'valid@example.com')
      await page.fill('[name="password"]', 'ValidPassword123!')
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Too many authentication attempts')).toBeVisible()
    })

    test('should prevent password enumeration attacks', async ({ page }) => {
      await page.goto('/signin')
      
      // Try with non-existent email
      await page.fill('[name="email"]', 'nonexistent@example.com')
      await page.fill('[name="password"]', 'anypassword')
      await page.click('button[type="submit"]')
      
      const errorMessage1 = await page.locator('[data-testid="error-message"]').textContent()
      
      // Try with existing email but wrong password
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
      
      const errorMessage2 = await page.locator('[data-testid="error-message"]').textContent()
      
      // Error messages should be the same to prevent enumeration
      expect(errorMessage1).toBe(errorMessage2)
    })
  })

  test.describe('Input Validation', () => {
    test('should sanitize and validate form inputs', async ({ page }) => {
      await page.goto('/signup')
      
      // Test XSS prevention in name field
      const xssPayload = '<script>alert("xss")</script>'
      await page.fill('[name="name"]', xssPayload)
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'ValidPassword123!')
      
      await page.click('button[type="submit"]')
      
      // XSS script should not execute
      const alertPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null)
      const alert = await alertPromise
      expect(alert).toBeNull()
      
      // Name field should be sanitized
      const nameValue = await page.inputValue('[name="name"]')
      expect(nameValue).not.toContain('<script>')
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/signup')
      
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..email@example.com',
        'test@example',
      ]
      
      for (const email of invalidEmails) {
        await page.fill('[name="email"]', email)
        await page.fill('[name="name"]', 'Test User')
        await page.fill('[name="password"]', 'ValidPassword123!')
        await page.click('button[type="submit"]')
        
        await expect(page.locator('text=Invalid email format')).toBeVisible()
        await page.reload()
      }
    })

    test('should enforce password strength requirements', async ({ page }) => {
      await page.goto('/signup')
      
      const weakPasswords = [
        '123456',           // Too short, no complexity
        'password',         // Common password
        'Password',         // Missing number and special char
        'password123',      // Missing uppercase and special char
        'PASSWORD123!',     // Missing lowercase
      ]
      
      for (const password of weakPasswords) {
        await page.fill('[name="name"]', 'Test User')
        await page.fill('[name="email"]', 'test@example.com')
        await page.fill('[name="password"]', password)
        await page.click('button[type="submit"]')
        
        // Should show password strength error
        await expect(page.locator('text*=Password must')).toBeVisible()
        await page.reload()
      }
    })
  })

  test.describe('Session Security', () => {
    test('should properly handle session timeout', async ({ page }) => {
      // Login first
      await page.goto('/signin')
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'ValidPassword123!')
      await page.click('button[type="submit"]')
      
      await expect(page).toHaveURL('/dashboard')
      
      // Simulate session expiration by clearing session storage
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })
      
      // Try to access a protected route
      await page.goto('/dashboard/workouts')
      
      // Should be redirected to login
      await expect(page).toHaveURL('/signin')
    })

    test('should prevent session fixation attacks', async ({ page }) => {
      // Get initial session ID
      await page.goto('/')
      const initialSessionId = await page.evaluate(() => {
        return document.cookie.match(/next-auth\.session-token=([^;]*)/)?.[1]
      })
      
      // Login
      await page.goto('/signin')
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'ValidPassword123!')
      await page.click('button[type="submit"]')
      
      // Session ID should change after login
      const newSessionId = await page.evaluate(() => {
        return document.cookie.match(/next-auth\.session-token=([^;]*)/)?.[1]
      })
      
      expect(newSessionId).toBeDefined()
      expect(newSessionId).not.toBe(initialSessionId)
    })
  })

  test.describe('CSRF Protection', () => {
    test('should protect against CSRF attacks on critical endpoints', async ({ page, context }) => {
      // Login normally
      await page.goto('/signin')
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', 'ValidPassword123!')
      await page.click('button[type="submit"]')
      
      // Get CSRF token
      const csrfToken = await page.evaluate(() => {
        const metaTag = document.querySelector('meta[name="csrf-token"]')
        return metaTag?.getAttribute('content')
      })
      
      // Try to make a request without CSRF token from different origin
      const response = await context.request.post('/api/users/profile', {
        data: {
          name: 'Malicious Update'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Should be rejected due to missing CSRF token
      expect(response.status()).toBe(403)
    })
  })

  test.describe('File Upload Security', () => {
    test('should validate file types and sizes', async ({ page }) => {
      // Login and navigate to profile
      await loginTestUser(page)
      await page.goto('/dashboard/profile')
      
      // Try to upload executable file
      const fileInput = page.locator('input[type="file"]')
      
      // Create a fake .exe file
      const executableFile = await page.evaluateHandle(() => {
        const file = new File(['malicious content'], 'malware.exe', {
          type: 'application/x-msdownload'
        })
        return file
      })
      
      await fileInput.setInputFiles(executableFile as any)
      
      // Should show error for invalid file type
      await expect(page.locator('text=Invalid file type')).toBeVisible()
      
      // Try to upload oversized file (simulate large file)
      const largeFile = await page.evaluateHandle(() => {
        const largeContent = 'x'.repeat(10 * 1024 * 1024) // 10MB
        const file = new File([largeContent], 'large.jpg', {
          type: 'image/jpeg'
        })
        return file
      })
      
      await fileInput.setInputFiles(largeFile as any)
      
      // Should show error for file too large
      await expect(page.locator('text=File too large')).toBeVisible()
    })
  })

  test.describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in search functionality', async ({ page }) => {
      await loginTestUser(page)
      await page.goto('/dashboard/exercises')
      
      // Try SQL injection payloads in search
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'evil@hacker.com'); --",
        "' OR '1'='1",
      ]
      
      for (const payload of sqlInjectionPayloads) {
        await page.fill('[data-testid="search-input"]', payload)
        await page.press('[data-testid="search-input"]', 'Enter')
        
        // Should not cause database errors or return unauthorized data
        await expect(page.locator('text=Database error')).not.toBeVisible()
        await expect(page.locator('text=hacker')).not.toBeVisible()
        await expect(page.locator('text=evil@hacker.com')).not.toBeVisible()
        
        // Clear search for next test
        await page.fill('[data-testid="search-input"]', '')
      }
    })
  })

  test.describe('Content Security Policy', () => {
    test('should block inline scripts', async ({ page }) => {
      await page.goto('/')
      
      // Try to inject inline script
      const scriptInjected = await page.evaluate(() => {
        try {
          const script = document.createElement('script')
          script.innerHTML = '(window as any).maliciousFlag = true'
          document.head.appendChild(script)
          return (window as any).maliciousFlag === true
        } catch (error) {
          return false
        }
      })
      
      // Inline script should be blocked by CSP
      expect(scriptInjected).toBe(false)
    })

    test('should enforce frame ancestors policy', async ({ page }) => {
      // Try to load the app in an iframe
      const frameBlocked = await page.evaluate(async () => {
        try {
          const iframe = document.createElement('iframe')
          iframe.src = window.location.origin
          document.body.appendChild(iframe)
          
          // Wait for potential load
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check if iframe was blocked
          return iframe.contentWindow === null
        } catch (error) {
          return true
        }
      })
      
      expect(frameBlocked).toBe(true)
    })
  })
})

// Helper function
async function loginTestUser(page: Page) {
  await page.goto('/signin')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'ValidPassword123!')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
}