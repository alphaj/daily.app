# Daily App - Friction Fix Implementation Plan

Prioritized, code-level plan for addressing the 39 friction points identified in `USER_FRICTION_ANALYSIS.md`. Organized into 4 waves by effort/impact.

---

## Wave 1: One-Line Fixes (Ship in 30 minutes)

These are trivially small changes with outsized impact. No dependencies. Do them all in one commit.

---

### 1A. Fix Date Format Bug (FRICTION-BUG, Critical)

**The bug**: `HabitContext.tsx` produces dates like `"2026 -02 -06 "` (spaces around dashes + trailing space) while `SupplementContext.tsx` produces `"2026-02-06"`. This means weekly progress dots for habits silently never match.

**Files**:
- `contexts/HabitContext.tsx` line 17: `return \`${year} -${month} -${day} \`` → `return \`${year}-${month}-${day}\``
- `contexts/HabitContext.tsx` line 47: Same fix inside `calculateStreak`
- `contexts/HabitContext.tsx` lines 99-111 (queryFn): Add migration to strip spaces from existing stored dates:
  ```ts
  completedDates: (h.completedDates || []).map((d: string) => d.replace(/\s/g, '')),
  slipDates: (h.slipDates || []).map((d: string) => d.replace(/\s/g, '')),
  ```
  Then persist the cleaned data back to AsyncStorage on first load.

**Complexity**: Small, but requires careful data migration testing.

---

### 1B. Fix Supplement Streak Badge Logic (FRICTION-37)

**The bug**: `SupplementCard.tsx` line 111 shows the streak flame when the supplement is NOT taken (`!isTaken`), and hides it when taken. Backwards.

**Fix**: Remove the `!` from the condition:
- `components/SupplementCard.tsx` line 111: `!isTaken` → `isTaken`

**Complexity**: One character.

---

### 1C. Stop Clearing Emoji on Habit Type Switch (FRICTION-12)

**The bug**: Switching between Build/Break in `add-habit.tsx` calls `setSelectedEmoji(null)`, forcing users to re-pick their emoji.

**Fix**: Delete the line in both handlers:
- `app/add-habit.tsx` line 176: Delete `setSelectedEmoji(null);`
- `app/add-habit.tsx` line 194: Delete `setSelectedEmoji(null);`

**Complexity**: Two line deletions.

---

### 1D. Make Drag Handle Visible (FRICTION-24)

**The fix**: The grip icon for task reordering is at 0.3 opacity on a light background — invisible.

- `app/index.tsx` line 1200: `opacity: 0.3` → `opacity: 0.6`
- `app/index.tsx` line 181: Optionally darken icon color from `"#C7C7CC"` to `"#AEAEB2"`

**Complexity**: One line.

---

### 1E. Fix Celebration Phrase Wrong Habit (FRICTION-36)

**The bug**: `getCelebrationPhrase()` returns the first habit with a phrase, not the one that triggered the milestone.

**Fix**:
- `contexts/HabitContext.tsx` lines 268-271: Add optional `habitId` parameter to `getCelebrationPhrase`. If provided, look up that specific habit first.
- `app/index.tsx` ~line 604: Add `const [celebrationHabitId, setCelebrationHabitId] = useState<string | null>(null);`
- `app/index.tsx` ~line 692 (inside `if (allCompleted)` block): `setCelebrationHabitId(habitId);`
- `app/index.tsx` line 995: `getCelebrationPhrase()` → `getCelebrationPhrase(celebrationHabitId ?? undefined)`
- `app/index.tsx` line 994 (`onComplete`): Add `setCelebrationHabitId(null);`

**Complexity**: Small. ~10 lines across 2 files.

---

### 1F. Remove Fake Transcription Spinner (FRICTION-27)

**The bug**: `add-journal.tsx` shows "Transcribing..." for 500ms then does nothing. Speech-to-text is unimplemented.

**Fix**:
- `app/add-journal.tsx` lines 115-123: Delete the `if (uri)` block that sets `isTranscribing(true)` and the `setTimeout`. After recording stops, show the text input immediately.
- `app/add-journal.tsx` line 237: Remove `isTranscribing` from the `disabled` prop.

**Complexity**: Delete ~8 lines.

---

### 1G. Fix "Sign Out" to Warn About Data Loss (FRICTION-38)

**The fix**: "Sign Out" permanently deletes all local data. The warning is inadequate.

