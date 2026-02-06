# Daily App - User Friction Analysis

## Full Product Walkthrough from a Growth PM Perspective

---

## The 5 User Personas

### 1. "The Overwhelmed Professional" - Sarah, 32, Marketing Manager
- **Why Daily**: Needs one app to manage work tasks, personal habits, supplement regimen, and grocery runs. Has ADHD tendencies; structure helps but complexity overwhelms her. Uses the app in 30-second bursts between meetings.
- **Key need**: Things must "just work" with zero learning curve.
- **Churn risk**: High. If the app adds cognitive load instead of removing it, she's gone in 48 hours.

### 2. "The Health-Conscious Parent" - Marcus, 38, Software Engineer + Dad of 2
- **Why Daily**: Tracks 6 daily supplements, grocery lists for meal prep, and juggles work tasks with family routines. Constantly interrupted by kids, so interactions must be under 5 seconds.
- **Key need**: Quick capture and quick toggling. One-hand operation.
- **Churn risk**: Medium. Loyal if the supplement/grocery flow is smooth, but will abandon habit tracking if it takes too many taps.

### 3. "The Self-Improvement Student" - Zoe, 21, Pre-Med
- **Why Daily**: Building study habits, exercise routines, and sleep schedules. Uses journaling for mental health. Projects for coursework deadlines. Tech-savvy but ruthlessly impatient.
- **Key need**: Satisfying habit streaks and visual progress. Gamification matters.
- **Churn risk**: Very high. Will compare against Habitica, Notion, and Todoist within the first session. Needs to feel "delightful" immediately.

### 4. "The Juggling Freelancer" - Jordan, 28, Graphic Designer
- **Why Daily**: Multiple client projects need separation from personal life. Brain dumps between calls. Work/Life mode is essential. Needs inbox-to-task conversion for managing ideas.
- **Key need**: Work/Life boundary management that actually works.
- **Churn risk**: Medium-high. If Work Mode doesn't filter properly, the app feels noisy and unusable.

