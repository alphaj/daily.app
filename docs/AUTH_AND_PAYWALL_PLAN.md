# Auth + RevenueCat Paywall Plan
## Daily App - High-Conversion Implementation

---

## Table of Contents
1. [Strategy Overview](#strategy-overview)
2. [Free vs Premium Feature Split](#free-vs-premium-feature-split)
3. [Auth System Design](#auth-system-design)
4. [Paywall Design](#paywall-design)
5. [Screen-by-Screen Specs](#screen-by-screen-specs)
6. [Backend Architecture](#backend-architecture)
7. [RevenueCat Integration](#revenuecat-integration)
8. [Data Migration Strategy](#data-migration-strategy)
9. [Conversion Optimization Tactics](#conversion-optimization-tactics)
10. [File Changes Map](#file-changes-map)
11. [Implementation Phases](#implementation-phases)

---

## 1. Strategy Overview

### Core Principle: Value-First, Friction-Last

The #1 conversion killer is asking users to commit before they see value.
Daily already has a strong onboarding flow that builds emotional investment.
We extend this pattern:

```
Onboarding (existing) -> Use App Free (build habit) -> Hit Premium Trigger -> Soft Paywall -> Auth (to purchase) -> Subscribe
```

### Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Auth timing | **Delayed** - after onboarding, optional until purchase | Users who enter data before signing up convert 3x higher |
| Auth methods | **Apple Sign In + Google Sign In + Email** | One-tap auth removes the #1 signup friction point |
| Paywall model | **Freemium + Soft Paywall** | Let users get hooked on free tier, upgrade for power features |
| Paywall trigger | **Feature-gated + milestone-based** | Show paywall when user hits a limit OR achieves a win |
| Trial | **7-day free trial** on annual plan | Trials convert 2-3x better than no trial |
| Pricing | **Weekly / Annual** with annual savings | Two options = less decision paralysis than three |

---

## 2. Free vs Premium Feature Split

### Guiding Principle
Free tier must be **genuinely useful** (not crippled) so users build daily habits.
Premium unlocks **power features** that users naturally want after 3-7 days.

### Feature Matrix

| Feature | Free | Premium |
|---------|------|---------|
| **Todos** | Up to 5 active per day | Unlimited |
| **Habits** | Up to 3 habits | Unlimited habits |
| **Projects** | 1 active project | Unlimited projects |
| **Inbox Capture** | Unlimited | Unlimited |
| **Groceries** | Full access | Full access |
| **Calendar Events** | Full access | Full access |
| **Daily Journal** | 1 entry/day (text only) | Unlimited + photos + voice |
| **Supplements** | Up to 3 | Unlimited |
| **Later List** | Up to 10 items | Unlimited |
| **Brain Dump** | Full access | Full access |
| **History** | Last 7 days | Full history |
| **Habit Heatmap** | Last 7 days | Full heatmap + stats |
| **Daily Summary** | Basic | Detailed + insights |
| **Reflection Modal** | Not available | Full access |
| **Celebration Overlay** | Basic | Enhanced animations |
| **Work Mode** | Not available | Full access |
| **Themes/Customization** | Default only | Custom themes + colors |
| **Cloud Sync** | Not available | Cross-device sync |
| **Data Export** | Not available | CSV/JSON export |
| **Priority/Energy Levels** | Not available | Full access on todos |
| **Widgets** | Not available | Home screen widgets |

### Why This Split Works
- **Inbox, Groceries, Calendar, Brain Dump** = free hooks that create daily app opens
- **3 habits + 5 todos + 1 project** = enough to see value, not enough for power users
- **7-day history limit** = users see their data disappearing, creates urgency
- **Cloud sync as premium** = once they have data, they want to protect it

---

## 3. Auth System Design

### 3.1 Auth Flow Architecture

```
                    ┌──────────────┐
                    │  App Launch   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Check Token  │
                    │  (SecureStore)│
                    └──────┬───────┘
                           │
                ┌──────────┼──────────┐
                │ Has Token│          │ No Token
                ▼          │          ▼
        ┌───────────┐     │  ┌──────────────┐
        │ Validate   │     │  │ Check if      │
        │ JWT w/API  │     │  │ onboarded?    │
        └─────┬─────┘     │  └──────┬───────┘
              │            │         │
        ┌─────▼─────┐     │  ┌──────▼───────┐   ┌──────────────┐
        │ Valid:     │     │  │ Yes: Home    │──▶│ Anonymous     │
        │ Home Screen│     │  │ (Anonymous)  │   │ User Mode    │
        └───────────┘     │  └──────────────┘   └──────────────┘
                          │         │
                          │  ┌──────▼───────┐
                          │  │ No: Onboard  │
                          │  │ Flow         │
                          └──└──────────────┘
```

### 3.2 Auth Methods (Priority Order)

#### A. Apple Sign In (iOS - Required by App Store if you offer any social login)
- Package: `expo-apple-authentication`
- One-tap auth, highest conversion on iOS
- Returns: user ID, email, full name (first sign-in only)
- No password to remember = lowest friction

#### B. Google Sign In
- Package: `expo-auth-session` + Google provider
- One-tap auth for Android users + fallback on iOS
- Returns: user ID, email, name, avatar

#### C. Email + Password (Fallback)
- For users who don't want social auth
- Use existing `bcryptjs` + `jsonwebtoken` packages
- Requires email verification (send magic link or 6-digit code)
- Consider **magic link only** (no password) to reduce friction further

### 3.3 Auth State Management

New file: `contexts/AuthContext.tsx`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;        // using app without account
  isPremium: boolean;           // RevenueCat subscription status
  isLoading: boolean;
  token: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: 'apple' | 'google' | 'email';
  createdAt: string;
  subscriptionStatus: 'free' | 'trial' | 'premium' | 'expired';
  trialEndsAt: string | null;
}

// Methods
interface AuthActions {
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}
```

### 3.4 Token Management
- Store JWT in `expo-secure-store` (native) / encrypted localStorage (web)
- Access token: 15-minute expiry
- Refresh token: 30-day expiry, stored separately
- Auto-refresh on 401 response via tRPC link middleware
- Clear tokens on sign out + revoke refresh token server-side

### 3.5 Anonymous-to-Authenticated Migration
When an anonymous user signs up:
1. Collect all local AsyncStorage data
2. Send to server in a single `migrate` API call
3. Server creates user record + stores all their data
4. Local data becomes cached copy of server data
5. Enable cloud sync going forward

---

## 4. Paywall Design

### 4.1 Paywall Trigger Points (When to Show)

#### Trigger A: Feature Gate (Immediate)
User tries to use a premium feature -> show paywall inline.
Examples:
- Tapping "Add Habit" when at 3 habit limit
- Trying to add a 6th todo for the day
- Tapping "Work Mode" toggle
- Opening History past 7 days

**Implementation**: `usePremiumGate()` hook that wraps premium actions.

```typescript
const { isPremium, showPaywall } = usePremiumGate();

const handleAddHabit = () => {
  if (!isPremium && habits.length >= 3) {
    showPaywall({ trigger: 'habit_limit', context: 'You have 3 habits. Unlock unlimited habits.' });
    return;
  }
  router.push('/add-habit');
};
```

#### Trigger B: Milestone Celebration (Emotional High)
User completes a meaningful action -> celebrate -> suggest premium.
This is the **highest converting** trigger because the user is feeling good.

Examples:
- Completing all todos for the day: "Amazing day! Want to track even more tomorrow?"
- 7-day habit streak: "You're on fire! Unlock detailed stats to keep going."
- First project completed: "You crushed it! Upgrade for unlimited projects."
- 3 days of journaling: "Building a great reflection habit! Upgrade for photos + voice."

**Implementation**: Check milestones in `CelebrationOverlay` and `DailySummaryModal`.

#### Trigger C: Soft Paywall Screen (After Onboarding)
Show a **skippable** paywall screen after the onboarding `welcome.tsx` screen.
- This is the first impression of premium
- Must be beautiful, fast, and easy to dismiss
- Show 7-day free trial prominently
- "Not now" link clearly visible (don't hide it)

#### Trigger D: Settings Upsell (Passive)
- Premium banner in menu.tsx settings screen
- Shows current plan status
- "Upgrade to Premium" row with sparkle icon

### 4.2 Paywall Screen Design (The Money Screen)

#### Layout (Top to Bottom):

```
┌─────────────────────────────────────┐
│          [X close]        [Restore] │
│                                     │
│         ✦ Daily Premium ✦          │
│                                     │
│    "Your life, fully organized"     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ✓ Unlimited habits         │   │
│  │  ✓ Unlimited todos          │   │
│  │  ✓ Unlimited projects       │   │
│  │  ✓ Cloud sync & backup      │   │
│  │  ✓ Full history & stats     │   │
│  │  ✓ Work mode & priorities   │   │
│  │  ✓ Journal with photos      │   │
│  │  ✓ Custom themes            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  BEST VALUE          SAVE 70%│  │
│  │                              │  │
│  │  Annual   $29.99/year        │  │
│  │           $2.49/mo           │  │
│  │  ☐ 7-day free trial          │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Weekly   $1.99/week         │  │
│  │           billed weekly      │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     ★ Start Free Trial ★     │  │
│  │                               │  │
│  │   7 days free, then $29.99/yr │  │
│  └──────────────────────────────┘  │
│                                     │
│        Terms · Privacy · Restore    │
│                                     │
└─────────────────────────────────────┘
```

#### Conversion Optimization Details:

1. **Two pricing options only** (not three) - reduces decision fatigue
2. **Annual pre-selected** with "BEST VALUE" badge + "SAVE 70%" callout
3. **Show monthly equivalent** ($2.49/mo) to anchor against weekly price
4. **7-day free trial** on annual only - incentivizes the higher-value plan
5. **CTA says "Start Free Trial"** not "Subscribe" - lower perceived commitment
6. **Close button visible** but subtle (X in top-left) - don't trap users
7. **Restore Purchases** link in top-right - required by App Store
8. **Feature list uses checkmarks** - positive visual reinforcement
9. **No "free plan" option on this screen** - just close to stay on free

### 4.3 Contextual Paywall Variants

Different triggers show different hero text:

| Trigger | Hero Text | Subtext |
|---------|-----------|---------|
| Post-onboarding | "Your life, fully organized" | "Start your 7-day free trial" |
| Habit limit hit | "Build unlimited habits" | "You're building great momentum" |
| Todo limit hit | "Capture everything" | "Never lose a task again" |
| Project limit hit | "Dream bigger" | "Manage all your goals in one place" |
| History limit | "See your full journey" | "Track your progress over time" |
| 7-day streak | "You're on a roll!" | "Unlock stats to keep your streak alive" |
| All todos done | "Incredible day!" | "Do even more tomorrow with Premium" |
| Work mode gate | "Unlock Focus Mode" | "Separate work and personal seamlessly" |

### 4.4 Pricing Strategy

| Plan | Price | Per Month | Free Trial |
|------|-------|-----------|------------|
| Weekly | $1.99/week | ~$8.63/mo | No |
| Annual | $29.99/year | $2.49/mo | 7-day |

**Why this pricing:**
- Weekly exists as a **price anchor** to make annual look like a steal (70% savings)
- $29.99/year is the sweet spot for productivity apps (Todoist = $48, Habitica = $48)
- Annual trial converts better because users forget to cancel (industry standard: ~60% trial-to-paid)
- No monthly option: forces choice between cheap-annual and expensive-weekly

---

## 5. Screen-by-Screen Specs

### 5.1 New Screens to Create

#### A. `app/(auth)/sign-in.tsx` - Sign In Screen

```
Purpose: Primary authentication screen
When shown: User taps "Sign In" from menu, or after purchase attempt
Design: Clean, minimal, matches app aesthetic

Layout:
- App logo + "Welcome back" heading
- [Continue with Apple] button (dark, full-width) -- iOS only
- [Continue with Google] button (white, full-width)
- Divider: "or"
- Email input field
- Password input field
- [Sign In] button
- "Don't have an account? Sign up" link
- "Forgot password?" link
- Bottom: Terms of Service · Privacy Policy
```

#### B. `app/(auth)/sign-up.tsx` - Sign Up Screen

```
Purpose: New account creation
When shown: User taps "Sign up" link from sign-in
Design: Similar to sign-in, with name field added

Layout:
- App logo + "Create your account" heading
- [Continue with Apple] button -- iOS only
- [Continue with Google] button
- Divider: "or"
- Name input field
- Email input field
- Password input field (with strength indicator)
- [Create Account] button
- "Already have an account? Sign in" link
- Bottom: Terms of Service · Privacy Policy
```

#### C. `app/(auth)/forgot-password.tsx` - Password Reset

```
Purpose: Password recovery via email
Layout:
- "Reset your password" heading
- "Enter your email and we'll send you a reset link"
- Email input field
- [Send Reset Link] button
- "Back to sign in" link
```

#### D. `app/paywall.tsx` - Main Paywall Screen

```
Purpose: Premium subscription upsell
Presentation: Modal (slide up from bottom)
When shown: Feature gates, milestones, post-onboarding, settings tap

Layout: See Section 4.2 above

Props/Params:
- trigger: string (what triggered the paywall)
- heroText?: string (custom headline)
- subText?: string (custom subtitle)

Behavior:
- Animate in from bottom with spring animation
- Close button (X) dismisses modal
- Plan cards are tappable (highlight selected)
- CTA button initiates RevenueCat purchase flow
- On success: dismiss + show success animation
- On cancel/fail: stay on screen with message
- Track: trigger source, time on screen, plan selected, outcome
```

#### E. `app/(auth)/verify-email.tsx` - Email Verification

```
Purpose: Verify email after signup
Layout:
- "Check your email" heading
- Envelope animation (Lottie)
- "We sent a verification code to {email}"
- 6-digit code input (auto-advance)
- [Verify] button
- "Resend code" link (with cooldown timer)
```

### 5.2 Modified Screens

#### F. `app/(onboarding)/welcome.tsx` - MODIFIED

After "Let's begin" button, navigate to paywall modal instead of directly to home.

```
Current flow:  welcome -> home
New flow:      welcome -> paywall (skippable) -> home
```

Changes:
- After `completeOnboarding()`, push to `/paywall?trigger=onboarding` instead of `/`
- Add `skipPaywall` param handling in case user dismisses

#### G. `app/menu.tsx` - MODIFIED

Add auth section and premium status.

```
New sections:
- [Account Section] at top
  - If anonymous: "Sign in to sync your data" banner
  - If authenticated: Avatar + Name + Email
  - Premium badge if subscribed

- [Premium Section]
  - If free: "Upgrade to Premium ✦" row with gradient background
  - If premium: "Premium ✦" badge + "Manage Subscription" row
  - Subscription status + renewal date

- [Account Management] (authenticated only)
  - Change Password
  - Delete Account (with confirmation)

- Existing sections remain
```

#### H. `app/index.tsx` - MODIFIED

Add premium gates to todo/habit actions.

```
Changes:
- Todo add: check if < 5 (free) or unlimited (premium)
- Show subtle "upgrade" pill next to limit indicators
- Premium features show lock icon when not subscribed
```

#### I. `app/_layout.tsx` - MODIFIED

Add AuthProvider to context hierarchy.

```
New provider order:
trpc.Provider
└── QueryClientProvider
    └── AuthProvider           <-- NEW (outermost data provider)
        └── PremiumProvider    <-- NEW (subscription status)
            └── [existing providers...]
```

### 5.3 New Components

#### J. `components/PremiumBadge.tsx`
Small "PRO" or "✦" badge to indicate premium features in UI.

#### K. `components/PremiumGate.tsx`
Wrapper component that shows lock overlay on premium-only features.

```typescript
<PremiumGate feature="work_mode">
  <WorkModeToggle />
</PremiumGate>
```

#### L. `components/AuthPromptBanner.tsx`
Dismissible banner shown on home screen for anonymous users:
"Sign in to back up your data" with a subtle gradient background.

#### M. `components/SubscriptionStatusCard.tsx`
Card for menu screen showing current plan, renewal date, trial status.

---

## 6. Backend Architecture

### 6.1 Database Schema (SurrealDB)

```sql
-- Users table
DEFINE TABLE users SCHEMAFULL;
DEFINE FIELD email ON users TYPE string ASSERT string::is::email($value);
DEFINE FIELD password_hash ON users TYPE option<string>;
DEFINE FIELD name ON users TYPE string;
DEFINE FIELD avatar_url ON users TYPE option<string>;
DEFINE FIELD auth_provider ON users TYPE string ASSERT $value IN ['apple', 'google', 'email'];
DEFINE FIELD auth_provider_id ON users TYPE option<string>;
DEFINE FIELD subscription_status ON users TYPE string DEFAULT 'free';
DEFINE FIELD rc_customer_id ON users TYPE option<string>;  -- RevenueCat customer ID
DEFINE FIELD trial_ends_at ON users TYPE option<datetime>;
DEFINE FIELD created_at ON users TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON users TYPE datetime DEFAULT time::now();
DEFINE INDEX email_idx ON users FIELDS email UNIQUE;
DEFINE INDEX provider_idx ON users FIELDS auth_provider, auth_provider_id UNIQUE;

-- Refresh tokens table
DEFINE TABLE refresh_tokens SCHEMAFULL;
DEFINE FIELD user_id ON refresh_tokens TYPE record<users>;
DEFINE FIELD token ON refresh_tokens TYPE string;
DEFINE FIELD expires_at ON refresh_tokens TYPE datetime;
DEFINE FIELD created_at ON refresh_tokens TYPE datetime DEFAULT time::now();
DEFINE INDEX token_idx ON refresh_tokens FIELDS token UNIQUE;

-- User data tables (for cloud sync)
DEFINE TABLE user_habits SCHEMAFULL;
DEFINE FIELD user_id ON user_habits TYPE record<users>;
DEFINE FIELD data ON user_habits TYPE object;  -- serialized habit data
DEFINE FIELD updated_at ON user_habits TYPE datetime DEFAULT time::now();
DEFINE INDEX user_habits_idx ON user_habits FIELDS user_id UNIQUE;

-- (Similar tables for todos, projects, supplements, etc.)
```

### 6.2 API Routes (tRPC)

#### Auth Router: `backend/trpc/routes/auth.ts`

```typescript
auth: {
  // Public routes
  signUpWithEmail: publicProcedure
    .input(z.object({ email, password, name }))
    .mutation(/* create user, hash password, return tokens */),

  signInWithEmail: publicProcedure
    .input(z.object({ email, password }))
    .mutation(/* verify password, return tokens */),

  signInWithApple: publicProcedure
    .input(z.object({ identityToken, authorizationCode, fullName? }))
    .mutation(/* verify with Apple, create/find user, return tokens */),

  signInWithGoogle: publicProcedure
    .input(z.object({ idToken }))
    .mutation(/* verify with Google, create/find user, return tokens */),

  refreshToken: publicProcedure
    .input(z.object({ refreshToken }))
    .mutation(/* validate refresh token, return new access token */),

  forgotPassword: publicProcedure
    .input(z.object({ email }))
    .mutation(/* send reset email */),

  resetPassword: publicProcedure
    .input(z.object({ token, newPassword }))
    .mutation(/* verify reset token, update password */),

  verifyEmail: publicProcedure
    .input(z.object({ email, code }))
    .mutation(/* verify email code */),

  // Protected routes
  getProfile: protectedProcedure
    .query(/* return user profile */),

  updateProfile: protectedProcedure
    .input(z.object({ name?, avatarUrl? }))
    .mutation(/* update user profile */),

  deleteAccount: protectedProcedure
    .mutation(/* delete user + all data */),

  signOut: protectedProcedure
    .mutation(/* revoke refresh token */),
}
```

#### Subscription Router: `backend/trpc/routes/subscription.ts`

```typescript
subscription: {
  // Webhook endpoint (called by RevenueCat)
  webhook: publicProcedure
    .input(z.object({ /* RevenueCat webhook payload */ }))
    .mutation(/* update user subscription status */),

  // Protected routes
  getStatus: protectedProcedure
    .query(/* return current subscription status from RevenueCat */),

  syncStatus: protectedProcedure
    .mutation(/* sync RevenueCat status to our DB */),
}
```

#### Sync Router: `backend/trpc/routes/sync.ts`

```typescript
sync: {
  // Protected routes (premium only)
  pushData: protectedProcedure
    .input(z.object({ habits, todos, projects, ... }))
    .mutation(/* upload local data to server */),

  pullData: protectedProcedure
    .query(/* download server data to local */),

  migrate: protectedProcedure
    .input(z.object({ /* all local data */ }))
    .mutation(/* one-time migration from anonymous to authenticated */),
}
```

### 6.3 Auth Middleware

```typescript
// backend/trpc/middleware/auth.ts
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const token = ctx.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) throw new TRPCError({ code: 'UNAUTHORIZED' });

  const payload = await verifyJWT(token);
  const user = await db.query('SELECT * FROM users WHERE id = $id', { id: payload.userId });

  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

  return next({ ctx: { ...ctx, user } });
});

const protectedProcedure = t.procedure.use(isAuthenticated);
```

---

## 7. RevenueCat Integration

### 7.1 Setup

#### Dependencies
```bash
npx expo install react-native-purchases
```

#### Configuration
```typescript
// lib/revenuecat.ts
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEYS = {
  ios: 'appl_XXXXXXXX',       // RevenueCat iOS API key
  android: 'goog_XXXXXXXX',   // RevenueCat Android API key
};

export const initRevenueCat = async (userId?: string) => {
  const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

  await Purchases.configure({
    apiKey,
    appUserID: userId || null,  // null = anonymous, set after auth
  });
};

export const identifyUser = async (userId: string) => {
  await Purchases.logIn(userId);
};

export const logoutUser = async () => {
  await Purchases.logOut();
};
```

### 7.2 RevenueCat Dashboard Setup

#### Products
| Product ID | Platform | Type | Price | Trial |
|-----------|----------|------|-------|-------|
| `daily_premium_weekly` | iOS + Android | Auto-Renewable | $1.99/wk | None |
| `daily_premium_annual` | iOS + Android | Auto-Renewable | $29.99/yr | 7-day |

#### Entitlements
| Entitlement | Description | Products |
|-------------|-------------|----------|
| `premium` | All premium features | weekly, annual |

#### Offerings
| Offering | Description | Packages |
|----------|-------------|----------|
| `default` | Standard paywall | weekly, annual |

### 7.3 Premium Context

New file: `contexts/PremiumContext.tsx`

```typescript
interface PremiumState {
  isPremium: boolean;
  isTrialing: boolean;
  currentPlan: 'free' | 'weekly' | 'annual';
  expiresAt: Date | null;
  offerings: PurchasesOfferings | null;
  isLoading: boolean;
}

interface PremiumActions {
  checkEntitlements: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  showPaywall: (config: PaywallConfig) => void;
}
```

### 7.4 Purchase Flow

```
User taps CTA ->
  Check if authenticated ->
    No: Show auth screen first, then return to paywall ->
    Yes: Continue
  Call Purchases.purchasePackage(selectedPackage) ->
    Success:
      Update PremiumContext
      Sync with backend (RevenueCat webhook also fires)
      Dismiss paywall
      Show success animation
    Cancelled:
      Stay on paywall, no action
    Error:
      Show error message, allow retry
```

### 7.5 RevenueCat Webhook (Server-Side)

```
RevenueCat -> POST /api/trpc/subscription.webhook ->
  Parse event type:
    INITIAL_PURCHASE: Set user subscription_status = 'premium'
    RENEWAL: Update expiration date
    CANCELLATION: Mark for downgrade at period end
    EXPIRATION: Set subscription_status = 'free'
    BILLING_ISSUE: Flag account, send email
```

---

## 8. Data Migration Strategy

### 8.1 Anonymous to Authenticated Flow

When a user who has been using the app anonymously decides to sign up:

```
1. User taps "Sign In" or triggers purchase
2. Auth flow completes -> user account created
3. System detects existing local data (AsyncStorage keys)
4. Prompt: "We found existing data on this device. Sync it to your account?"
5. User confirms
6. Bundle all local data into migration payload:
   - Habits + completion history
   - Todos + completion history
   - Projects + tasks
   - Supplements + logs
   - Journal entries
   - Inbox items
   - Later items
   - Grocery lists
   - Calendar events
   - Brain dumps
   - Onboarding responses
7. Send to server via sync.migrate endpoint
8. Server stores, returns confirmation
9. Local data now backed by server
10. Enable cloud sync going forward
```

### 8.2 Multi-Device Sync (Premium Only)

```
On app open (authenticated + premium):
  1. Pull latest data from server
  2. Merge with local changes (last-write-wins per item)
  3. Push merged result back to server

On data change:
  1. Update local state (immediate)
  2. Queue server sync (debounced, 5s)
  3. Push to server when queue flushes

Conflict resolution: Last-write-wins using updated_at timestamps
```

---

## 9. Conversion Optimization Tactics

### 9.1 Psychology-Based Triggers

| Tactic | Implementation | Why It Works |
|--------|----------------|-------------|
| **Loss aversion** | "Your 7-day streak data will only show for 24 more hours" | People fear losing what they have |
| **Endowment effect** | Let users USE premium features in trial, then take away | Harder to give up something you've used |
| **Social proof** | "Join 10,000+ people organizing their lives" (once you have users) | Reduces perceived risk |
| **Anchoring** | Show weekly price ($8.63/mo equiv) next to annual ($2.49/mo) | Annual feels like a steal |
| **Scarcity** | "Limited: 50% off your first year" (launch pricing) | Creates urgency |
| **Reciprocity** | Give free users a taste of premium on day 3 (24hr preview) | They feel they owe something back |
| **Commitment** | After onboarding investment, paywall feels like next step | Sunk cost drives conversion |
| **Celebration timing** | Show paywall after a win (streak, all todos done) | Positive emotional state = more likely to buy |

### 9.2 Tactical Conversion Features

#### A. Smart Trial Activation
Don't show trial paywall immediately after onboarding if the user seems rushed.
Instead, wait for a "value moment":
- After adding their first 3 habits
- After completing their first todo
- After 2nd app open on a different day

```typescript
// In PremiumContext
const shouldShowTrialPrompt = () => {
  const appOpens = getAppOpenCount();
  const hasCompletedATodo = getCompletedTodoCount() > 0;
  const hasSeenPaywall = getPaywallViewCount() > 0;

  return appOpens >= 2 && hasCompletedATodo && !hasSeenPaywall;
};
```

#### B. Limit Warnings (Not Blocking)
Don't block immediately at limits. Show a warning first:
- At 4/5 todos: "1 todo slot remaining today"
- At 3/3 habits: "You've maxed out free habits"
- Then block at the limit with paywall

#### C. Premium Feature Previews
Show premium features in the UI but slightly grayed out with a lock icon.
Users can see what they're missing every time they use the app.

#### D. "Why Premium?" Tooltip
When showing lock icons, tapping shows a tooltip:
"This is a Premium feature. Upgrade to unlock unlimited habits, cloud sync, and more."

#### E. Win-Back Flow (Expired Subscribers)
If subscription expires:
- Show "We miss you" banner on home
- Offer a comeback discount (30% off) for 48 hours
- Highlight what they're losing (their data is still there, just limited)

### 9.3 Analytics Events to Track

| Event | Properties | Purpose |
|-------|------------|---------|
| `paywall_viewed` | trigger, source_screen | Know what drives views |
| `paywall_dismissed` | trigger, time_on_screen | Know friction points |
| `plan_selected` | plan_id, trigger | Know preferences |
| `purchase_initiated` | plan_id, trigger | Measure intent |
| `purchase_completed` | plan_id, revenue, trigger | Track revenue |
| `purchase_failed` | plan_id, error, trigger | Debug issues |
| `trial_started` | plan_id | Track trial adoption |
| `trial_converted` | plan_id, days_used | Measure trial success |
| `trial_expired` | plan_id, days_used | Measure trial failure |
| `feature_gate_hit` | feature, current_usage | Know which limits matter |
| `auth_started` | method, trigger | Track auth funnel |
| `auth_completed` | method, is_new_user | Measure auth success |
| `auth_failed` | method, error | Debug auth issues |

---

## 10. File Changes Map

### New Files

| File | Purpose |
|------|---------|
| `contexts/AuthContext.tsx` | Auth state management |
| `contexts/PremiumContext.tsx` | Subscription/premium state |
| `lib/revenuecat.ts` | RevenueCat initialization + helpers |
| `lib/auth.ts` | Auth utility functions (token storage, validation) |
| `app/(auth)/sign-in.tsx` | Sign in screen |
| `app/(auth)/sign-up.tsx` | Sign up screen |
| `app/(auth)/forgot-password.tsx` | Password reset |
| `app/(auth)/verify-email.tsx` | Email verification |
| `app/(auth)/_layout.tsx` | Auth layout |
| `app/paywall.tsx` | Paywall modal screen |
| `components/PremiumBadge.tsx` | "PRO" badge component |
| `components/PremiumGate.tsx` | Premium feature gate wrapper |
| `components/AuthPromptBanner.tsx` | Sign-in prompt banner |
| `components/SubscriptionStatusCard.tsx` | Plan status card |
| `hooks/usePremiumGate.ts` | Hook for checking premium access |
| `hooks/usePaywall.ts` | Hook for showing paywall |
| `backend/trpc/routes/auth.ts` | Auth API routes |
| `backend/trpc/routes/subscription.ts` | Subscription API routes |
| `backend/trpc/routes/sync.ts` | Data sync API routes |
| `backend/trpc/middleware/auth.ts` | Auth middleware |
| `types/auth.ts` | Auth type definitions |
| `types/subscription.ts` | Subscription type definitions |
| `constants/premium.ts` | Feature limits, plan IDs |

### Modified Files

| File | Changes |
|------|---------|
| `app/_layout.tsx` | Add AuthProvider + PremiumProvider |
| `app/(onboarding)/welcome.tsx` | Navigate to paywall after onboarding |
| `app/menu.tsx` | Add account section, premium status, auth actions |
| `app/index.tsx` | Add premium gates to todo actions |
| `app/habits.tsx` | Add premium gate to habit creation |
| `app/projects.tsx` | Add premium gate to project creation |
| `app/history.tsx` | Limit to 7 days for free users |
| `app/journal.tsx` | Limit features for free users |
| `components/BottomNavBar.tsx` | Possible premium indicator |
| `backend/trpc/app-router.ts` | Register auth + subscription + sync routers |
| `backend/hono.ts` | Add RevenueCat webhook endpoint |
| `package.json` | Add react-native-purchases, expo-apple-authentication, expo-auth-session |
| `app.json` | Add Apple Sign In entitlement, URL schemes |

---

## 11. Implementation Phases

### Phase 1: Foundation (Auth Infrastructure)
**Goal**: Users can create accounts and sign in.

1. Set up database schema for users + refresh tokens
2. Implement `backend/trpc/routes/auth.ts` (email signup/signin)
3. Implement `backend/trpc/middleware/auth.ts`
4. Create `contexts/AuthContext.tsx`
5. Create `lib/auth.ts` (token storage)
6. Create auth screens (sign-in, sign-up, forgot-password, verify-email)
7. Update `app/_layout.tsx` with AuthProvider
8. Update `app/menu.tsx` with account section
9. Test full email auth flow

### Phase 2: Social Auth
**Goal**: One-tap Apple + Google sign in.

1. Configure Apple Sign In (Expo + Apple Developer Portal)
2. Configure Google Sign In (Expo + Google Cloud Console)
3. Add Apple + Google handlers to auth routes
4. Add social buttons to sign-in/sign-up screens
5. Test on iOS (Apple) and Android (Google)
6. Handle edge cases (email already exists with different provider)

### Phase 3: RevenueCat + Paywall
**Goal**: Users can subscribe to premium.

1. Set up RevenueCat dashboard (products, entitlements, offerings)
2. Create App Store / Play Store subscription products
3. Install `react-native-purchases`
4. Create `lib/revenuecat.ts`
5. Create `contexts/PremiumContext.tsx`
6. Create `app/paywall.tsx` screen
7. Create `hooks/usePremiumGate.ts` + `hooks/usePaywall.ts`
8. Add RevenueCat webhook to backend
9. Test purchase flow on TestFlight / Internal Testing

### Phase 4: Feature Gating
**Goal**: Free vs premium features properly gated.

1. Create `constants/premium.ts` (limits + feature flags)
2. Create `components/PremiumBadge.tsx` + `components/PremiumGate.tsx`
3. Gate habits (3 limit)
4. Gate todos (5/day limit)
5. Gate projects (1 limit)
6. Gate history (7-day limit)
7. Gate journal features
8. Gate work mode
9. Gate supplements (3 limit)
10. Gate later list (10 limit)
11. Add lock icons + upgrade prompts throughout UI
12. Add limit warning indicators

### Phase 5: Paywall Triggers + Optimization
**Goal**: Maximize conversion rate.

1. Add post-onboarding paywall trigger
2. Add milestone celebration triggers
3. Add contextual hero text per trigger
4. Add analytics event tracking
5. Implement smart trial activation logic
6. Add premium feature previews (grayed out)
7. Add AuthPromptBanner for anonymous users
8. Test and iterate on paywall copy/design

### Phase 6: Cloud Sync (Premium)
**Goal**: Premium users get cross-device sync.

1. Create `backend/trpc/routes/sync.ts`
2. Implement anonymous-to-authenticated migration
3. Implement push/pull sync logic
4. Add last-write-wins conflict resolution
5. Add sync status indicator in UI
6. Test multi-device scenarios

---

## Quick Reference: Revenue Projections

Assuming the app acquires users organically:

| Metric | Conservative | Moderate | Optimistic |
|--------|-------------|----------|------------|
| Monthly Active Users | 1,000 | 5,000 | 20,000 |
| Paywall View Rate | 40% | 50% | 60% |
| Trial Start Rate | 15% | 25% | 35% |
| Trial-to-Paid Rate | 40% | 55% | 65% |
| Effective Conversion | 2.4% | 6.9% | 13.7% |
| Paying Users | 24 | 344 | 2,730 |
| Annual Revenue | $720/yr | $10,300/yr | $81,900/yr |

*Based on $29.99/yr average, blended with weekly subscribers.*

---

## Design Principles Checklist

- [ ] Never block a user who is about to enter data (let them finish, then upsell)
- [ ] Always show what premium includes (not just "upgrade")
- [ ] Make the close/dismiss button visible (trust builds conversion)
- [ ] Show paywall at emotional highs, not lows
- [ ] Use 7-day trial to reduce commitment anxiety
- [ ] Keep auth optional until purchase (reduces friction by ~40%)
- [ ] Track every paywall interaction for iteration
- [ ] Test paywall copy A/B with different triggers
- [ ] Restore purchases must be accessible (App Store requirement)
- [ ] Handle offline mode gracefully (don't break free tier)
