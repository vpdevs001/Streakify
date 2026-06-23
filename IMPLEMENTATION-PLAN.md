# ChaiStreaks - Implementation Plan (Expo SDK 55)

Version: 1.0
Target Platform: Android, iOS, Web
Framework: Expo SDK 55
Router: Expo Router
Database: SQLite (Existing Implementation)
Theme: System Default + Light/Dark Override
Design Language: Orange + Neutral Black/White
Style: Hybrid Productivity + Light Gamification

---

# 1. Product Vision

ChaiStreaks is a habit-building application focused on consistency rather than motivation.

Core philosophy:

"Build habits one cup of chai at a time."

The application should feel:

- Fast
- Warm
- Focused
- Modern
- Delightful without being childish

Users should be able to:

- Create habits
- Track completion
- Maintain streaks
- Visualize progress
- Build consistency over time

---

# 2. Technical Stack

## Existing

- Expo SDK 55
- Expo Router
- SQLite
- TypeScript

## Additional Packages

```bash
bun add react-native-reanimated
bun add react-native-svg
bun add react-native-chart-kit
bun add lucide-react-native
bun add expo-haptics
bun add @react-native-async-storage/async-storage
```

---

# 3. Database Review

Existing tables:

## users

Stores application user information.

## habits

Stores all habit records.

## habit_history

Stores completion records.

## preferences

Stores application preferences.

---

# 4. Proposed Database Enhancements

No major schema changes required.

Optional future fields:

```sql
last_completed_at TEXT
```

Purpose:

- Faster streak calculations
- Faster dashboard loading

Not required for MVP.

---

# 5. Folder Structure

```txt
src/

app/

  _layout.tsx

  onboarding.tsx

  (tabs)/
    _layout.tsx

    home.tsx
    progress.tsx
    settings.tsx

  habit/
    create.tsx
    [id].tsx

components/

  ui/
    Button.tsx
    Card.tsx
    Input.tsx
    Modal.tsx
    IconButton.tsx

  habits/
    HabitCard.tsx
    HabitList.tsx
    EmptyHabits.tsx

  charts/
    WeeklyChart.tsx
    MonthlyChart.tsx
    CompletionPieChart.tsx

  onboarding/
    OnboardingSlide.tsx

  layout/
    ScreenHeader.tsx
    FloatingActionButton.tsx

hooks/

  useTheme.ts
  useHabits.ts
  useStats.ts

services/

  analytics/

theme/

  colors.ts
  dark.ts
  light.ts

utils/

  chaiScore.ts
  dateHelpers.ts

constants/

  spacing.ts
  typography.ts
```

---

# 6. Navigation Architecture

## Root Flow

```txt
App Launch
    │
    ▼

Onboarding Completed?

YES
 │
 ▼
Tabs

NO
 │
 ▼
Onboarding
```

---

## Bottom Tabs

```txt
Home

Progress

Settings
```

---

## Floating Action Button

Visible on:

```txt
Home
```

Navigates to:

```txt
Habit Create Screen
```

---

# 7. Theme System

## Modes

- System
- Light
- Dark

Default:

```txt
System
```

Stored in:

```txt
preferences table
```

---

# 8. Color Palette

## Dark Mode

```txt
Background #0D0D0D
Surface    #171717
Card       #1F1F1F

Primary    #FF8A3D
Hover      #FF9C5A

Success    #22C55E
Danger     #EF4444

Text       #F5F5F5
Muted      #A3A3A3
```

---

## Light Mode

```txt
Background #FAFAF8
Surface    #FFFFFF
Card       #FFFFFF

Primary    #F97316
Hover      #FB923C

Text       #171717
Muted      #737373

Border     #E5E5E5
```

---

# 9. Onboarding

Total Screens:

```txt
3
```

---

## Screen 1

Title:

```txt
Build Tiny Habits
That Actually Stick
```

Subtitle:

```txt
Consistency beats motivation.
```

---

## Screen 2

Title:

```txt
Track Your Streaks
```

Visual:

```txt
Animated Streak Counter
```

Example:

```txt
🔥 23 Day Streak
```

---

## Screen 3

Title:

```txt
One Cup At A Time ☕
```

CTA:

```txt
Start Building Habits
```

---

## Persistence

Store:

```txt
onboarding_complete
```

Value:

```txt
true
```

---

# 10. Home Screen

Structure:

