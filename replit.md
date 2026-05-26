# Life OS

A premium personal productivity operating system centered around a 365-dot year-grid interface. Minimal, futuristic, and emotionally immersive.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app (Expo Go or web preview)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: React Native + Expo Router (file-based routing)
- State: React Context + AsyncStorage (offline-first)
- Icons: @expo/vector-icons (Feather)
- Animations: React Native Animated + react-native-reanimated

## Where things live

- `artifacts/mobile/` — the entire Expo app
- `artifacts/mobile/app/` — Expo Router screens
  - `(tabs)/index.tsx` — Home screen (dot grid + clock)
  - `day/[date].tsx` — Day workspace (Tasks / Journal / Analysis / Settings)
- `artifacts/mobile/components/DotGrid.tsx` — 365-dot year grid
- `artifacts/mobile/components/tabs/` — the 4 day-workspace tabs
- `artifacts/mobile/context/AppContext.tsx` — all state, CRUD, and analytics logic
- `artifacts/mobile/constants/colors.ts` — design tokens (dark + light theme)

## Architecture decisions

- Dot grid uses FlatList with `numColumns=7` and `getItemLayout` for smooth scrolling performance
- Habit tasks are "virtual" until toggled — then a real Task record is created and persisted
- Mood is stored as `{ [date]: MoodType }` independently from tasks/journals
- Gold mood days get a special gold glowing dot on the year grid
- `useColors()` auto-switches between dark/light palette based on device system settings

## Product

The dot grid home screen shows all 365 days of the current year. Tap any dot to enter that day's workspace:
- **Tasks** — daily tasks, anytime tasks, and habits (full CRUD, swipe-friendly, habit auto-recurrence)
- **Journal** — distraction-free writing with auto-save and mood selector
- **Analysis** — completion rings, 30-day trend charts, mood timeline, habit streaks, lifetime stats
- **Settings** — habit management (create/edit/delete/toggle) with color coding

Mood system: 5 moods (Great, Good, Okay, Sad, Gold). Gold mood turns that day's dot metallic gold with a pulsing glow — marks legendary life moments.

## User preferences

- Dark theme primary: `#39FF7E` (neon green), `#0A0A0F` background
- Light theme primary: `#18C963` green, `#F5F5FA` background
- Font: Inter (400, 500, 600, 700)
- No emojis in UI (use Feather icons instead)

## Gotchas

- Web preview always shows light theme (browser reports light color scheme)
- Real dark theme visible on Android device via Expo Go or dark-mode browser
- `useNativeDriver` is conditionally `Platform.OS !== 'web'` on animated dots to avoid web warnings
- Habit toggle calls `toggleHabitTask(habitId, date)` — not `toggleTask(id)` — to handle virtual task materialization