- `app/menu.tsx` line 109: Title `'Sign Out'` → `'Reset App & Delete Data'`
- `app/menu.tsx` line 110: Message → `'This will permanently delete all your habits, tasks, supplements, journal entries, and other data. This action cannot be undone.'`
- `app/menu.tsx` line 115: Button text `'Sign Out'` → `'Delete Everything'`
- `app/menu.tsx` line 225: Menu item title `"Sign Out"` → `"Reset App"`
- `app/menu.tsx` line 224: Icon `LogOut` → `Trash2` for clarity

**Complexity**: Text changes only.

---

## Wave 2: Small-Medium Fixes (1-2 hours each)

These require a bit more code but are self-contained.

---

### 2A. Add Empty Submission Feedback (FRICTION-22)

**Problem**: CaptureBar silently ignores empty task submissions.

**Fix**:
- `components/CaptureBar.tsx` line 128: After the empty-text guard, add `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return;`
- `components/CaptureBar.tsx` lines 209-216 (send button): Add `disabled={!tempInput.trim()}` and `opacity: tempInput.trim() ? 1 : 0.35`

**Complexity**: Small. ~5 lines.

---

### 2B. Fix Grocery Progress Bar (FRICTION-26)

**Problem**: Progress bar width hardcoded to `'0%'`.

**Fix**:
- `app/groceries.tsx` ~line 29: Add `const [initialShoppingCount, setInitialShoppingCount] = useState(0);`
- `app/groceries.tsx` ~line 52 (`handleModeToggle`): When switching to shopping, capture `setInitialShoppingCount(shoppingList.length)`
- `app/groceries.tsx` line 166: Replace `width: '0%'` with computed percentage: `width: \`${initialShoppingCount > 0 ? Math.round(((initialShoppingCount - shoppingList.length) / initialShoppingCount) * 100) : 0}%\``
- Update text to show `"X of Y purchased"`

**Complexity**: Small. ~15 lines.

---

### 2C. Energy Triage Explanation (FRICTION-07)

**Problem**: Buttons silently hide content. No explanation of what they do.

**Fix**:
- `app/index.tsx` lines 622-634: After filtering, compute `hiddenTaskCount` and `hiddenHabitCount`
- `app/index.tsx` lines 783-786: Replace survival-only hint with always-visible hint per mode:
  - Survival: `"Showing low-energy items only. {N} items hidden."`
  - Normal: `"Showing low & medium-energy items. {N} high-energy items hidden."`
  - Peak: `"Showing everything."`
- Optional: Add a one-time tooltip on first interaction (check `AsyncStorage` for `@daily_triage_tip_shown`)

**Complexity**: Small. ~20 lines for hints. Medium if adding first-time tooltip.

---

### 2D. Work/Life Mode Safeguards (FRICTION-30)

**Problem**: One accidental tap silently hides everything.

**Fix**:
- `components/CalendarHeader.tsx` lines 79-90: On first toggle, check `AsyncStorage` for `@daily_workmode_explained`. If not set, show `Alert.alert()` explaining the feature before toggling. Set the flag after.
- `components/CalendarHeader.tsx` lines 112-114: Rename `'Work Focus'` → `'Work Only'`, `'Life Focus'` → `'Personal'`
- `app/index.tsx` after CalendarHeader: Add a visible banner when in work mode: `"Showing work items only. Tap to switch back."`
  - Read `currentMode` from `useWorkMode()` (add to existing destructuring at line 591)
  - Render banner conditionally when `currentMode === 'work'`

**Complexity**: Small-Medium. ~40 lines total.

---

### 2E. Remove Journal Entry False Affordance (FRICTION-28)

**Problem**: Journal entries respond to taps (haptic + animation) but do nothing.

**Fix (quick path)**: Remove the tappable affordance.
- `app/journal.tsx` lines 38-65: Change `Pressable` to `View`, remove the `onPress` handler, remove haptic feedback, remove opacity/scale animation.

**Fix (better path)**: Build a minimal journal entry detail screen.
- Create `app/journal-entry.tsx` with: full transcript display, mood, duration, timestamp, and a delete button.
- `app/journal.tsx` line 45: `router.push(\`/journal-entry?id=${entry.id}\`)`

**Complexity**: Small (remove affordance) or Medium (build detail screen).

---

## Wave 3: Medium Effort (2-4 hours each)

These require new components or cross-cutting infrastructure.

---

### 3A. Confirmation Toast System (FRICTION-16, 19)

**Problem**: No feedback after any create/edit/delete action across the entire app.

**Implementation**:

1. **Create `contexts/ToastContext.tsx`**:
   - Provider wraps the app in `_layout.tsx`
   - Exposes `showToast(message: string, type: 'success' | 'error' | 'info')`
   - Manages a queue of toast messages with auto-dismiss (2s)

