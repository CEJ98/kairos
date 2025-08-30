# 🧪 Testing Documentation - Kairos Fitness

## Overview

Comprehensive testing framework implementing unit, integration, security, and end-to-end tests with >90% coverage target.

## 🏗️ Testing Stack

### Core Testing Tools
- **Vitest** - Modern test runner with native TypeScript support
- **Testing Library** - React component testing utilities
- **MSW (Mock Service Worker)** - API mocking for reliable tests
- **Playwright** - Cross-browser end-to-end testing
- **Cypress** - Alternative E2E testing framework

### Configuration Files
- `vitest.config.ts` - Main test configuration
- `tests/setup.ts` - Global test setup and mocks
- `playwright.config.ts` - E2E test configuration (to be created)

## 📁 Test Structure

```
tests/
├── setup.ts                 # Global test setup
├── mocks/                   # MSW API mocks
│   ├── server.ts           # MSW server configuration
│   └── handlers/           # API endpoint mocks
│       ├── auth.ts
│       ├── workouts.ts
│       ├── users.ts
│       └── stripe.ts
├── unit/                   # Unit tests
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── lib/
├── integration/            # Integration tests
│   ├── auth-flow.test.ts
│   ├── workout-creation.test.ts
│   ├── stripe-integration.test.ts
│   └── trainer-client.test.ts
├── security/              # Security-focused tests
│   ├── auth-bypass.test.ts
│   ├── rate-limiting.test.ts
│   ├── xss-protection.test.ts
│   └── sql-injection.test.ts
├── e2e/                   # End-to-end tests
│   ├── user-journey.spec.ts
│   ├── payment-flow.spec.ts
│   └── mobile-responsive.spec.ts
└── performance/           # Performance tests
    ├── lighthouse.test.ts
    └── load-testing.test.ts
```

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm run test:security       # Security tests only
npm run test:e2e            # End-to-end tests only

# Coverage and reporting
npm run test:coverage       # Generate coverage report
npm run test:ui            # Open Vitest UI
npm run test:watch         # Watch mode for development

# Performance testing
npm run test:performance    # Lighthouse performance audit
```

### Advanced Commands
```bash
# Run tests matching pattern
npm test -- auth           # Run tests with "auth" in name
npm test -- --reporter=verbose

# Run specific test file
npm test tests/security/auth-bypass.test.ts

# Debug mode
npm test -- --inspect-brk
```

## 🔐 Security Testing

### Authentication Security Tests
**File**: `tests/security/auth-bypass.test.ts`

Tests the critical authentication bypass fix:
```typescript
describe('Authentication Bypass Prevention', () => {
  it('should reject login when user has no password', async () => {
    // Test implementation
  })
  
  it('should reject login with "password" as password', async () => {
    // Verify the critical fix works
  })
})
```

### Rate Limiting Tests
**File**: `tests/security/rate-limiting.test.ts`

Comprehensive rate limiting validation:
```typescript
describe('Rate Limiting Security', () => {
  it('should allow requests within limit', () => {
    // Test normal operation
  })
  
  it('should block requests exceeding limit', () => {
    // Test rate limiting enforcement
  })
  
  it('should reset after window expires', async () => {
    // Test rate limit window reset
  })
})
```

## 🔧 Mock Service Worker (MSW) Setup

### Server Configuration
**File**: `tests/mocks/server.ts`
```typescript
import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { workoutHandlers } from './handlers/workouts'

export const server = setupServer(
  ...authHandlers,
  ...workoutHandlers,
  // ... other handlers
)
```

### API Endpoint Mocking
**Authentication Endpoints** (`tests/mocks/handlers/auth.ts`):
- Registration with validation
- Login simulation
- Session management
- Rate limiting simulation

**Workout Endpoints** (`tests/mocks/handlers/workouts.ts`):
- CRUD operations
- Permission validation
- Data validation testing

**Stripe Integration** (`tests/mocks/handlers/stripe.ts`):
- Payment processing simulation
- Webhook validation
- Subscription management

## 📊 Coverage Requirements

### Coverage Thresholds
```typescript
coverage: {
  thresholds: {
    global: {
      branches: 90,
      functions: 90, 
      lines: 90,
      statements: 90,
    },
  },
}
```

### Coverage Exclusions
- `node_modules/` - Third-party code
- `tests/` - Test files themselves
- `.next/` - Next.js build artifacts
- `src/components/ui/` - Shadcn components (pre-built)
- `**/*.config.{js,ts}` - Configuration files
- `**/*.d.ts` - TypeScript declaration files

## 🎭 Component Testing

### Testing Library Best Practices
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('WorkoutCard Component', () => {
  it('should display workout information', () => {
    render(<WorkoutCard workout={mockWorkout} />)
    
    expect(screen.getByText('Upper Body Strength')).toBeInTheDocument()
    expect(screen.getByText('45 minutes')).toBeInTheDocument()
  })
  
  it('should handle start workout click', async () => {
    const onStart = vi.fn()
    render(<WorkoutCard workout={mockWorkout} onStart={onStart} />)
    
    await userEvent.click(screen.getByText('Start Workout'))
    
    expect(onStart).toHaveBeenCalledWith(mockWorkout.id)
  })
})
```

### Common Testing Patterns
1. **Arrange** - Set up test data and mocks
2. **Act** - Perform user interactions
3. **Assert** - Verify expected outcomes

## 🌐 End-to-End Testing (Planned)

### Playwright Configuration
**File**: `playwright.config.ts` (to be created)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
})
```

### Critical E2E Test Scenarios
1. **User Registration and Login Flow**
2. **Workout Creation and Execution**
3. **Payment and Subscription Management**
4. **Trainer-Client Interaction**
5. **Mobile Responsiveness**
6. **Performance on Different Devices**

## 📈 Performance Testing

### Lighthouse Integration
```bash
npm run test:performance
```

**Metrics Tracked**:
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1
- Time to Interactive < 3s
- Performance Score > 95

### Load Testing (Planned)
- Concurrent user simulation
- API endpoint stress testing
- Database performance under load
- Rate limiting effectiveness

## 🔍 Test Debugging

### Common Issues and Solutions

**1. Test Timeouts**
```typescript
// Increase timeout for specific tests
test('slow operation', async () => {
  // test implementation
}, 10000) // 10 second timeout
```

**2. Mock Issues**
```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
```

**3. Async Testing**
```typescript
// Proper async handling
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument()
})
```

## 📋 Testing Checklist

### ✅ Implemented
- [x] Vitest configuration
- [x] MSW setup with API mocks
- [x] Security tests (auth-bypass, rate-limiting)
- [x] Global test setup and mocks
- [x] Coverage reporting configuration
- [x] Authentication endpoint testing
- [x] Workout management testing

### 🔄 In Progress / Planned
- [ ] Complete E2E test suite with Playwright
- [ ] Performance testing automation
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Cross-browser compatibility tests
- [ ] Mobile device testing
- [ ] Integration with CI/CD pipeline

## 🚀 Test Development Guidelines

### Writing Good Tests
1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test error conditions**
6. **Maintain test data separately**

### Test Naming Convention
```typescript
describe('ComponentName', () => {
  describe('when condition', () => {
    it('should expected behavior', () => {
      // test implementation
    })
  })
})
```

## 📊 Test Metrics and Reporting

### Coverage Reports
- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Report**: Console output during test runs

### Test Reports
- **Vitest UI**: Interactive test runner
- **Console Output**: Real-time test results
- **CI Integration**: JUnit XML format for CI systems

---

**Last Updated**: August 2025  
**Coverage Target**: >90%  
**Test Count**: 50+ tests implemented