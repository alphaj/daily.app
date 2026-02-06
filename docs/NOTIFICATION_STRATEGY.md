# Daily App — Notification Strategy

## Design Philosophy

Daily is for people who already feel overwhelmed, scattered, and stuck. Every notification we send either **reduces that burden** or **adds to it** — there is no neutral. The bar for sending a notification is: *would a thoughtful friend say this right now?*

Three rules govern every notification decision:

1. **Earn the interrupt.** Every notification must deliver value the user can't get by opening the app later.
2. **Never shame.** No guilt, no "you missed...", no passive-aggressive streaks-at-risk panic. Celebrate presence, don't punish absence.
3. **Respect the quiet.** The user who set 12 habits and 5 supplements should not get 17 daily notifications. Volume has a ceiling.

---

## What We Know About the User (Onboarding Signals)

The onboarding flow already captures four signals that should drive notification behavior:

| Signal | Values | How it informs notifications |
|---|---|---|
| `losesDayAt` | morning, afternoon, evening, sleep | **Timing.** When the user's day goes sideways is when a gentle nudge matters most. |
| `fallsThrough` | later, annoying, no-home, promises | **Content priority.** If "later items" fall through, the inbox review matters more. If "promises" fall through, task due dates matter more. |
| `currentFeeling` | overwhelmed, scattered, stuck, hopeful | **Tone.** Overwhelmed users need calm, minimal notifications. Hopeful users can handle more encouragement. |
| `notificationsEnabled` | boolean | **Permission.** Obvious gate — but also a signal of trust level. |

These signals are already stored in `@daily_onboarding` via `OnboardingContext`. The notification system should read them to personalize timing, frequency, and tone.

---

## Notification Categories

### 1. Habit Reminders (Priority: High)

**Why it earns the interrupt:** The user explicitly set up this habit with specific days, a "why" statement, and an implementation intention. They *asked* for this structure.

**Trigger:** Calendar-based, recurring on `scheduledDays` for each habit.

**Timing logic:**
- Use the habit's `intention.when` field if set (e.g., "after my morning coffee" → schedule for 7:30 AM)
- Otherwise, fall back to a default schedule based on `losesDayAt`:
  - `morning` → 7:00 AM (catch them before the day unravels)
  - `afternoon` → 8:00 AM (still morning, but not rushed)
  - `evening` → 6:00 PM (before evening drift)
  - `sleep` → 9:00 AM (gentle start, they struggle at night)

**Content format:**
```
Title: "{emoji} {habitName}"
Body:  "{whyStatement}"                    ← if set
       "Part of your {dayOfWeek} rhythm"   ← fallback
```

**Examples:**
```
🧘 Meditate
"Because calm mornings change everything"

📖 Read for 20 minutes
"Part of your Tuesday rhythm"
```

**Volume control:**
- Maximum **3 habit reminders per day**, even if the user has more habits scheduled.
- Prioritize habits by: (1) longest active streak (protect momentum), (2) highest energy level (do the hard thing when prompted), (3) most recently created (new habits need more support).
- Remaining habits appear in the app's Today view but don't generate notifications.

**What we never say:**
- "You haven't completed X yet today" (shame)
- "Your streak is at risk!" (anxiety)
- "Don't forget!" (nagging)

---

### 2. Supplement/Medication Reminders (Priority: Critical)

**Why it earns the interrupt:** Health-critical. Missing medication has real consequences. This is the one category where repeating is acceptable.

**Status:** Already implemented in `lib/notifications.ts`. The current implementation is functional but can be improved.

**Proposed improvements:**
- Group multiple supplements at the same `timeOfDay` into a single notification instead of one per supplement:
  ```
  Title: "💊 Morning supplements"
  Body:  "Vitamin D, Omega-3, Magnesium"
  ```
- Add a second reminder 30 minutes after the first if not marked as taken (requires tracking notification response).
- Badge count should reflect the number of untaken supplements for the day.