2. **Create `components/Toast.tsx`**:
   - Animated `View` that slides down from top (or up from bottom)
   - Shows icon + message text
   - Auto-dismisses after 2 seconds
   - Uses `Animated.timing` for enter/exit

3. **Wire into `app/_layout.tsx`**:
   - Wrap with `<ToastProvider>` (add to the existing provider stack)
   - Render `<Toast />` component at root level (persists across navigation)

4. **Add to all creation flows**:
   - `app/add-habit.tsx` line 87: `showToast('Habit added')`
   - `app/add-supplement.tsx` line 68: `showToast('Supplement added')`
   - `app/add-todo.tsx` line 181: `showToast('Task added')`
   - `app/add-journal.tsx` line 155: `showToast('Entry saved')`
   - `components/CaptureBar.tsx` line 133: `showToast('Task added')`
   - `app/add-project.tsx`: `showToast('Project created')`
   - `app/add-grocery.tsx`: `showToast('Item added')`
   - `app/add-event.tsx`: `showToast('Event added')`
   - All delete handlers: `showToast('Deleted')`

**Complexity**: Medium. 2 new files (~100 lines each) + integration into 8+ existing files.

---

### 3B. Undo for Habit/Supplement Toggle (FRICTION-34)

**Problem**: Accidental un-tap instantly destroys streaks with no recovery.

**Implementation**:

1. **Add undo state to `app/index.tsx`**:
   ```ts
   const [undoAction, setUndoAction] = useState<{
     type: 'habit' | 'supplement';
     id: string;
     wasCompleted: boolean;
     previousStreak: number;
     timer: NodeJS.Timeout;
   } | null>(null);
   ```

2. **Wrap `handleHabitToggle`** (~line 672):
   - When un-completing (wasCompleted → !completed), capture streak before toggle
   - Call toggle
   - Set `undoAction` with 5-second timeout
   - Only show undo when un-toggling would break a streak (`previousStreak > 0`)

3. **Create `components/UndoToast.tsx`**:
   - Slides up from bottom (above BottomNavBar)
   - Shows: `"Streak lost (was {N} days). Undo?"`
   - Tapping "Undo" calls `toggleHabitCompletion` again to re-complete
   - Auto-dismisses after 5 seconds

4. **Apply same pattern for supplement toggle** at ~line 940.

**Complexity**: Medium. New component + state management in index.tsx.

**Dependency**: If doing FRICTION-17 (twice daily), design the undo abstraction generically.

---

### 3C. Use Onboarding Data (FRICTION-02, 03, 05)

**Problem**: `losesDayAt`, `fallsThrough`, and `todayWin` are collected but never used.

**Implementation**:

1. **`todayWin` → Daily Intention Card on Home Screen**:
   - `app/index.tsx` ~line 726: Add a card above the energy triage showing today's intention
   - Import `useOnboarding` to read `state.responses.todayWin`
   - Card has: intention text, edit button, dismiss X
   - Consider a separate `@daily_intention` AsyncStorage key for daily updates (not locked to onboarding response)

2. **`losesDayAt` → Personalized DailySummary timing**:
   - `components/DailySummaryModal.tsx` lines 24-29: Modify `getTimeOfDay` to use `losesDayAt` for contextual messaging
   - If `morning`, show the summary earlier with "Mornings are your challenge. Here's your plan."
   - Import `useOnboarding` in the `useDailySummary` hook

3. **`fallsThrough` → Personalized empty states**:
   - `app/index.tsx` lines 803-813 (empty tasks) and 854-862 (empty habits): If `fallsThrough.includes('later')`, show "You mentioned things fall through. Start a habit?"
   - Feed into the first-time experience (Wave 4)

**Complexity**: Medium. Touches 2-3 files, needs thoughtful UX copy.

---

## Wave 4: Larger Features (4-8 hours each)

---

### 4A. Onboarding-to-Home Transition (FRICTION-06)

**Problem**: Warm onboarding dumps users on an empty screen with no guidance.

**Implementation**:

1. **Add transient flag to `contexts/OnboardingContext.tsx`**:
   - Add `justCompletedOnboarding: boolean` (in-memory only, not persisted)
   - Set `true` in `completeOnboarding()`
   - Add `clearJustCompleted()` method

2. **Create `components/FirstTimeExperienceModal.tsx`**:
   - Multi-step guided overlay (3 steps):
     - Step 1: "Set your daily intention" — shows `todayWin`, offers to pin it
     - Step 2: "Add your first habit" — suggests habits based on `fallsThrough` answers
     - Step 3: "Your energy filter" — quick explanation of Survival/Normal/Peak
   - Pattern: Follow `DailySummaryModal.tsx` structure (animated bottom sheet)
   - Calls `clearJustCompleted()` on dismiss