### 5. "The Wellness Retiree" - Linda, 62, Recently Retired
- **Why Daily**: Tracks 8+ daily supplements (doctor's orders), establishing new post-retirement routines, and weekly grocery planning. Less tech-savvy; needs large touch targets and obvious affordances.
- **Key need**: Clarity. Every button must be self-explanatory.
- **Churn risk**: Extremely high at onboarding. One confusing screen = uninstall.

---

## Selected Persona: Sarah, "The Overwhelmed Professional"

Sarah represents the core target user for an "app you use Daily." She touches every feature, is sensitive to friction because she's already overwhelmed, and embodies the exact promise of the app: one place for everything, easy enough to actually use. If the app can't serve Sarah, it can't fulfill its value proposition.

**Sarah's context**: It's a Monday morning. She downloaded Daily because her therapist suggested tracking habits and her friend recommended it for supplement reminders. She has 15 minutes before her first meeting.

---

## PHASE 1: ONBOARDING (First 3 minutes)

### Screen 1: Get Started
**What Sarah sees**: Lottie animation, "Reach your life goals," a single CTA.
**Experience**: Clean. Promising. She taps "Get started."
**Friction**: None. This is well-done.

### Screen 2: Notifications
**What Sarah sees**: Bell icon, "Stay on track, not distracted," two buttons.
**Sarah's thought**: "Sure, I want reminders for supplements."
**She taps**: "Allow notifications."
**Friction**:
- **FRICTION-01 [Medium]**: Sarah just granted notification permission, but the app never asks WHAT she wants notifications for. She'll later discover supplement reminders work but habit reminders don't (they're a TODO stub at `lib/notifications.ts:185`). She'll feel betrayed by the "no noise, just momentum" promise when she gets no habit reminders at all.

### Screen 3: When do you lose your day?
**Sarah's thought**: "Oh, this feels personalized. Mornings for sure." She selects "Morning feels wasted before it starts."
**Friction**:
- **FRICTION-02 [High]**: This question creates an implicit promise: "We're asking so we can help." But this data (`losesDayAt`) is stored and **never used anywhere in the app**. Sarah will never see a morning-focused tip, a morning routine suggestion, or any acknowledgment of her answer. This is a **trust violation**. She gave personal information for nothing.

### Screen 4: What falls through the cracks?
**Sarah selects**: "Things I said I'd do later" and "Habits that don't have a home."
**Friction**:
- **FRICTION-03 [High]**: Same issue as above. `fallsThrough` is stored but **never referenced**. The app doesn't surface a "Later" list recommendation or suggest habit creation based on her answers. These questions feel like a survey for the company, not for her benefit. Two consecutive screens of data extraction with no payoff.

### Screen 5: How do you feel right now?
**Sarah selects**: "Overwhelmed - Too much in my head."
**Friction**:
- **FRICTION-04 [Low]**: This IS used, but only for a single personalized sentence on the welcome screen. The ratio of emotional vulnerability to payoff is way off. Sarah bares her mental state for one line of text she'll see once.

### Screen 6: What would make today a win?
**Sarah types**: "Actually take my supplements on time."
**Friction**:
- **FRICTION-05 [High]**: This "Today's Win" appears on the welcome screen and then **disappears forever**. It's not shown on the home dashboard, doesn't create a task, doesn't resurface tomorrow as a reflection prompt. Sarah's intention vanishes into a database she can't see. For an app called "Daily," there's no daily intention feature.

### Screen 7: Welcome
**Sarah sees**: "You're all set! Let's clear that mental clutter together." + her win.
**Sarah's thought**: "Okay, that's nice. Let's go."
**Friction**:
- **FRICTION-06 [Medium]**: Sarah taps "Let's begin" and lands on... a completely empty home screen. No guided tour. No "Add your first habit" prompt. No suggested first actions based on her onboarding answers. The emotional warmth of onboarding gives way to a cold, empty void. **The transition from onboarding warmth to blank app is the single biggest drop-off risk.**

### Onboarding Summary

| Friction | Severity | Issue |
|---|---|---|
| FRICTION-01 | Medium | Notification permission collected but habit notifications unimplemented |
| FRICTION-02 | High | "Loses day" question collected but never used |
| FRICTION-03 | High | "Falls through" question collected but never used |
| FRICTION-04 | Low | Feeling used for one sentence only |
| FRICTION-05 | High | "Today's Win" disappears after welcome screen |
| FRICTION-06 | Medium | Empty home screen after warm onboarding; no guided first actions |

---

## PHASE 2: FIRST HOME SCREEN EXPERIENCE (Minutes 3-5)

### Landing on Index
**What Sarah sees**: A date header, energy triage buttons (Survival/Normal/Peak), empty sections for Tasks, Habits, and Supplements. A bottom nav bar. A calendar strip at top.

**Friction**:
- **FRICTION-07 [High]**: The energy triage buttons (Survival 🔋 / Normal ⚡️ / Peak 🔥) are shown prominently but **completely unexplained**. Sarah has no idea what "Survival mode" means. She cautiously taps it. Tasks disappear (because she has none with "low" energy level). She taps "Peak" mode. Still nothing. She's wasted 15 seconds on a feature that means nothing to her yet and that **silently hides content** when she eventually adds tasks. This is the #1 confusion trap on the home screen.

- **FRICTION-08 [Medium]**: The "Focus Capsule" (Work/Life toggle) at the top says "Life Focus 🌿". Sarah has no idea what this means or that it's tappable. If she accidentally taps it and switches to "Work Focus 💼", future items she creates while in that mode will be tagged as work items and hidden when she switches back. **An accidental tap creates invisible data filtering with no explanation.**

- **FRICTION-09 [Low]**: The bottom nav bar shows Home, Life, a big Capture (+) button, Calendar, and Profile icons. But the labels are 10px — practically invisible. Sarah doesn't know what "Life" means vs "Home." Both sound like they'd show the same thing.

### Sarah tries to add her first habit
**She looks for an "Add" button.** She spots the small "+" next to the Habits section header. She taps it.

**Friction**:
- **FRICTION-10 [Medium]**: The Add Options Modal appears with two choices: "Task" and "Habit." But the descriptions are confusing: Task = "A one-off to-do item" (what's "one-off"?) and Habit = "Build a recurring goal" (a habit isn't a goal; confusing terminology). The press feedback on these buttons is nearly invisible (white → #F9F9F9, a 3% brightness change).

### Add Habit Screen
Sarah selects "Habit" and reaches the creation form.

**Friction**:
- **FRICTION-11 [High]**: Sarah types "Take morning supplements" as her habit name. She tries to tap "Add" — it's disabled. She scrolls up looking for what's wrong. There's no error message, no red field, no asterisk. Eventually she notices the dashed-border emoji placeholder at the top. **The requirement to select an emoji before saving is not communicated until the user fails.** This is a classic "invisible validation" anti-pattern.

- **FRICTION-12 [Medium]**: Sarah taps a suggested emoji (💊). Now she notices "Build" vs "Break" type toggle. She's not sure — is she "building" a supplement habit or "breaking" her forgetfulness? She taps "Break" to explore. **Her selected emoji immediately clears.** She has to pick an emoji again. She switches back to "Build." **Emoji clears again.** After 3 type switches, she's re-selected the emoji 3 times. This destroys the feeling of control.

- **FRICTION-13 [Low]**: She sees "Celebration phrase (3 words)" but has no idea when she'd see this phrase. It says "max 3 words" in placeholder text but allows 30 characters. She types "I did it!" and moves on, not knowing this only appears at 7-day streak milestones.

- **FRICTION-14 [Low]**: "Energy Cost" shows Easy/Normal/Deep with no explanation. She doesn't know this maps to the Survival/Normal/Peak filter on the home screen. She leaves it at default, which means her habit won't appear when she later tries energy filtering.

- **FRICTION-15 [Low]**: "Work Related" toggle at the bottom — she doesn't know what this does. She toggles it on for the supplement habit since she takes it at work. Later, when she's in "Life Focus" mode, this habit disappears and she'll think it was deleted.

### Sarah adds the habit and returns home
**Friction**:
- **FRICTION-16 [Medium]**: After tapping "Add," the screen navigates back. **No confirmation toast, no animation, no "Habit created!" message.** Sarah isn't sure it saved. She has to visually scan the home screen to find her new habit card. Thankfully it's there. But the lack of confirmation creates doubt.

---

## PHASE 3: ADDING SUPPLEMENTS (Minutes 5-8)

Sarah's main motivation was supplement tracking. She has 5 daily supplements. She taps the "+" next to the Supplements header.

### Add Supplement Screen

**Friction**:
- **FRICTION-17 [Medium]**: The supplement form shows Frequency options: Daily, Twice Daily, Weekly, As Needed. Sarah takes Vitamin D "twice daily" (morning and evening). She selects it. But internally, **"Twice Daily" is treated identically to "Daily"** — she can only toggle "taken" once per day, not separately for AM and PM (`SupplementContext.tsx` line 91-93: `// TODO: Could enhance to track AM/PM separately`). She'll discover this broken promise when she takes her morning dose and the supplement shows as "done" for the whole day, causing her to miss the evening dose.

- **FRICTION-18 [Low]**: She selects "Morning" for time of day. But she's never told what time "Morning" means for notifications. Is it 6am? 8am? 9am? She can't configure the specific time. If she's an early riser or late sleeper, the notification may come at a useless time.

- **FRICTION-19 [Low]**: Same as habits — no confirmation after saving a supplement. She adds all 5 supplements quickly but never gets feedback that each one saved.

### Back on Home Screen with 5 Supplements

**Friction**:
- **FRICTION-20 [Medium]**: The supplements display as horizontal scrolling cards. With 5 supplements, Sarah must scroll right to see them all. But there's **no scroll indicator** — she might think she only has 3 supplements visible. The horizontal scroll pattern is inconsistent with the vertical task list above it. Habits also scroll horizontally but are wider cards. The mixed scroll directions (vertical page + horizontal sections) increase cognitive load.

---

## PHASE 4: DAILY TASK MANAGEMENT (Minutes 8-10)

Sarah wants to add her morning tasks: "Review client brief," "Send invoice," "Buy groceries."

### Adding Tasks

**Friction**:
- **FRICTION-21 [Low]**: She can add tasks from the "+" button on the Tasks section, or from the CaptureBar (big + button on nav), or from the Add Options modal. Three different entry points that create the same thing. Not terrible, but the CaptureBar also offers "Note" and "Mood" which she doesn't need right now, adding noise.

- **FRICTION-22 [Medium]**: When adding a task via the CaptureBar, Sarah types "Buy groceries" and taps send. The task is created. She types "Send invoice" and hits return on the keyboard. Also created. She types nothing and taps send. **Nothing happens. No error message, no haptic, no toast.** She taps send again. Still nothing. She thinks the button is broken. (Empty submission silently fails at `CaptureBar.tsx` line 128.)

### Viewing Tasks

- **FRICTION-23 [Medium]**: Sarah marks "Review client brief" as done. Nice checkmark animation. She marked "Send invoice" as done too. She notices the tasks don't reorder — completed tasks stay in place. She'd expect them to move to a "completed" section or dim significantly. Instead, they have a checkmark but remain in the list in the same position, just with a line-through style. Cluttered.

### Dragging to Reorder

- **FRICTION-24 [High]**: Sarah wants to move "Buy groceries" above "Send invoice." She tries to long-press and drag. Nothing happens. She tries tap-and-hold. Nothing. The drag handle is a tiny grip icon at opacity 0.3 — essentially invisible. **She will never discover drag-to-reorder.** This is a critical hidden affordance. Most users expect long-press-to-drag, not "find the invisible grip icon and drag from there."

---

## PHASE 5: EXPLORING SECONDARY FEATURES (Minutes 10-15)

### Groceries
Sarah remembers she needs to buy groceries. She navigates to the Groceries screen.

**Friction**:
- **FRICTION-25 [Medium]**: She adds "chicken breast" and the auto-categorization puts it under "Proteins & Meat." She adds "orange juice" — it goes to "Beverages." Smart. But when she types "oj" and it categorizes differently mid-typing, the category chip changes without any transition or explanation. The silent re-categorization feels glitchy.

- **FRICTION-26 [High]**: She switches to "Shopping" mode to see her shopping list. There's a progress bar at the top. It says **0% complete** and it **never changes** no matter how many items she checks off. This is because the width is hardcoded to `'0%'` in the code (`groceries.tsx`). A broken progress bar is worse than no progress bar — it makes the feature feel abandoned.

### Journal
Sarah is intrigued by the voice journal. She taps into the Journal screen and hits record.

**Friction**:
- **FRICTION-27 [High]**: She records a 30-second voice entry about her morning anxiety. The recording stops. She sees "Transcribing..." and waits. And waits. It resolves with "Voice note (no transcript)" because **transcription is a TODO** (`add-journal.tsx`: `// TODO: Send audio to backend for Whisper transcription`). Sarah expected speech-to-text and got nothing. The "Transcribing..." loading state is a lie. She can manually type a transcript, but why would she when the feature promised voice-to-text?

- **FRICTION-28 [Medium]**: She saves the entry and goes back to the journal list. She taps on her entry to review it. **Nothing happens.** Entries are tappable (they have press handlers) but navigation to detail view is a TODO (`journal.tsx`: `// TODO: Navigate to entry detail`). This is a **false affordance** — the cards look interactive but aren't.

### Inbox / Brain Dump
Sarah tries the Inbox to capture a quick thought.

**Friction**:
- **FRICTION-29 [Medium]**: She types "Look into meditation apps" and sends it. The item appears in the list with a type icon she doesn't understand. She long-presses to explore. A menu appears with "Convert to Task" and "Convert to Habit." She taps "Convert to Task." The item disappears (auto-archived). **No confirmation that it became a task, no navigation to the new task, no visual link between the inbox item and the converted task.** She checks her task list — it's there. But the silent conversion with auto-archive feels like deletion.

### Work/Life Mode
Sarah accidentally discovers Work Mode by tapping the "Focus Capsule."

**Friction**:
- **FRICTION-30 [High]**: She taps the capsule (which she thought was decorative). The label changes from "Life Focus 🌿" to "Work Focus 💼" with only a subtle scale animation. Her supplement habit ("Take morning supplements") that she tagged as work-related **instantly disappears** from the home screen. Her 2 work-tagged tasks also vanish. Sarah panics — "Where did my stuff go?" She doesn't connect the capsule tap to the disappearance. She scrolls, checks filters, and eventually taps the capsule again. Everything reappears. **The Work/Life filter is the most dangerous hidden feature in the app.** It silently hides content with no explanation, no banner saying "Showing work items only," and the toggle itself is labeled with jargon ("Focus Capsule") that means nothing to a first-time user.

### History / Calendar
Sarah checks the History screen.

**Friction**:
- **FRICTION-31 [Medium]**: The calendar shows colored dots and pills for events. But there's **no legend** explaining what the colors mean. Blue dots? Green dots? She doesn't know that blue = tasks, green = habits, purple = notes. The dots are tiny and overlap on busy days.

- **FRICTION-32 [Low]**: She taps a date to see details. A modal opens with a timeline view. She long-presses an event to delete it. **No visual hint** that long-press deletes. She discovers it by accident and almost deletes something she wanted to keep.

### Life Dashboard
Sarah taps "Life" in the bottom nav.

**Friction**:
- **FRICTION-33 [Low]**: Progress rings show percentages but don't explain what they represent. Is 60% habits "60% of today's habits done"? "60% of all habits ever"? "60% of this week"? The stat cards show numbers without time context.

---

## PHASE 6: DAY 2+ EXPERIENCE (Retention Issues)

### Streaks

**Friction**:
- **FRICTION-34 [High]**: Day 2: Sarah marks her "Take morning supplements" habit as complete. She feels good. Then she accidentally taps it again (phone bumps). It uncompletes. **Her 2-day streak instantly drops to 0** because the streak recalculates immediately. No "Are you sure?" confirmation. No undo. No animation showing streak loss. She just lost her progress and doesn't even realize it happened because the streak number on the home card is small and she wasn't looking at it.

- **FRICTION-35 [Medium]**: Sarah has her habit set to "Every day." It's Saturday. She doesn't open the app. Monday morning, she opens it and her streak is 0. She expected weekends to not count, but she selected "Every day" during creation. She'd need to go to Edit Habit and change scheduled days, but she doesn't know that feature exists because it's buried in the edit form.

### Celebration System

**Friction**:
- **FRICTION-36 [Low]**: Day 7: Sarah completes all habits. A celebration overlay appears! But the celebration phrase shown is from the wrong habit — the code fetches the "first habit with a celebration phrase" rather than the habit that triggered the milestone. She sees "I did it!" (from her supplement habit) when she completed her exercise habit.

### Supplement Streak Confusion

**Friction**:
- **FRICTION-37 [Medium]**: Sarah's supplement shows a flame badge 🔥 when she hasn't taken it yet today, but the badge **disappears once she marks it taken**. The opposite of what she expects — she wants to see the streak grow, not vanish. The visual logic (show streak only when NOT taken) is backwards from a motivational standpoint.

---

## PHASE 7: SETTINGS AND DATA MANAGEMENT

### Menu Screen

**Friction**:
- **FRICTION-38 [High]**: Sarah eventually finds the Menu. She sees "Sign Out." She's curious what happens to her data if she signs out. She taps it. A confirmation appears but **doesn't clearly communicate that all data is permanently deleted.** She confirms. **All her habits, supplements, tasks, projects, journal entries, and grocery lists are gone.** The app resets to onboarding. There is no cloud backup, no data export, no recovery option. For an app that stores all data locally and has no sync — this is catastrophic. A user who "signs out" expecting to sign back in will lose everything.

- **FRICTION-39 [Medium]**: There's no data export or backup feature. Sarah has been using the app for 3 weeks with 15 habits, 50+ tasks, 5 supplements, and journal entries. If she gets a new phone or reinstalls the app, **everything is lost**. The privacy-first, local-only approach is admirable but the lack of ANY backup/export mechanism makes long-term investment in the app feel risky.

---

## COMPLETE FRICTION INVENTORY

### Critical (Blocks core value / Causes data loss / Breaks trust)

| ID | Issue | Location | Impact |
|---|---|---|---|
| FRICTION-02 | "Loses day" data collected but never used | Onboarding | Trust violation - users feel surveilled for nothing |
| FRICTION-03 | "Falls through" data collected but never used | Onboarding | Same trust violation compounded |
| FRICTION-05 | "Today's Win" disappears forever after welcome | Onboarding | Core daily intention feature missing from daily app |
| FRICTION-07 | Energy triage buttons unexplained, silently hide content | Home screen | Users confused by disappearing tasks |
| FRICTION-17 | "Twice Daily" supplements treated as once daily | Supplements | Broken feature - users will miss medication doses |
| FRICTION-24 | Drag-to-reorder has invisible affordance | Home tasks | Users can't discover reordering |
| FRICTION-26 | Grocery shopping progress bar permanently stuck at 0% | Groceries | Broken UI element, makes feature feel abandoned |
| FRICTION-27 | Voice transcription shows "Transcribing..." then fails silently | Journal | False promise of speech-to-text |
| FRICTION-30 | Work/Life toggle silently hides items with no explanation | Home screen | Most dangerous hidden feature - causes panic |
| FRICTION-34 | Accidental un-tap instantly destroys streak with no undo | Habit tracking | Silent data loss of progress |
| FRICTION-38 | "Sign Out" permanently deletes all data without clear warning | Settings | Catastrophic data loss |

### High (Significant frustration / Blocks feature discovery)

| ID | Issue | Location | Impact |
|---|---|---|---|
| FRICTION-01 | Habit notifications are unimplemented despite collecting permission | Onboarding | Broken promise |
| FRICTION-06 | Empty home screen after warm onboarding | First launch | Highest drop-off risk moment |
| FRICTION-11 | Emoji requirement for habits not communicated until save fails | Add Habit | Invisible validation frustration |
| FRICTION-25 | Grocery auto-categorization changes silently while typing | Groceries | Feels glitchy |
| FRICTION-28 | Journal entries look tappable but do nothing | Journal | False affordance |
| FRICTION-37 | Supplement streak badge disappears when taken (backwards logic) | Supplements | Counter-motivational |
| FRICTION-39 | No data backup or export (all local, no recovery) | Settings/App-wide | Long-term trust risk |

### Medium (Creates confusion / Slows user down)

| ID | Issue | Location | Impact |
|---|---|---|---|
| FRICTION-08 | "Focus Capsule" is unexplained jargon | Calendar header | Users don't know it's interactive |
| FRICTION-10 | Add modal descriptions use confusing terms | Add Options | "One-off" and "recurring goal" unclear |
| FRICTION-12 | Switching habit type clears selected emoji | Add Habit | Frustrating exploration penalty |
| FRICTION-16 | No confirmation after creating habit/supplement/task | All creation flows | Users doubt save succeeded |
| FRICTION-18 | "Morning" notification time is undefined | Add Supplement | Users can't control reminder timing |
| FRICTION-20 | Horizontal scroll supplements with no scroll indicator | Home screen | Users may miss supplements |
| FRICTION-22 | Empty task submission fails silently | CaptureBar | Button appears broken |
| FRICTION-23 | Completed tasks don't reorder or separate | Home tasks | Cluttered task list |
| FRICTION-29 | Inbox-to-task conversion auto-archives with no confirmation | Inbox | Feels like deletion |
| FRICTION-31 | Calendar dots have no color legend | History | Colors are meaningless |
| FRICTION-35 | Streak breaks on unscheduled days if "Every day" is set | Habits | Unexpected streak loss |
| FRICTION-36 | Celebration phrase from wrong habit | Celebration | Minor but breaks immersion |

### Low (Minor annoyances / Polish issues)

| ID | Issue | Location | Impact |
|---|---|---|---|
| FRICTION-04 | "Feeling" used for one sentence only | Onboarding | Low payoff for emotional input |
| FRICTION-09 | Bottom nav labels are 10px / unreadable | Navigation | Accessibility issue |
| FRICTION-13 | Celebration phrase context unknown to user | Add Habit | Users don't know when they'll see it |
| FRICTION-14 | Energy Cost has no explanation | Add Habit | Mysterious setting |
| FRICTION-15 | Work Related toggle unexplained | Add Habit/Supplement | Users don't know the consequence |
| FRICTION-19 | No confirmation on supplement creation | Add Supplement | Doubt |
| FRICTION-21 | Three different entry points for adding tasks | Home/Nav/Capture | Minor confusion |
| FRICTION-32 | Long-press to delete in calendar has no hint | History | Hidden destructive action |
| FRICTION-33 | Progress rings don't explain what % means | Life dashboard | Ambiguous metrics |

---

## TOP 10 RECOMMENDATIONS (Priority Order)

### 1. Fix the Onboarding-to-Home Transition
**Problem**: Warm, personalized onboarding dumps users on an empty screen.
**Fix**: After onboarding, show a guided "Set up your day" flow that:
- Creates a first habit based on their "Today's Win"
- Suggests 3 starter habits based on their "falls through" answers
- Walks them through adding their first supplement
- Shows a sample day view so they know what the app looks like when populated

### 2. Actually Use Onboarding Data (or Remove the Questions)
**Problem**: 3 of 5 data points collected are never used.
**Fix**: Either:
- Use `losesDayAt` to configure morning/evening notification timing
- Use `fallsThrough` to suggest specific features (Later list, Inbox, Habits)
- Use `todayWin` as a daily home screen intention card
- OR remove the questions entirely to shorten onboarding from 7 to 4 steps

### 3. Add Work/Life Mode Explanation and Safeguards
**Problem**: Accidental tap hides all content with no explanation.
**Fix**:
- Show a one-time tooltip explaining Work/Life mode on first toggle
- Add a visible banner when filtering is active: "Showing work items only - Tap to show all"
- Require confirmation before first toggle ("Switch to Work Focus? Personal items will be hidden.")

### 4. Fix "Twice Daily" Supplements
**Problem**: Users tracking morning/evening medication doses can only toggle once per day.
**Fix**: When frequency is "Twice Daily," show two toggle buttons (AM/PM) on the supplement card. Track separately.

### 5. Add Undo for Habit/Supplement Toggle
**Problem**: Accidental un-tap silently destroys streaks.
**Fix**: Show a 5-second "Undo" snackbar after toggling completion off: "Habit uncompleted. Streak changed from 7 to 0. [Undo]"

### 6. Fix the Grocery Progress Bar
**Problem**: Hardcoded to 0%. Broken feature.
**Fix**: Calculate `(purchased items / total items) * 100` and animate the width.

### 7. Add Confirmation Feedback to All Creation Flows
**Problem**: Users never know if saves succeeded.
**Fix**: After every create/edit/delete action, show a brief toast: "Habit created", "Supplement saved", "Task deleted." Use haptic feedback on success.

### 8. Make Drag-to-Reorder Discoverable
**Problem**: Grip handle at 0.3 opacity is invisible.
**Fix**: Either:
- Show a one-time hint: "Hold and drag to reorder tasks"
- Increase grip handle opacity to 0.6+ with a subtle animation
- Support long-press-to-drag (the pattern users actually expect)

### 9. Implement or Remove Voice Transcription
**Problem**: "Transcribing..." animation promises speech-to-text that doesn't exist.
**Fix**: Either:
- Integrate Whisper or another STT API
- OR remove the "Transcribing..." state entirely and just show the manual transcript editor immediately with honest copy: "Add a written note about your recording"

### 10. Make "Sign Out" Safe
**Problem**: Sign out = permanent data deletion with unclear warning.
**Fix**:
- Rename to "Reset App" or "Delete All Data & Sign Out" so the action is clear
- Require typing "DELETE" to confirm
- Offer a JSON export before wiping data
- Separate "Sign Out" (which should preserve data) from "Delete Account"

---

## GROWTH IMPACT MATRIX

| Recommendation | Effort | Retention Impact | Acquisition Impact |
|---|---|---|---|
| 1. Onboarding-to-Home transition | Medium | Very High (Day 1 retention) | Medium |
| 2. Use onboarding data | Medium | High (personalization) | Low |
| 3. Work/Life mode safeguards | Low | High (prevents panic) | Low |
| 4. Fix Twice Daily supplements | Medium | High (medication users) | Low |
| 5. Undo for toggle | Low | Very High (prevents rage-quit) | Low |
| 6. Fix grocery progress bar | Very Low | Medium | Low |
| 7. Confirmation toasts | Low | Medium (trust) | Low |
| 8. Discoverable reordering | Low | Medium (power users) | Low |
| 9. Voice transcription | High | Medium (journal users) | Medium |
| 10. Safe sign out | Low | Very High (prevents data loss) | Low |

---

## ADDITIONAL CODE-LEVEL BUGS FOUND

### Date Format Inconsistency (Potential Data Corruption)
```
HabitContext.tsx line 17:    `${year} -${month} -${day} `  (SPACES around dashes)
SupplementContext.tsx line 17: `${year}-${month}-${day}`   (no spaces)
```
These are different date formats in different contexts. If any cross-context logic ever compares dates, it will silently fail. This should be unified immediately.

### Celebration Phrase Fetches Wrong Habit
`index.tsx` line ~269: Gets celebration phrase from the first habit that has one, not the habit that actually achieved the milestone. With multiple habits having phrases, the wrong message displays.

### Supplement Streak Badge Shows Backwards
`SupplementCard.tsx` shows the streak flame only when the supplement is NOT taken. Once taken, the motivational badge disappears. This is counter-intuitive — users expect to see their streak grow, not hide.

### Email Field Defined But Never Collected
`types/onboarding.ts` defines an `email` field in OnboardingResponses, but no onboarding screen ever collects it. Dead code that suggests a removed or planned feature.

### Habit Notification Stub
`lib/notifications.ts:185` — `scheduleHabitNotifications()` returns an empty array. Habit reminders are completely unimplemented despite the app collecting notification permissions specifically for this purpose.

---

*Analysis performed by walking through every screen, component, context, and data model in the codebase as "Sarah, the Overwhelmed Professional" — a user who represents the core value proposition of Daily: one app for everything, used every day, that must be dead simple.*