```txt
Greeting Header

Progress Ring

Statistics Row

Today's Habits

Floating Action Button
```

---

## Greeting

Examples:

```txt
Good Morning ☕

Good Afternoon ☕

Good Evening ☕
```

---

## Progress Card

Displays:

```txt
Completion %

Completed Habits

Remaining Habits
```

---

## Statistics

Cards:

```txt
🔥 Current Streak

🏆 Best Streak

☕ Chai Score
```

---

## Habit List

Display:

```txt
Icon

Title

Current Streak

Frequency

Completion State
```

---

## Completion Style

Selected Option:

```txt
Completed habits remain visible.
```

Visual Changes:

```txt
Opacity reduced

Green checkmark

Subtle strike-through
```

---

# 11. Habit Card

Collapsed View

```txt
Icon

Habit Name

Current Streak

Completion Button
```

---

Expanded View

```txt
Description

Reminder Time

Frequency

Edit

Archive

Delete
```

---

# 12. Create Habit Screen

Sections:

---

## Basic Information

Fields:

```txt
Title

Description
```

---

## Appearance

User can choose:

```txt
Emoji
```

OR

```txt
Lucide Icon
```

---

## Color Selection

Presets:

```txt
Orange
Green
Yellow
Pink
Red
Teal
```

---

## Frequency

Options:

```txt
Daily

Weekly

Custom
```

---

## Reminder

Time Picker

```txt
TODO: Add Notifications
```

---

## Save

Sticky bottom action button.

---

# 13. Edit Habit Screen

Supports:

```txt
Update Habit

Archive Habit

Delete Habit
```

---

# 14. Progress Screen

Tabs:

```txt
7 Days

30 Days

All Time
```

---

## Weekly Chart

Bar Chart

Displays:

```txt
Completion Count
```

Per day.

---

## Monthly Chart

Bar Chart

Displays:

```txt
Daily Completions
```

Across 30 days.

---

## Pie Chart

Displays:

```txt
Completed %

Missed %
```

---

## Statistics

Cards:

```txt
Longest Streak

Current Streak

Total Completions

Success Rate
```

---

# 15. Chai Score System

Purpose:

Provide a single consistency metric.

Range:

```txt
0 - 100
```

---

Formula

```ts
score = currentStreak * 2 + completionRate * 50 + activeHabits * 2;
```

Clamp:

```ts
0 - 100;
```

---

Displayed On

```txt
Home

Progress
```

---

# 16. Settings Screen

Sections:

---

## Appearance

Options:

```txt
System

Light

Dark
```

---

## Data

Actions:

```txt
Export Data

Import Data

Reset Data
```

---

## Notifications

Placeholder

```txt
TODO: Add Notifications
```

---

## About

Displays:

```txt
Version

GitHub

Privacy Policy
```

---

# 17. Animations

Library:

```txt
React Native Reanimated
```

---

## Habit Completion

Animation:

```txt
Scale Down

Scale Up

Checkmark Pop
```

Duration:

```txt
250ms
```

---

## Progress Ring

Animated value transition.

---

## Statistics Cards

Fade-in on load.

---

## FAB

Scale animation.

---

## Page Transitions

```txt
Fade + Slide
```

---

# 18. Haptics

Library:

```txt
expo-haptics
```

Triggers:

```txt
Habit Completion

Habit Creation

Habit Deletion
```

---

# 19. Hover States (Web)

Cards:

```txt
translateY(-2)
```

---

Buttons:

```txt
brightness + 5%
```

---

Inputs:

```txt
orange border
```

---

# 20. Accessibility

Requirements:

- Touch targets >= 44px
- Accessible labels
- Theme contrast support
- Dynamic font scaling

---

# 21. Future Features

Phase 2

```txt
Notifications

Achievements

Cloud Sync

Authentication

Widgets

Share Progress Cards
```

---

# 22. Development Order

Phase 1

Theme System

Navigation

Onboarding

Bottom Tabs

---

Phase 2

Home Screen

Habit Cards

FAB

---

Phase 3

Create/Edit Habit

Database Integration

---

Phase 4

Progress Screen

Charts

Chai Score

---

Phase 5

Settings

Theme Persistence

Data Management

---

Phase 6

Polish

Animations

Haptics

Empty States

Accessibility

```

Success Criteria:

A user can install ChaiStreaks, complete onboarding, create habits, maintain streaks, track progress, switch themes, and view consistency analytics without any notifications implementation.
```
