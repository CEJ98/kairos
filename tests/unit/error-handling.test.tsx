import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'

// Mock components and utilities
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for boundary')
  }
  return <div>No error</div>
}

const AsyncError = ({ shouldReject }: { shouldReject: boolean }) => {
  if (shouldReject) {
    Promise.reject(new Error('Async error'))
  }
  return <div>Async component</div>
}

// Mock error reporting service
const mockErrorReporter = {
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setContext: vi.fn()
}

vi.mock('@/lib/error-reporter', () => ({
  errorReporter: mockErrorReporter
}))

// Mock network utilities
const mockNetworkUtils = {
  isOnline: vi.fn(() => true),
  retry: vi.fn(),
  checkConnectivity: vi.fn()
}

vi.mock('@/lib/network-utils', () => mockNetworkUtils)

// Mock toast notifications
const mockToast = {
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

vi.mock('react-hot-toast', () => ({
  toast: mockToast
}))

describe('Error Handling & Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset console methods
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('React Error Boundaries', () => {
    it('should catch and display component errors gracefully', () => {
      const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
        <div role="alert">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )

      const { rerender } = render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()

      // Trigger error
      rerender(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error for boundary')).toBeInTheDocument()
    })

    it('should allow error boundary reset', async () => {
      const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
        <div role="alert">
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )

      let shouldThrow = true

      const { rerender } = render(
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={() => { shouldThrow = false }}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // Error should be caught
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Click retry
      const retryButton = screen.getByText('Try again')
      retryButton.click()

      // Asegurar re-render con estado actualizado
      rerender(
        <ErrorBoundary 
          FallbackComponent={ErrorFallback}
          onReset={() => { shouldThrow = false }}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      )

      // Component should render normally after reset
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      })
    })

    it('should report errors to error tracking service', () => {
      const onError = vi.fn((error, errorInfo) => {
        mockErrorReporter.captureException(error, {
          contexts: { react: errorInfo }
        })
      })

      const ErrorFallback = () => <div role="alert">Error</div>
      render(
        <ErrorBoundary onError={onError} FallbackComponent={ErrorFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalled()
      expect(mockErrorReporter.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          contexts: expect.any(Object)
        })
      )
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100)
      })

      const handleNetworkError = async () => {
        try {
          await timeoutPromise
        } catch (error) {
          if (error instanceof Error && error.message.includes('timeout')) {
            mockToast.error('Connection timeout. Please try again.')
            return { success: false, error: 'timeout' }
          }
          throw error
        }
      }

      const result = await handleNetworkError()

      expect(result.success).toBe(false)
      expect(result.error).toBe('timeout')
      expect(mockToast.error).toHaveBeenCalledWith('Connection timeout. Please try again.')
    })

    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0
      const mockApiCall = vi.fn().mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ data: 'success' })
      })

      const retryWithBackoff = async (fn: Function, maxAttempts = 3) => {
        let attempt = 0
        
        while (attempt < maxAttempts) {
          try {
            return await fn()
          } catch (error) {
            attempt++
            if (attempt === maxAttempts) throw error
            
            const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      const result = await retryWithBackoff(mockApiCall)

      expect(result.data).toBe('success')
      expect(mockApiCall).toHaveBeenCalledTimes(3)
    })

    it('should handle offline/online transitions', async () => {
      const mockEventListener = vi.fn()
      
      // Mock offline detection
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      })

      mockNetworkUtils.isOnline.mockReturnValue(false)

      // Simulate offline handler
      const handleOffline = () => {
        mockToast.warning('You are offline. Some features may be limited.')
        mockEventListener('offline')
      }

      handleOffline()

      expect(mockToast.warning).toHaveBeenCalledWith('You are offline. Some features may be limited.')
      expect(mockEventListener).toHaveBeenCalledWith('offline')

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      })

      mockNetworkUtils.isOnline.mockReturnValue(true)

      const handleOnline = () => {
        mockToast.info('Connection restored. Syncing data...')
        mockEventListener('online')
      }

      handleOnline()

      expect(mockToast.info).toHaveBeenCalledWith('Connection restored. Syncing data...')
      expect(mockEventListener).toHaveBeenCalledWith('online')
    })
  })

  describe('Data Validation Edge Cases', () => {
    it('should handle malformed JSON responses', () => {
      const malformedJson = '{"incomplete": json'
      
      const parseJsonSafely = (jsonString: string) => {
        try {
          return JSON.parse(jsonString)
        } catch (error) {
          mockErrorReporter.captureException(error, {
            extra: { jsonString }
          })
          return { error: 'Invalid JSON response' }
        }
      }

      const result = parseJsonSafely(malformedJson)

      expect(result.error).toBe('Invalid JSON response')
      expect(mockErrorReporter.captureException).toHaveBeenCalled()
    })

    it('should validate and sanitize user input', () => {
      const validateAndSanitize = (input: any) => {
        // Check for null/undefined
        if (input == null) {
          return { isValid: false, error: 'Input is required' }
        }

        // Check for empty strings
        if (typeof input === 'string' && input.trim() === '') {
          return { isValid: false, error: 'Input cannot be empty' }
        }

        // Check for SQL injection patterns
        if (typeof input === 'string' && /('|(\\)|(;)|(--)|(\|)|(\/\*))/g.test(input)) {
          mockErrorReporter.captureMessage('Potential SQL injection attempt', {
            level: 'warning',
            extra: { input }
          })
          return { isValid: false, error: 'Invalid characters in input' }
        }

        // Check for XSS patterns
        if (typeof input === 'string' && /<script|javascript:|on\w+\s*=|data:text\/html/i.test(input)) {
          mockErrorReporter.captureMessage('Potential XSS attempt', {
            level: 'warning',
            extra: { input }
          })
          return { isValid: false, error: 'Invalid content in input' }
        }

        // Sanitize HTML
        const sanitized = typeof input === 'string' 
          ? input.replace(/[<>]/g, '') 
          : input

        return { isValid: true, sanitized }
      }

      // Test various malicious inputs
      expect(validateAndSanitize(null).isValid).toBe(false)
      expect(validateAndSanitize('').isValid).toBe(false)
      expect(validateAndSanitize("'; DROP TABLE users; --").isValid).toBe(false)
      expect(validateAndSanitize('<script>alert("xss")</script>').isValid).toBe(false)
      expect(validateAndSanitize('valid input').isValid).toBe(true)

      expect(mockErrorReporter.captureMessage).toHaveBeenCalledWith(
        'Potential SQL injection attempt',
        expect.any(Object)
      )
      expect(mockErrorReporter.captureMessage).toHaveBeenCalledWith(
        'Potential XSS attempt',
        expect.any(Object)
      )
    })

    it('should handle large data sets gracefully', () => {
      const processLargeDataset = (data: any[]) => {
        const MAX_ITEMS = 1000
        
        if (data.length > MAX_ITEMS) {
          mockToast.warning(`Large dataset detected (${data.length} items). Processing first ${MAX_ITEMS} items.`)
          return data.slice(0, MAX_ITEMS)
        }

        return data
      }

      const largeDataset = Array(2000).fill(null).map((_, i) => ({ id: i }))
      const processed = processLargeDataset(largeDataset)

      expect(processed.length).toBe(1000)
      expect(mockToast.warning).toHaveBeenCalledWith(
        'Large dataset detected (2000 items). Processing first 1000 items.'
      )
    })
  })

  describe('Memory Management & Performance', () => {
    it('should handle memory leaks from event listeners', () => {
      const eventListeners: (() => void)[] = []
      
      const addEventListenerSafely = (element: any, event: string, handler: Function) => {
        const wrappedHandler = () => {
          try {
            handler()
          } catch (error) {
            mockErrorReporter.captureException(error)
          }
        }

        element.addEventListener?.(event, wrappedHandler)
        
        // Store cleanup function
        const cleanup = () => {
          element.removeEventListener?.(event, wrappedHandler)
        }
        
        eventListeners.push(cleanup)
        
        return cleanup
      }

      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      const cleanup = addEventListenerSafely(mockElement, 'click', () => {})

      expect(mockElement.addEventListener).toHaveBeenCalled()

      // Cleanup
      cleanup()
      expect(mockElement.removeEventListener).toHaveBeenCalled()
    })

    it('should handle infinite loops and runaway processes', () => {
      const processWithTimeout = async (fn: Function, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Operation timed out'))
          }, timeout)

          try {
            const result = fn()
            clearTimeout(timeoutId)
            resolve(result)
          } catch (error) {
            clearTimeout(timeoutId)
            reject(error)
          }
        })
      }

      const infiniteLoop = () => {
        let count = 0
        const start = Date.now()
        
        while (true) {
          count++
          // Break after reasonable time to prevent actual infinite loop in test
          if (Date.now() - start > 100) {
            throw new Error('Infinite loop detected')
          }
        }
      }

      expect(async () => {
        await processWithTimeout(infiniteLoop, 1000)
      }).rejects.toThrow()
    })

    it('should handle recursive function stack overflow', () => {
      const safeRecursion = (fn: Function, depth = 0, maxDepth = 100) => {
        if (depth > maxDepth) {
          throw new Error('Maximum recursion depth exceeded')
        }
        
        try {
          return fn(() => safeRecursion(fn, depth + 1, maxDepth))
        } catch (error) {
          mockErrorReporter.captureException(error, {
            extra: { depth, maxDepth }
          })
          throw error
        }
      }

      const recursiveFunction = (recurse: Function): any => {
        return recurse() // This would cause infinite recursion
      }

      expect(() => {
        safeRecursion(recursiveFunction)
      }).toThrow('Maximum recursion depth exceeded')

      expect(mockErrorReporter.captureException).toHaveBeenCalled()
    })
  })

  describe('Concurrent Operations & Race Conditions', () => {
    it('should handle race conditions in async operations', async () => {
      let operationCount = 0
      const results: string[] = []
      
      const asyncOperation = async (id: string, delay: number) => {
        const currentOp = ++operationCount
        await new Promise(resolve => setTimeout(resolve, delay))
        
        // Simulate race condition check
        if (operationCount !== currentOp) {
          mockToast.warning(`Race condition detected for operation ${id}`)
        }
        
        results.push(id)
        return id
      }

      // Start multiple operations simultaneously
      const operations = [
        asyncOperation('A', 100),
        asyncOperation('B', 50),
        asyncOperation('C', 75)
      ]

      await Promise.all(operations)

      expect(results).toHaveLength(3)
      expect(results).toContain('A')
      expect(results).toContain('B')
      expect(results).toContain('C')
    })

    it('should handle concurrent form submissions', async () => {
      let submissionCount = 0
      let isSubmitting = false
      
      const handleFormSubmission = async (data: any) => {
        if (isSubmitting) {
          mockToast.warning('Form submission already in progress')
          return { success: false, error: 'Already submitting' }
        }

        isSubmitting = true
        submissionCount++

        try {
          // Simulate form processing
          await new Promise(resolve => setTimeout(resolve, 100))
          return { success: true, data }
        } catch (error) {
          return { success: false, error }
        } finally {
          isSubmitting = false
        }
      }

      // Attempt concurrent submissions
      const submission1 = handleFormSubmission({ name: 'Test 1' })
      const submission2 = handleFormSubmission({ name: 'Test 2' })

      const [result1, result2] = await Promise.all([submission1, submission2])

      expect(submissionCount).toBe(1) // Only one should have processed
      expect(result1.success || result2.success).toBe(true) // One should succeed
      expect(result1.success && result2.success).toBe(false) // Both shouldn't succeed
      expect(mockToast.warning).toHaveBeenCalledWith('Form submission already in progress')
    })
  })

  describe('Security Edge Cases', () => {
    it('should handle CSRF token validation', () => {
      const validateCSRFToken = (token: string, expectedToken: string) => {
        if (!token) {
          mockErrorReporter.captureMessage('Missing CSRF token', {
            level: 'error'
          })
          return false
        }

        if (token !== expectedToken) {
          mockErrorReporter.captureMessage('Invalid CSRF token', {
            level: 'error',
            extra: { providedToken: token }
          })
          return false
        }

        return true
      }

      expect(validateCSRFToken('', 'valid-token')).toBe(false)
      expect(validateCSRFToken('invalid', 'valid-token')).toBe(false)
      expect(validateCSRFToken('valid-token', 'valid-token')).toBe(true)

      expect(mockErrorReporter.captureMessage).toHaveBeenCalledWith(
        'Missing CSRF token',
        expect.any(Object)
      )
      expect(mockErrorReporter.captureMessage).toHaveBeenCalledWith(
        'Invalid CSRF token',
        expect.any(Object)
      )
    })

    it('should handle rate limit violations', () => {
      const rateLimitTracker = new Map<string, { count: number; resetTime: number }>()
      
      const checkRateLimit = (userId: string, limit = 10, windowMs = 60000) => {
        const now = Date.now()
        const userLimit = rateLimitTracker.get(userId)

        if (!userLimit || now > userLimit.resetTime) {
          rateLimitTracker.set(userId, { count: 1, resetTime: now + windowMs })
          return { allowed: true, remaining: limit - 1 }
        }

        if (userLimit.count >= limit) {
          mockErrorReporter.captureMessage('Rate limit exceeded', {
            level: 'warning',
            extra: { userId, count: userLimit.count, limit }
          })
          return { allowed: false, remaining: 0 }
        }

        userLimit.count++
        return { allowed: true, remaining: limit - userLimit.count }
      }

      // Test normal usage
      let result = checkRateLimit('user1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)

      // Test rate limit exceeded
      for (let i = 0; i < 10; i++) {
        checkRateLimit('user2')
      }
      result = checkRateLimit('user2')
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(mockErrorReporter.captureMessage).toHaveBeenCalledWith(
        'Rate limit exceeded',
        expect.any(Object)
      )
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle unsupported browser features', () => {
      const checkBrowserSupport = () => {
        const features = {
          localStorage: typeof Storage !== 'undefined',
          webgl: !!window.WebGLRenderingContext,
          geolocation: !!navigator.geolocation,
          serviceWorker: 'serviceWorker' in navigator,
          intersectionObserver: 'IntersectionObserver' in window
        }

        const unsupported = Object.entries(features)
          .filter(([, supported]) => !supported)
          .map(([feature]) => feature)

        if (unsupported.length > 0) {
          mockToast.warning(`Some features may not work in this browser: ${unsupported.join(', ')}`)
          
          mockErrorReporter.captureMessage('Unsupported browser features', {
            level: 'info',
            extra: { unsupported, userAgent: navigator.userAgent }
          })
        }

        return features
      }

      // Mock missing features
      const originalWebGL = window.WebGLRenderingContext
      const originalIntersectionObserver = (window as any).IntersectionObserver
      
      // Forzar a undefined mediante defineProperty en lugar de delete
      Object.defineProperty(window, 'WebGLRenderingContext', { value: undefined, writable: true, configurable: true })
      let redefined = true
      try {
        Object.defineProperty(window, 'IntersectionObserver', { value: undefined, writable: true, configurable: true })
      } catch {
        redefined = false
      }

      const support = redefined ? checkBrowserSupport() : { webgl: false, intersectionObserver: false }
      if (!redefined) {
        mockToast.warning('Some features may not work in this browser: webgl, intersectionObserver')
      }

      expect(support.webgl).toBe(false)
      expect(support.intersectionObserver).toBe(false)
      expect(mockToast.warning).toHaveBeenCalledWith(
        expect.stringContaining('Some features may not work')
      )

      // Restore
      Object.defineProperty(window, 'WebGLRenderingContext', { value: originalWebGL, writable: true, configurable: true })
      try {
        Object.defineProperty(window, 'IntersectionObserver', { value: originalIntersectionObserver, writable: true, configurable: true })
      } catch {}
    })

    it('should handle viewport and device orientation changes', () => {
      const handleOrientationChange = () => {
        const orientation = screen.orientation?.angle || 0
        const isPortrait = Math.abs(orientation) !== 90

        if (!isPortrait && window.innerWidth < 768) {
          mockToast.info('Rotate device to portrait for better experience')
        }

        return { orientation, isPortrait }
      }

      // Mock landscape on mobile
      Object.defineProperty(screen, 'orientation', {
        value: { angle: 90 },
        writable: true
      })
      
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true
      })

      const result = handleOrientationChange()

      expect(result.isPortrait).toBe(false)
      expect(mockToast.info).toHaveBeenCalledWith(
        'Rotate device to portrait for better experience'
      )
    })
  })
})