**Volume control:**
- Supplements are exempt from the daily notification cap — this is health data.
- But group aggressively: one notification per time slot (morning/afternoon/evening), not one per supplement.

---

### 3. Daily Planning Nudge (Priority: Medium)

**Why it earns the interrupt:** The app's core value is helping users structure their day. A single morning touchpoint sets the tone.

**Trigger:** Once daily, on weekdays by default (user-configurable).

**Timing:** Based on `losesDayAt`:
- `morning` → 6:45 AM (before they lose it)
- `afternoon` → 8:30 AM (relaxed morning start)
- `evening` → 8:30 AM (same — the planning moment is always morning)
- `sleep` → 9:30 AM (gentle)

**Content format — contextual based on what's actually on their plate:**
```
If user has tasks + habits today:
  Title: "Your day"
  Body:  "{n} tasks and {m} habits on deck"

If user has only habits today:
  Title: "Your day"
  Body:  "{m} habits to carry forward"

If nothing is scheduled:
  Title: "Clean slate"
  Body:  "Nothing scheduled — good day to capture ideas"
```

**Volume control:**
- This is a single notification per day. It replaces opening the app out of anxiety with a calm summary.
- Skip weekends unless user has tasks/habits scheduled for Saturday/Sunday.
- Skip if the user already opened the app before the scheduled time (check app foreground state).

---

### 4. Streak Celebrations (Priority: Medium)

**Why it earns the interrupt:** Positive reinforcement at milestone moments. These feel like gifts, not demands.

**Trigger:** Checked at end of day (8 PM) when a habit's streak hits a milestone.

**Milestones:** 7 days, 14 days, 21 days, 30 days, 60 days, 90 days, 180 days, 365 days.

**Content format:**
```
Title: "{emoji} {streak} days"
Body:  "{celebrationPhrase}"              ← if the user set one
       "That's {streak} days of {name}"   ← fallback
```

**Examples:**
```
🧘 21 days
"Calm, focused, mine"           ← user's celebration phrase

💪 30 days
"That's 30 days of Exercise"
```

**Volume control:**
- Maximum **1 celebration notification per day**. If multiple habits hit milestones on the same day, pick the highest streak.
- Never send on a day when the user broke a streak (read the room).

---

### 5. Weekly Inbox Review (Priority: Low)

**Why it earns the interrupt:** Captured thoughts lose value if they sit forever. A weekly prompt to process the inbox prevents the "junk drawer" effect.

**Trigger:** Once per week, Sunday evening (6 PM) or Monday morning (8 AM) — user choice.

**Condition:** Only send if there are **3+ unprocessed items** in the inbox. Don't notify for an empty or nearly-empty inbox.

**Content format:**
```
Title: "Inbox check-in"
Body:  "{n} thoughts waiting for a home"
```

**Volume control:**
- Once per week, maximum. Skipped if inbox is clean.

---

### 6. Due Date Reminders (Priority: Medium-High)

**Why it earns the interrupt:** Tasks and projects with deadlines represent commitments. A reminder the day before prevents last-minute scrambles.

**Trigger:** Day before a task's `dueDate` or project's `deadline`, at 9 AM.

**Content format:**
```
Title: "Due tomorrow"
Body:  "{taskTitle}"

For projects:
Title: "📋 {projectName} due tomorrow"
Body:  "{n} of {total} tasks completed"
```

