# CAT Mobile Prep App Architecture

This directory contains the React Native + Expo + TypeScript scaffold for the CAT Prep mobile application.

## Folder Directory Structure

```
mobile/
├── assets/                 # App icons, splash screens, and localized graphics
├── src/
│   ├── components/         # Reusable presentation UI elements (e.g. timers, badges)
│   │   └── CATSectionTimer.tsx
│   ├── constants/          # Stylesheet theme sheets (colors, font-weights, spacings)
│   ├── context/            # React global Contexts (AuthContext, MockTestContext)
│   ├── features/           # Component groupings structured by business feature area
│   │   ├── auth/           # Login, Sign up, and Session restoration screens
│   │   ├── dashboard/      # Daily streaks, dynamic interval timers, progress views
│   │   │   ├── StreakCounter.tsx
│   │   │   └── IntervalTestCard.tsx
│   │   ├── mockTest/       # Mock interfaces, sectional locks, question pagination
│   │   │   └── MockTestScreen.tsx
│   │   └── leaderboard/    # Top scorers ranking tabs
│   └── services/           # Backend API calls, fetch layers, error handling
├── App.tsx                 # Main application controller
├── app.json                # Expo setup config
├── package.json            # Node modular dependencies
└── tsconfig.json           # Type checking guidelines
```

## Critical Front-End Policies

1. **Section Locking Mechanic:**
   - Sequential flow must follow: `VARC` -> `DILR` -> `QA`.
   - Backtracking or jumping ahead dynamically between sections is strictly blocked.
   - When the sectional timer completes, responses are locked and the app forces the next section.
2. **Type-In-The-Answer (TITA):**
   - Text inputs with numeric-only keypads are used. No options are listed.
   - Incorrect answers do not apply negative marks.
3. **Streak Syncing:**
   - The streak is updated dynamically when a user completes the daily test.
   - Timezones must be handled using localized `YYYY-MM-DD` strings passed to `/api/tests/submit` to prevent false streak breaks during clock drift.