3. **Mount in `app/index.tsx`**:
   - Import `useOnboarding`, read `justCompletedOnboarding`
   - Render `<FirstTimeExperienceModal visible={justCompletedOnboarding} />`

**Complexity**: Medium-Large. New 150+ line component + context changes.

**Dependencies**: Wave 3C (onboarding data usage) should be done first.

---

### 4B. Fix "Twice Daily" Supplements (FRICTION-17)

**Problem**: Twice-daily supplements are treated as once-daily. Users will miss medication doses.

**Implementation**:

1. **Extend type** in `types/supplement.ts`:
   - Add `takenDoses?: Record<string, ('am' | 'pm')[]>`

2. **Update context** in `contexts/SupplementContext.tsx`:
   - `isCompleteForFrequency` (~line 90): For `twice_daily`, check both AM and PM in `takenDoses[today]`
   - Add `toggleTwiceDailyDose(id: string, dose: 'am' | 'pm')` method
   - Update `calculateStreak` to require both doses for a day to count
   - Update stats to count individual doses (2 possible per day)
   - Migration: Initialize `takenDoses: {}` on existing supplements

3. **Update card** in `components/SupplementCard.tsx`:
   - For `twice_daily` frequency, render two pill-shaped badges (AM/PM) instead of single toggle
   - Each badge taps to `toggleTwiceDailyDose`

4. **Update home screen** in `app/index.tsx` ~line 939:
   - `isTaken` prop for twice-daily should check both doses

**Complexity**: Large. Type changes + context logic + UI + migration.

**Dependencies**: Should be done after 3B (Undo toggle) to ensure undo works with new toggle.

---

## Implementation Order & Dependency Graph

```
WAVE 1 (all independent, do in parallel)
├── 1A. Date format bug fix ★ DO FIRST — affects all habit date logic
├── 1B. Streak badge logic
├── 1C. Emoji clearing
├── 1D. Drag handle visibility
├── 1E. Celebration phrase
├── 1F. Remove fake transcription
└── 1G. Sign out warning

WAVE 2 (all independent, do in parallel)
├── 2A. Empty submission feedback
├── 2B. Grocery progress bar
├── 2C. Energy triage hints
├── 2D. Work/Life safeguards
└── 2E. Journal entry affordance

WAVE 3 (some dependencies)
├── 3A. Toast system (do first — used by 3B, 3C)
├── 3B. Undo toggle (uses toast infrastructure)
└── 3C. Use onboarding data (feeds into 4A)

WAVE 4 (depends on Wave 3)
├── 4A. First-time experience modal (depends on 3C)
└── 4B. Twice-daily supplements (depends on 3B)
```

---

## Effort Summary

| Wave | Fixes | Est. Time | Lines Changed | Impact |
|------|-------|-----------|---------------|--------|
| Wave 1 | 7 fixes | 30-60 min | ~50 lines | Eliminates bugs + quick wins |
| Wave 2 | 5 fixes | 3-5 hours | ~100 lines | Removes major confusion points |
| Wave 3 | 3 fixes | 6-10 hours | ~400 lines (2 new files) | Cross-cutting UX improvements |
| Wave 4 | 2 fixes | 8-12 hours | ~500 lines (2 new files) | Retention-critical features |
| **Total** | **17 fixes** | **~20-30 hrs** | **~1,050 lines** | **Addresses 30 of 39 frictions** |

The remaining 9 friction points (FRICTION-04, 09, 13, 14, 15, 20, 21, 31, 33) are low-severity polish items that can be addressed in future iterations.

---

## Files Most Frequently Modified

| File | Waves | Changes |
|------|-------|---------|
| `app/index.tsx` | 1, 2, 3, 4 | Energy hints, work banner, undo, first-time modal, drag handle, celebration fix |
| `contexts/HabitContext.tsx` | 1 | Date format fix, migration, celebration phrase |
| `contexts/SupplementContext.tsx` | 4 | Twice-daily logic |
| `components/SupplementCard.tsx` | 1, 4 | Streak badge fix, AM/PM UI |
| `app/add-habit.tsx` | 1 | Emoji clearing fix |
| `components/CalendarHeader.tsx` | 2 | Work/Life safeguards |
| `app/_layout.tsx` | 3 | Toast provider wrapping |
| `app/menu.tsx` | 1 | Sign out warning |
| `components/CaptureBar.tsx` | 2 | Empty submission feedback |
| `app/groceries.tsx` | 2 | Progress bar fix |
