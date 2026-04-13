# Arc — Original Implementation Plan (Historical)

> This is the day-1 plan written before any code shipped. It captures the locked-in decisions, the working-style intent, and the phase breakdown.
>
> **For the live status of what's done vs pending, see the "Build phases" table in [`CLAUDE.md`](../CLAUDE.md).** Some details below are now stale (project was renamed from "TimeTracker" → "Arc"; ios/ committal decision settled to "commit"; etc.). Kept here as a reference for how the plan was originally framed.

---

**Repo:** https://github.com/simonstancovich/timer-app
**Local path:** `~/apps/timer-app`
**Spec:** React Native + Expo, iOS-first, Dynamic Island via native Swift widget

## Decisions locked in

- **Package manager:** npm
- **Build approach:** Local prebuild + Xcode (needed for Swift widget extension)
- **Styling:** NativeWind v4 (Tailwind for RN) — most-used, best AI/doc support
- **State:** Zustand + `persist` middleware
- **Persistence:** AsyncStorage (sufficient for years of session data, ~730KB/yr)
  - Use versioned persistence (`version` + `migrate`) from day 1 for schema evolution
- **Animations:** react-native-reanimated 3 (style objects, not className)
- **Fonts:** Plus Jakarta Sans (UI) + Space Mono (all numbers/timers)

## Working style

Small steps, pause for review between each. User is learning agent workflow.
Every step ends with: "here's what changed, want to proceed to X?"

---

## Phase 0 — Setup

**Step 0.1 — Verify toolchain**
- Check Xcode is installed (`xcode-select -p`)
- Check Node/npm versions
- Confirm git identity is set

**Step 0.2 — Clone + init Expo**
- `cd ~/apps && git clone git@github.com:simonstancovich/timer-app.git`
- `cd timer-app && npx create-expo-app@latest . --template tabs` (or blank + router)
- First commit: bare Expo scaffold
- Run `npm start` once to confirm it boots in Expo Go (sanity check before we add native)

**Step 0.3 — Install core deps**
- expo-router (usually preinstalled with tabs template)
- `npm i zustand @react-native-async-storage/async-storage`
- `npm i react-native-reanimated react-native-gesture-handler`
- `npm i expo-haptics expo-notifications expo-font expo-linear-gradient`
- `npm i @react-native-masked-view/masked-view` (gradient text on welcome)
- NativeWind v4 setup: `npm i nativewind tailwindcss@^3`, add Babel plugin, create `tailwind.config.js`, `global.css`
- Commit

**Step 0.4 — Prebuild + Xcode sanity check**
- `npx expo prebuild --platform ios`
- Open `ios/arc.xcworkspace` in Xcode
- Build + run on simulator (no signing needed for sim)
- Later, wire up physical device with free Apple ID for Dynamic Island testing
- Decision: **commit `ios/`** so Swift widget edits are tracked in git

**Step 0.5 — Project scaffolding**
- Create folder structure from spec §5: `src/app`, `src/components`, `src/hooks`, `src/tokens`, `src/store`, `src/types`, `src/utils`
- Write tokens: `colors.ts`, `typography.ts`, `spacing.ts`, `shadows.ts` (verbatim from spec §2)
- Write types: `types/index.ts` (verbatim from spec §3)
- Stub zustand store with persist + version
- Commit

---

## Phase 1 — Core primitives

Build the reusable components with no screens yet. Verify each in an isolated test screen.

- `<MonoText />` — Space Mono sizing variants
- `<Card />` — white card with optional colored top stripe
- `<Pill />` — rounded pill background
- `<ProgressBar />` — animated width via Reanimated
- `<Sparkline />` — 7-bar SVG (install `react-native-svg`)
- `<Timeline />` — horizontal session blocks with live-dot pulse
- `<GradientText />` — MaskedView + LinearGradient (for welcome)

Each primitive ships with tests in the same PR.

---

## Phase 2 — Onboarding (Screens 01–02)

- `onboarding/welcome.tsx` — title, gradient text, animated CTA, timed animation sequence (spec §7.01)
- `onboarding/setup.tsx` — color picker, name input, CTA that activates on input (spec §7.02)
- Persist `onboardingDone` flag; root redirects to `/(tabs)` when true
- End-of-phase: onboarding flow creates the first project and lands on an empty Home

---

## Phase 3 — Home idle (Screen 03)

- Header: date, greeting, streak badge (bounce animation on mount)
- Today card: top stripe, big mono time, goal bar, hint copy
- Timeline card: today's sessions rendered dynamically from store
- Project cards: dot + name + badge + note + sparkline + play button
- Add-past-session bottom sheet (`@gorhom/bottom-sheet`)
- Wire play button to start a session (stub the live timer for now)

---

## Phase 4 — Live timer (Screen 04) — the marquee screen

- Full-screen color flood (bg, status bar, nav bar → project dark color, 400ms)
- 82px Space Mono timer with breathe animation
- Note input + quick chips
- Pause + Stop controls
- Milestone detection (1h, 2h, 90min deep-work) with haptics + pulse animation
- Mini timeline at bottom with live green dot
- Custom tab bar adapts colors during live state

---

## Phase 5 — Celebration + Projects + Stats (Screens 05–07)

- `celebration.tsx` modal: auto-shows on stop, auto-dismisses 2s, staggered animations, haptic
- `(tabs)/projects.tsx`: list with inline new-project form, live-state card treatment
- `(tabs)/stats.tsx`: weekly wrapped card, stacked bar chart, insight cards

---

## Phase 6 — Dynamic Island (iOS only)

Requires: physical iPhone, iOS 16.1+, Apple Developer account for signing.

- Add Widget Extension target in Xcode (`ArcWidget`)
- Write Swift `ActivityAttributes` struct (spec §9)
- Build 3 states: compact, minimal, expanded
- Write RN native module bridge (`LiveActivityModule`)
- `hooks/useLiveActivity.ts` — start/update/end
- Wire into `startSession` / `stopSession` / timer tick
- Test on real device

---

## Phase 7 — Polish

- Notifications (milestone toasts when app backgrounded)
- Needs-love badge logic (zero sessions in last 3 days)
- Deep-work (90 min) badge swap
- Best-day hint copy on Today card
- Accessibility pass (labels, reduced motion respects animations)
- App icon + splash screen
- TestFlight build (requires Apple Developer Program)

---

## Open questions / to decide later

- Notifications strategy: local only, or push? (Local only is simpler and sufficient for milestones)
- Data export (CSV) — nice-to-have, not in spec
- Backup/sync across devices — not in spec, would need a backend
