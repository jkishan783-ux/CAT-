# CAT- Prep App

A full-stack preparation application for the Common Admission Test (CAT) featuring a Node.js/Express backend API and a React Native (Expo) mobile frontend.

## Key Features
- **User Authentication:** JWT-based email/password registration and logins.
- **Scoring Engine:** CAT marking rules (+3 correct, -1 wrong MCQ, 0 wrong TITA, 0 unattempted).
- **Daily Streak Tracker:** Calendar-based streak calculation that increments on consecutive days and resets if a day is skipped.
- **Section Timer:** Strict sequential progression (`VARC` -> `DILR` -> `QA`) with auto-locking section boundaries.
- **6-Hour Interval Tests:** Dynamic 4-question sets that refresh at 12 AM, 6 AM, 12 PM, and 6 PM.
- **Leaderboard:** Global ranking boards showing top streak holders and highest mock exam scorers.
- **CSV Bulk Uploader:** Admin tool to parse questions containing LaTeX equations and Markdown formatting.

## Setup Instructions

### Backend (Node.js/Express/TypeScript)
1. Navigate to the `backend/` directory.
2. Run `npm install` to install dependencies.
3. Configure your MongoDB connection in a `.env` file (e.g., `MONGODB_URI=mongodb://localhost:27017/cat_prep`).
4. Start the development server using `npm run dev`.
5. Run tests using `npm test`.

### Mobile Frontend (React Native/Expo/TypeScript)
1. Navigate to the `mobile/` directory.
2. Setup and run with `npx expo start` or target platform scripts.
