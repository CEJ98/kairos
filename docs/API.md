# 🚀 KAIROS FITNESS - API DOCUMENTATION

## 📋 Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users)
  - [Exercises](#exercises)
  - [Workouts](#workouts)
  - [Progress](#progress)
  - [Measurements](#measurements)
  - [Admin](#admin)

---

## 🔐 Authentication

Kairos Fitness uses **NextAuth.js** with JWT tokens for authentication.

### Authentication Flow

1. **Login**: `POST /api/auth/signin`
2. **Session**: JWT token in HTTP-only cookies
3. **Authorization**: Role-based access control (CLIENT, TRAINER, ADMIN)

### Headers Required

```http
Cookie: next-auth.session-token=<jwt-token>
Content-Type: application/json
```

---

## 🛡️ Rate Limiting

All API endpoints are protected with rate limiting:

- **Authentication**: 5 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **File Uploads**: 10 requests per 15 minutes

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2025-08-29T16:00:00Z",
  "requestId": "req_123456789"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## 🔗 API Endpoints

### Authentication Endpoints

#### POST `/api/auth/signin`
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CLIENT"
  },
  "expires": "2025-09-29T16:00:00Z"
}
```

#### POST `/api/auth/signup`
Register new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "CLIENT"
}
```

---

### Users

#### GET `/api/users/profile`
Get current user profile.

**Authentication Required:** Yes

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "CLIENT",
  "avatar": "https://example.com/avatar.jpg",
  "isVerified": true,
  "clientProfile": {
    "age": 25,
    "weight": 70.5,
    "height": 175,
    "fitnessGoal": "MUSCLE_GAIN",
    "activityLevel": "MODERATE"
  },
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### PUT `/api/users/profile`
Update user profile.

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg",
  "clientProfile": {
    "weight": 72.0,
    "fitnessGoal": "WEIGHT_LOSS"
  }
}
```

---

### Exercises

#### GET `/api/exercises`
Get exercises with filtering and pagination.

**Query Parameters:**
- `category` - Filter by category (STRENGTH, CARDIO, FLEXIBILITY)
- `difficulty` - Filter by difficulty (BEGINNER, INTERMEDIATE, ADVANCED)
- `muscleGroup` - Filter by muscle group
- `equipment` - Filter by required equipment
- `search` - Search by name or description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "exercises": [
    {
      "id": "ex123",
      "name": "Push-ups",
      "description": "Classic bodyweight chest exercise",
      "category": "STRENGTH",
      "muscleGroups": ["CHEST", "TRICEPS", "SHOULDERS"],
      "equipments": ["BODYWEIGHT"],
      "difficulty": "BEGINNER",
      "instructions": "1. Start in plank position...",
      "tips": "Keep core engaged...",
      "imageUrl": "https://example.com/pushup.jpg",
      "videoUrl": "https://example.com/pushup.mp4",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### POST `/api/exercises`
Create new exercise (TRAINER/ADMIN only).

**Authentication Required:** Yes (TRAINER or ADMIN)

**Request:**
```json
{
  "name": "Custom Exercise",
  "description": "My custom exercise",
  "category": "STRENGTH",
  "muscleGroups": ["CHEST", "TRICEPS"],
  "equipments": ["DUMBBELL"],
  "difficulty": "INTERMEDIATE",
  "instructions": "Step by step instructions...",
  "tips": "Helpful tips..."
}
```

#### GET `/api/exercises/:id`
Get specific exercise details.

**Response:**
```json
{
  "id": "ex123",
  "name": "Push-ups",
  "description": "Classic bodyweight chest exercise",
  "category": "STRENGTH",
  "muscleGroups": ["CHEST", "TRICEPS"],
  "equipments": ["BODYWEIGHT"],
  "difficulty": "BEGINNER",
  "instructions": "Detailed instructions...",
  "tips": "Helpful tips...",
  "imageUrl": "https://example.com/image.jpg",
  "videoUrl": "https://example.com/video.mp4",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### Workouts

#### GET `/api/workouts`
Get user's workouts or templates.

**Query Parameters:**
- `template` - Get only templates (true/false)
- `assigned` - Get assigned workouts (true/false)
- `created` - Get created workouts (true/false)
- `category` - Filter by category
- `difficulty` - Filter by difficulty

**Response:**
```json
{
  "workouts": [
    {
      "id": "workout123",
      "name": "Upper Body Strength",
      "description": "Focus on chest, back, and arms",
      "category": "STRENGTH",
      "duration": 45,
      "difficulty": "INTERMEDIATE",
      "isTemplate": false,
      "tags": ["upper-body", "strength"],
      "creator": {
        "id": "trainer123",
        "name": "John Trainer"
      },
      "exercises": [
        {
          "id": "we123",
          "order": 1,
          "sets": 3,
          "reps": 12,
          "weight": 20.0,
          "restTime": 60,
          "exercise": {
            "name": "Push-ups",
            "imageUrl": "https://example.com/pushup.jpg"
          }
        }
      ],
      "createdAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

#### POST `/api/workouts`
Create new workout.

**Authentication Required:** Yes

**Request:**
```json
{
  "name": "My Custom Workout",
  "description": "Personal training routine",
  "category": "STRENGTH",
  "duration": 30,
  "difficulty": "BEGINNER",
  "isTemplate": true,
  "tags": ["custom", "beginner"],
  "exercises": [
    {
      "exerciseId": "ex123",
      "order": 1,
      "sets": 3,
      "reps": 15,
      "restTime": 60
    }
  ]
}
```

#### GET `/api/workouts/:id`
Get specific workout with exercises.

**Response:**
```json
{
  "id": "workout123",
  "name": "Upper Body Strength",
  "description": "Focus on chest, back, and arms",
  "category": "STRENGTH",
  "duration": 45,
  "difficulty": "INTERMEDIATE",
  "exercises": [
    {
      "id": "we123",
      "order": 1,
      "sets": 3,
      "reps": 12,
      "weight": 20.0,
      "duration": null,
      "restTime": 60,
      "notes": "Focus on form",
      "exercise": {
        "id": "ex123",
        "name": "Push-ups",
        "description": "Classic bodyweight exercise",
        "instructions": "Step by step...",
        "imageUrl": "https://example.com/pushup.jpg",
        "muscleGroups": ["CHEST", "TRICEPS"]
      }
    }
  ],
  "creator": {
    "id": "trainer123",
    "name": "John Trainer",
    "avatar": "https://example.com/trainer.jpg"
  }
}
```

---

### Progress

#### GET `/api/progress`
Get user's fitness progress data.

**Authentication Required:** Yes

**Query Parameters:**
- `startDate` - Filter from date (ISO 8601)
- `endDate` - Filter to date (ISO 8601)
- `metric` - Specific metric (weight, strength, endurance)

**Response:**
```json
{
  "progress": {
    "weight": [
      {
        "date": "2025-01-01",
        "value": 70.5,
        "unit": "kg"
      }
    ],
    "strength": [
      {
        "exerciseId": "ex123",
        "exerciseName": "Push-ups",
        "date": "2025-01-15",
        "maxReps": 25,
        "maxWeight": 0,
        "volume": 75
      }
    ],
    "sessions": [
      {
        "id": "session123",
        "workoutName": "Upper Body",
        "date": "2025-01-15",
        "duration": 42,
        "caloriesBurned": 320,
        "exercises": 5
      }
    ]
  },
  "summary": {
    "totalSessions": 15,
    "totalDuration": 675,
    "averageDuration": 45,
    "totalCalories": 4800,
    "favoriteExercise": "Push-ups"
  }
}
```

#### POST `/api/progress`
Log workout session or measurement.

**Authentication Required:** Yes

**Request:**
```json
{
  "type": "workout_session",
  "data": {
    "workoutId": "workout123",
    "startTime": "2025-01-15T14:00:00Z",
    "endTime": "2025-01-15T14:45:00Z",
    "exercises": [
      {
        "exerciseId": "ex123",
        "sets": [
          {
            "reps": 12,
            "weight": 20.0,
            "restTime": 60
          }
        ]
      }
    ],
    "notes": "Great workout today!"
  }
}
```

---

### Measurements

#### GET `/api/measurements`
Get user's body measurements history.

**Authentication Required:** Yes

**Response:**
```json
{
  "measurements": [
    {
      "id": "measurement123",
      "date": "2025-01-15",
      "weight": 70.5,
      "bodyFat": 15.2,
      "muscleMass": 32.1,
      "measurements": {
        "chest": 95.0,
        "waist": 80.0,
        "arms": 32.0,
        "thighs": 55.0
      },
      "notes": "Post-workout measurement"
    }
  ]
}
```

#### POST `/api/measurements`
Add new body measurement.

**Authentication Required:** Yes

**Request:**
```json
{
  "date": "2025-01-15",
  "weight": 70.5,
  "bodyFat": 15.2,
  "muscleMass": 32.1,
  "measurements": {
    "chest": 95.0,
    "waist": 80.0,
    "arms": 32.0
  },
  "notes": "Weekly check-in"
}
```

---

### Admin

#### GET `/api/admin/stats`
Get platform statistics (ADMIN only).

**Authentication Required:** Yes (ADMIN)

**Response:**
```json
{
  "users": {
    "total": 1250,
    "clients": 1000,
    "trainers": 45,
    "admins": 5,
    "activeToday": 156
  },
  "workouts": {
    "total": 2840,
    "templates": 125,
    "completed": 15630
  },
  "exercises": {
    "total": 450,
    "byCategory": {
      "STRENGTH": 280,
      "CARDIO": 120,
      "FLEXIBILITY": 50
    }
  },
  "revenue": {
    "monthly": 12500.00,
    "yearly": 125000.00,
    "subscriptions": {
      "active": 856,
      "cancelled": 45
    }
  }
}
```

#### GET `/api/admin/users`
Get all users with filtering (ADMIN only).

**Authentication Required:** Yes (ADMIN)

**Query Parameters:**
- `role` - Filter by role
- `status` - Filter by verification status
- `page` - Page number
- `limit` - Items per page

---

## 🔗 Webhook Endpoints

### Stripe Webhooks

#### POST `/api/stripe/webhooks`
Handle Stripe payment events.

**Events Handled:**
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

---

## 🛠️ Development

### Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed database
npm run db:seed

# Start development server
npm run dev
```

### Testing API

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test:integration
npm run test:security
```

---

## 📚 Additional Resources

- [Security Documentation](./SECURITY.md)
- [Testing Guide](./TESTING.md)
- [Project Completion Report](./PROJECT_COMPLETION.md)
- [Environment Variables](./.env.example)

---

**🏆 Kairos Fitness API - Production Ready Enterprise Platform**