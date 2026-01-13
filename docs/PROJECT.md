# Daily - Project Documentation

## Overview

Daily is a productivity and habit tracking mobile app built with React Native and Expo. It helps users manage todos, build habits, organize projects, and capture ideas through an inbox system.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native with Expo SDK 54 |
| Routing | Expo Router (file-based) |
| State Management | React Context + React Query |
| Backend | Hono + tRPC |
| Database | Rork DB (SurrealDB) |
| Authentication | JWT with bcrypt password hashing |
| Storage | AsyncStorage (data), SecureStore (tokens) |
| Icons | lucide-react-native |

---

## Project Structure

```
app/
├── _layout.tsx           # Root layout with providers
├── index.tsx             # Home/Today screen
├── habits.tsx            # Habits tracking screen
├── inbox.tsx             # Quick capture inbox
├── menu.tsx              # Settings/profile menu
├── add-todo.tsx          # Modal: Add/edit todo
├── add-habit.tsx         # Modal: Add/edit habit
├── add-project.tsx       # Modal: Add/edit project
├── projects.tsx          # Projects list
├── project/[id].tsx      # Project detail screen
├── later.tsx             # Later/someday items
├── brain-dump.tsx        # Brain dump capture
├── privacy-policy.tsx    # Privacy policy
├── (onboarding)/         # Onboarding flow screens
│   ├── splash.tsx
│   ├── welcome.tsx
│   ├── feeling.tsx
│   ├── login.tsx
│   ├── email.tsx
│   ├── password.tsx
│   ├── create-password.tsx
│   ├── forgot-password.tsx
│   └── reset-password.tsx

backend/
├── hono.ts               # Hono server setup
├── db.ts                 # Database connection
└── trpc/
    ├── app-router.ts     # tRPC router definition
    ├── create-context.ts # tRPC context
    └── routes/
        ├── auth.ts       # Authentication endpoints
        └── example.ts    # Example route

contexts/
├── AuthContext.tsx       # Authentication state
├── TodoContext.tsx       # Todo management
├── HabitContext.tsx      # Habit tracking
├── ProjectContext.tsx    # Projects/goals
├── InboxContext.tsx      # Inbox items
├── NoteContext.tsx       # Daily notes
├── LaterContext.tsx      # Later/someday items
├── BrainDumpContext.tsx  # Brain dump items
└── OnboardingContext.tsx # Onboarding state

components/
├── BottomNavBar.tsx      # Navigation bar
├── AddOptionsModal.tsx   # Quick add modal
├── CelebrationOverlay.tsx# Completion celebration
├── HabitHeatmap.tsx      # Habit visualization
├── WeeklyProgress.tsx    # Weekly stats
├── SwipeableRow.tsx      # Swipeable list item
├── ReflectionModal.tsx   # Daily reflection
├── DailySummaryModal.tsx # End of day summary
├── DatePickerModal.tsx   # Date selection
└── PriorityPickerModal.tsx # Priority picker

types/
├── auth.ts               # Auth types
├── todo.ts               # Todo interface
├── habit.ts              # Habit interfaces
├── project.ts            # Project types
├── inbox.ts              # Inbox types
├── note.ts               # Note types
├── later.ts              # Later item types
├── braindump.ts          # Brain dump types
└── onboarding.ts         # Onboarding types
```

---

## Data Models

### Todo
```typescript
interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate: string;           // YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high';
}
```

### Habit
```typescript
interface Habit {
  id: string;
  name: string;
  emoji?: string;
  createdAt: string;
  completedDates: string[];  // Array of YYYY-MM-DD
  currentStreak: number;
  bestStreak: number;
  intention?: ImplementationIntention;
  whyStatement?: string;
  celebrationPhrase?: string;
}
```

### Project
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  type: 'project' | 'goal';
  deadline?: string;
  tasks: ProjectTask[];
  createdAt: string;
  completedAt?: string;
}
```

### User (Auth)
```typescript
interface User {
  id: string;
  email: string;
  createdAt: string;
}
```

---

## Authentication Flow

1. **Splash Screen** → Welcome → Onboarding questions
2. **Signup**: Email → Create Password → Home
3. **Login**: Email → Password → Home
4. **Forgot Password**: Email → Reset Code → New Password

Token storage:
- Native: `expo-secure-store`
- Web: `localStorage` (polyfilled)

---

## Navigation Structure

The app uses **stack-based navigation** (not tabs):

- Main screens navigate via `BottomNavBar` component
- Modals use `presentation: "modal"` in Stack.Screen
- Protected routes redirect unauthenticated users to onboarding

---

## Context Providers (Hierarchy)

```
trpc.Provider
└── QueryClientProvider
    └── AuthProvider
        └── HabitProvider
            └── TodoProvider
                └── NoteProvider
                    └── InboxProvider
                        └── ProjectProvider
                            └── GestureHandlerRootView
                                └── RootLayoutNav
```

---

## Storage Keys

| Key | Purpose |
|-----|---------|
| `daily_habits` | Habit data |
| `daily_todos` | Todo items |
| `daily_notes` | Daily notes |
| `daily_projects` | Projects/goals |
| `inbox_items` | Inbox captures |
| `brain_dump_items` | Brain dump |
| `later_items` | Someday/maybe |
| `@daily_onboarding` | Onboarding state |
| `daily_auth_token` | JWT token (SecureStore) |
| `daily_auth_user` | Cached user (SecureStore) |

---

## Backend API Routes

### Auth (`/api/trpc/auth.*`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `signup` | mutation | Create new account |
| `login` | mutation | Authenticate user |
| `verifyToken` | mutation | Validate JWT |
| `deleteAccount` | mutation | Delete user account |
| `requestPasswordReset` | mutation | Send reset code |
| `verifyResetCode` | mutation | Verify reset code |
| `resetPassword` | mutation | Set new password |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_RORK_DB_ENDPOINT` | Database endpoint |
| `EXPO_PUBLIC_RORK_DB_NAMESPACE` | Database namespace |
| `EXPO_PUBLIC_RORK_DB_TOKEN` | Database auth token |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | API base URL |
| `EXPO_PUBLIC_PROJECT_ID` | Rork project ID |

---

## Key Features

- **Today View**: Daily todos with priority levels and due dates
- **Habits**: Streak tracking, heatmap visualization, implementation intentions
- **Projects**: Task lists with progress tracking, deadlines
- **Inbox**: Quick capture for ideas and tasks
- **Brain Dump**: Free-form thought capture
- **Later**: Someday/maybe list for deferred items
- **Celebration**: Visual feedback when completing all daily habits

---

## Design Patterns

1. **State**: Context + AsyncStorage for persistence, React Query for server state
2. **Forms**: Modal-based input screens
3. **Lists**: Swipeable rows with delete/edit actions
4. **Navigation**: Custom bottom nav with haptic feedback
5. **Dates**: ISO format (YYYY-MM-DD) throughout

---

## Platform Compatibility

The app supports:
- iOS (native)
- Android (native)
- Web (React Native Web)

Platform-specific handling exists for:
- SecureStore → localStorage fallback
- DateTimePicker → Custom web picker
- Haptics → Polyfilled for web