**Volume control:**
- Maximum **2 due date reminders per day**. Prioritize by: (1) projects over tasks, (2) lower completion percentage, (3) earlier due date.
- Never remind about overdue items (that's shaming, not helping).

---

## What We Explicitly Will Not Build

| Notification type | Why not |
|---|---|
| "Come back" re-engagement | Manipulative. If the app is valuable, they'll return. If it's not, nagging won't help. |
| Social pressure | No social features exist. Fabricating social proof ("1000 users completed...") is dishonest. |
| Feature announcements | Use the App Store "What's New" section. Notifications are not a marketing channel. |
| Streak-at-risk warnings | Causes anxiety in exactly the user population we serve (overwhelmed, ADHD). If someone misses a day, silence is kinder than a countdown. |
| "You missed X" recaps | Looking backward at failures is the opposite of the app's forward-looking design. |
| Promotional / upsell | Violates Apple policy without explicit opt-in, and violates user trust regardless. |
| Random motivational quotes | Untargeted inspiration is noise. The user's own `whyStatement` is more powerful than a generic quote. |

---

## Global Volume Controls

### Daily Notification Budget

| Category | Max per day | Skippable? |
|---|---|---|
| Supplement reminders | Unlimited (grouped by time slot) | No — health critical |
| Habit reminders | 3 | Yes — if app already opened |
| Daily planning nudge | 1 | Yes — if app already opened |
| Streak celebration | 1 | No |
| Due date reminder | 2 | No |
| Inbox review | 0 (weekly only) | Yes — if inbox is clean |

**Hard ceiling (excluding supplements): 7 non-health notifications per day.**

If the user has enough activity to trigger more than 7, the system silently drops the lowest-priority ones. The user never knows they were suppressed — they just experience a calm notification feed.

### Quiet Hours

- Default quiet hours: 10 PM – 7 AM (no notifications delivered).
- Supplements override quiet hours (medication timing is the user's choice).
- All notifications scheduled during quiet hours are delivered at the next available window.

### Adaptive Frequency

Track two metrics locally (no server needed):

1. **Notification dismissal rate**: If >50% of a category's notifications are dismissed without opening the app over a 2-week window, reduce that category's frequency by half.
2. **App-open-before-notification rate**: If the user consistently opens the app before the scheduled notification time, shift the notification 30 minutes later (they don't need prompting, they need the info delivered at a calmer moment).

---

## Notification Preferences Screen

The current Settings menu has a non-functional "Notifications" item. This should become a real preferences screen:

```
┌─────────────────────────────────────┐
│  Notifications                      │
│                                     │
│  REMINDERS                          │
│  ┌─────────────────────────────┐    │
│  │ Habit reminders        [ON] │    │
│  │ Supplement reminders   [ON] │    │
│  │ Due date reminders     [ON] │    │
│  └─────────────────────────────┘    │
│                                     │
│  DAILY                              │
│  ┌─────────────────────────────┐    │
│  │ Morning planning nudge [ON] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ENCOURAGEMENT                      │
│  ┌─────────────────────────────┐    │
│  │ Streak celebrations    [ON] │    │
│  └─────────────────────────────┘    │
│                                     │
│  WEEKLY                             │
│  ┌─────────────────────────────┐    │
│  │ Inbox review           [ON] │    │
│  │  └ Day: Sunday evening  [>] │    │
│  └─────────────────────────────┘    │
│                                     │
│  QUIET HOURS                        │
│  ┌─────────────────────────────┐    │
│  │ From     10:00 PM      [>]  │    │
│  │ To        7:00 AM      [>]  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

Every category can be independently toggled. This satisfies Apple's requirement for an opt-out mechanism and gives users granular control without overwhelming them.

---

## Apple Policy Compliance Checklist

| Requirement | How we satisfy it |
|---|---|
| Explicit opt-in | Onboarding screen with "Allow notifications" / "Not now" (already exists) |
| Opt-out mechanism | Notification preferences screen with per-category toggles |
| No spam | Hard daily ceiling of 7 non-health notifications; adaptive frequency reduction |
| Related to app content | Every notification references the user's own data (habits, tasks, supplements) |
| No advertising in notifications | No promotional content; no upsells; no feature announcements |
| No required for functionality | App works fully without notifications; "Not now" path in onboarding |
| No sensitive personal info | Notification content uses habit names and task titles the user created — no health details beyond supplement names |
| iOS 18 priority compatibility | Value-driven, personalized content will rank well in Apple's AI priority system |

---

## Technical Implementation Plan

### Phase 1: Foundation (Core infrastructure)
1. Create a `NotificationPreferences` type and context with per-category toggles, quiet hours, and adaptive metrics storage.
2. Build the notification preferences screen (linked from Settings menu).
3. Refactor `lib/notifications.ts` to read preferences before scheduling.
4. Add quiet hours enforcement to the notification handler.

### Phase 2: Habit Notifications (Highest user value)
1. Implement `scheduleHabitNotification()` — replace the current placeholder.
2. Add `losesDayAt`-aware timing logic.
3. Implement the 3-per-day prioritization algorithm (streak length > energy level > creation date).
4. Use `whyStatement` in notification body when available.
5. Store `notificationIds` on habit objects (same pattern as supplements).

### Phase 3: Daily Planning Nudge
1. Schedule a single daily notification with dynamic content based on today's tasks/habits count.
2. Implement "already opened" suppression (check last foreground timestamp before delivering).
3. Add weekend skip logic.

### Phase 4: Celebrations & Due Dates
1. Implement streak milestone detection (check at 8 PM daily).
2. Schedule celebration notifications using `celebrationPhrase`.
3. Implement due date scanning — schedule reminders for tasks/projects with upcoming deadlines.
4. Add the 1-celebration / 2-due-date daily caps.

### Phase 5: Weekly Inbox Review
1. Count unprocessed inbox items weekly.
2. Schedule conditional notification (only if 3+ items).
3. Add day/time preference to notification settings.

### Phase 6: Adaptive Intelligence
1. Track dismissal and app-open-before-notification events locally.
2. Implement frequency reduction logic (50% dismissal threshold).
3. Implement timing shift logic (app-open-before pattern).

### Phase 7: Supplement Grouping (Enhancement)
1. Refactor supplement notifications to group by time slot.
2. Single "Morning supplements: A, B, C" notification instead of three separate ones.

---

## Notification Copy Guide

**Voice:** Calm, brief, personal. Like a sticky note from a friend, not an alert from a system.

**Do:**
- Use the user's own words (habit names, why statements, celebration phrases)
- Keep titles under 30 characters (Apple recommends < 50, we go shorter)
- Keep bodies under 80 characters (Apple recommends < 150, we go shorter)
- Use the habit/supplement emoji as visual identity
- Be specific ("3 tasks on deck") not vague ("Check your tasks")

**Don't:**
- Use exclamation marks (urgency creates stress)
- Use "Don't forget" or "Remember to" (implies they'd forget without us)
- Use "You haven't..." or "You missed..." (backward-looking shame)
- Use motivational filler ("You've got this!", "Crush it today!")
- Capitalize for emphasis ("IMPORTANT", "LAST CHANCE")

**Tone calibration by `currentFeeling`:**
- `overwhelmed` → Shorter copy, calmer words. "Your day" not "Here's what's ahead"
- `scattered` → Structured copy with counts. "3 tasks, 2 habits" gives anchoring
- `stuck` → Forward-looking copy. "Next up:" rather than summaries
- `hopeful` → Slightly warmer. Can include celebration language more freely

---

## Measuring Success

Track these metrics locally (privacy-first, no analytics service needed):

1. **Notification open rate** per category (tapped → app opened)
2. **Dismissal rate** per category (swiped away)
3. **Habit completion rate** on days with vs. without reminders
4. **App opens before notification** (user didn't need the nudge)

Success looks like:
- Open rate > 40% for habit reminders (they're useful, not noise)
- Dismissal rate < 30% for any category (if higher, reduce frequency)
- Habit completion improves on notification days vs. non-notification days
- Total daily notifications averages 3–5 (not hitting the ceiling regularly)

If a category consistently underperforms, the adaptive system reduces it automatically. The user never has to manually tune — the system learns to be quieter where it isn't helping.
