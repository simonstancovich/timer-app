# Arc — Full Technical Specification

**Figma file:** https://www.figma.com/design/Xldm7IoRzDrVACoHyWd7NS
**Target platform:** iOS (React Native + Expo) — Dynamic Island requires real device
**Prototype reference:** React JSX prototype on Figma, use it as interaction reference

> Original spec was titled "TimeTracker". App has since been renamed to **Arc**. Bundle ID `com.simonstancovich.arc`. App Store name `Arc Timer` because "Arc" was taken.

---

## 1. Tech Stack

```
React Native (Expo SDK 51+)
├── expo-router (file-based navigation)
├── react-native-reanimated 3 (all animations)
├── react-native-gesture-handler (swipe/tap gestures)
├── expo-haptics (feedback on start/stop/milestone)
├── expo-notifications (milestone toasts)
├── @react-native-async-storage/async-storage (persistence)
├── expo-activity-kit (Dynamic Island / Live Activities — iOS 16.1+)
└── zustand (state management)
```

**Fonts (load via expo-font):**
- `PlusJakartaSans_400Regular`
- `PlusJakartaSans_500Medium`
- `PlusJakartaSans_600SemiBold`
- `PlusJakartaSans_700Bold`
- `PlusJakartaSans_800ExtraBold`
- `SpaceMono_400Regular`
- `SpaceMono_700Bold`

---

## 2. Design Tokens

### Colors
```ts
export const colors = {
  // Background
  bg:      '#F8F7F4',   // Warm off-white — app background
  white:   '#FFFFFF',   // Card surfaces

  // Text
  ink:     '#19180F',   // Primary text
  sub:     '#6B6A62',   // Secondary text
  muted:   '#B0ADA5',   // Placeholder / disabled

  // Surfaces
  surf:    '#F0EEE9',   // Chip / tag backgrounds
  brd:     '#E5E4E0',   // Card borders

  // Brand (signature color)
  brand:   '#5244E8',   // Primary brand indigo
  brandL:  '#ECEAFF',   // Brand light (badges, active nav)
  brandD:  '#3B31D0',   // Brand dark (live timer bg, button press)

  // Project palette (7 colors) — IMPLEMENTED FLAT (violet, violetLight, violetDark, etc.)
  violet:  { c: '#5244E8', l: '#ECEAFF', d: '#3B31D0' },
  ocean:   { c: '#0369A1', l: '#E0F2FE', d: '#025580' },
  ember:   { c: '#C2410C', l: '#FEF3E2', d: '#9A340A' },
  forest:  { c: '#166534', l: '#DCFCE7', d: '#104D27' },
  rose:    { c: '#9D174D', l: '#FCE7F3', d: '#7C1240' },
  amber:   { c: '#92400E', l: '#FEF9C3', d: '#6F300A' },
  teal:    { c: '#0899A0', l: '#CCFBF1', d: '#067980' },

  // Streak accent
  streakBg:   '#FFF3E0',
  streakText: '#D97706',

  // Celebration gradient stops
  celebGrad: ['#5244E8', '#9D174D', '#C2410C'],
};
```

### Typography
```ts
export const typography = {
  display: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 24, letterSpacing: -0.5 },

  bodyLg:  { fontFamily: 'PlusJakartaSans_700Bold',     fontSize: 16 },
  body:    { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  bodySm:  { fontFamily: 'PlusJakartaSans_500Medium',   fontSize: 13 },
  caption: { fontFamily: 'PlusJakartaSans_400Regular',  fontSize: 12 },
  micro:   { fontFamily: 'PlusJakartaSans_700Bold',     fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },

  timerXl: { fontFamily: 'SpaceMono_700Bold', fontSize: 82, letterSpacing: -4 },
  timerLg: { fontFamily: 'SpaceMono_700Bold', fontSize: 48, letterSpacing: -3 },
  timerMd: { fontFamily: 'SpaceMono_700Bold', fontSize: 28, letterSpacing: -1.5 },
  timerSm: { fontFamily: 'SpaceMono_700Bold', fontSize: 12, letterSpacing: -0.5 },
  numXl:   { fontFamily: 'SpaceMono_700Bold', fontSize: 40, letterSpacing: -2 },
  numLg:   { fontFamily: 'SpaceMono_700Bold', fontSize: 26, letterSpacing: -1 },
  numMd:   { fontFamily: 'SpaceMono_400Regular', fontSize: 14 },
};
```

### Spacing
```ts
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,

  screenPadH: 22,
  cardRadius:  20,
  pillRadius:  99,
  navHeight:   72,
  statusBar:   44,
};
```

### Shadows
```ts
export const shadows = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  playBtn: (color: string) => ({ shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 }),
  ctaBtn: { shadowColor: '#5244E8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 20, elevation: 10 },
};
```

---

## 3. Data Models

```ts
export type ProjectColor = 'violet' | 'ocean' | 'ember' | 'forest' | 'rose' | 'amber' | 'teal';

export interface Project {
  id: string;                    // uuid
  name: string;
  color: ProjectColor;
  lastNote: string;              // Last used task note
  weeklyGoalMinutes: number;     // Default 2400 (40h)
  weekSessions: number[];        // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] session count for sparkline
  totalMinutes: number;          // All-time
  weekMinutes: number;           // This week
  createdAt: Date;               // Implemented as ISO string for AsyncStorage round-trip
  archived: boolean;
}

export interface Session {
  id: string;
  projectId: string;
  startedAt: Date;               // Implemented as ISO string
  endedAt: Date | null;          // ISO string | null
  durationMinutes: number;
  note: string;
  isDeep: boolean;               // durationMinutes >= 90
  isPast: boolean;               // Manually added after the fact
}

export interface AppState {
  projects: Project[];
  sessions: Session[];
  activeSessionId: string | null;
  streak: number;                // Current day streak
  dailyGoalMinutes: number;      // Default 540 (9h)
  onboardingDone: boolean;
}
```

---

## 4. State Management (Zustand)

```ts
interface Store extends AppState {
  startSession: (projectId: string, note?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Session;
  addPastSession: (projectId: string, durationMinutes: number, startedAt: Date, note?: string) => void;

  createProject: (name: string, color: ProjectColor) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;

  getActiveProject: () => Project | null;
  getTodaySessions: () => Session[];
  getTodayMinutes: () => number;
  getWeekMinutes: () => number;
  getProjectWeekMinutes: (projectId: string) => number;
}
```

---

## 5. File Structure

```
src/
├── app/                          # expo-router screens
│   ├── _layout.tsx               # Root layout, font loading, nav
│   ├── index.tsx                 # Redirects to /home
│   ├── onboarding/
│   │   ├── welcome.tsx           # Screen 01
│   │   └── setup.tsx             # Screen 02
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── index.tsx             # Screen 03 — Home (idle or live timer)
│   │   ├── projects.tsx          # Screen 06 — Projects
│   │   └── stats.tsx             # Screen 07 — Stats
│   └── celebration.tsx           # Screen 05 — Stop celebration (modal)
│
├── components/
│   ├── primitives/
│   │   ├── Card.tsx
│   │   ├── Pill.tsx
│   │   ├── MonoText.tsx          # Always Space Mono
│   │   ├── GradientText.tsx      # For welcome screen
│   │   ├── ProgressBar.tsx
│   │   └── Sparkline.tsx
│   ├── home/
│   │   ├── StreakBadge.tsx
│   │   ├── TodayCard.tsx
│   │   ├── Timeline.tsx          # Horizontal session timeline
│   │   ├── ProjectCard.tsx       # Tappable card with sparkline + play btn
│   │   └── AddPastSession.tsx    # Bottom sheet
│   ├── timer/
│   │   ├── LiveTimerScreen.tsx   # Full-screen takeover
│   │   ├── BigTimer.tsx          # 82px monospace countdown
│   │   ├── NoteInput.tsx
│   │   ├── QuickChips.tsx
│   │   └── TimerControls.tsx     # Pause + Stop
│   ├── projects/
│   │   ├── ProjectListItem.tsx
│   │   └── NewProjectForm.tsx
│   ├── stats/
│   │   ├── WeeklyWrapped.tsx
│   │   ├── DailyBarChart.tsx
│   │   └── InsightCard.tsx
│   └── nav/
│       └── TabBar.tsx            # Custom tab bar with live state
│
├── hooks/
│   ├── useTimer.ts               # Interval, pause, resume, elapsed
│   ├── useLiveActivity.ts        # Dynamic Island bridge
│   └── useHaptics.ts
│
├── tokens/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── shadows.ts
│
├── store/
│   └── index.ts
│
├── types/
│   └── index.ts
│
└── utils/
    ├── formatTime.ts             # fmt(secs), fhm(secs)
    └── sessionHelpers.ts
```

---

## 6. Component Primitives

### `<Card />`
Rounded white card with 1px border. Optional colored progress stripe at the top.
- Style: bg white, border 1px `#E5E4E0`, borderRadius 20, overflow hidden
- Top stripe: 5px tall, background `colorL`, foreground `color` at `pct%`

### `<Pill />`
Rounded pill button/badge. Default radius 99.

### `<MonoText />`
Always Space Mono. Use for ANY number, time, percentage. `size: 'xl' | 'lg' | 'md' | 'sm'` maps to `timerXl..timerSm`.

### `<ProgressBar />`
0–100 pct, color, optional bgColor (default `surf`), height (default 6), borderRadius (default 3), animated (Reanimated width transition).

### `<Sparkline />`
7-bar weekly activity chart — used on every project card.
- Each bar: width 6, gap 2, maxHeight 16, minHeight 2
- Opacity: 0.85 if value > 0, 0.15 if 0 (empty day)
- Border radius: 1.5 on all corners

### `<Timeline />`
Horizontal session timeline for today. Sessions as colored blocks from 9am → current time (540min window).
```ts
interface TimelineSession {
  startMinuteOffset: number;  // minutes since 9am
  durationMinutes: number;
  color: string;
  label: string;
  isLive?: boolean;           // pulsing green dot
}
interface TimelineProps {
  sessions: TimelineSession[];
  windowMinutes?: number;     // default 540 (9am–6pm)
}
```
- Track: 2px tall, color `surf`
- Session blocks: 24px tall, borderRadius 5, borderTop 3px darken(color, 30)
- Live dot: 10px circle, forest green, pulsing animation

---

## 7. Screen Specifications

### Screen 01 — Welcome (`onboarding/welcome.tsx`)

**Layout:** Centered column, bg `#F8F7F4`

**Animation sequence (timing critical):**
```
0ms:    ⏱ emoji appears, breathing animation (scale 1→1.14→1, 2.5s loop)
0ms:    "Track time." hidden (opacity 0)
0ms:    "Actually enjoy it." hidden (opacity 0)
600ms:  Subtitle fades up (opacity 0→1, translateY 16→0, 500ms ease)
800ms:  Button pops in (scale 0.7→1.08→1, opacity 0→1, 600ms, cubic-bezier(.34,1.56,.64,1))
1600ms: "Track time." transitions to brand color #5244E8 (color transition, 600ms ease)
1600ms: "Actually enjoy it." gets gradient fill: ember→rose→violet, 500ms fade
1600ms: Button background transitions from #19180F → gradient(135deg, #5244E8, #9D174D, #C2410C), 600ms ease
```

**Elements:**
- Emoji `⏱`: fontSize 72, centered
- Title line 1 `"Track time."`: fontSize 34, ExtraBold
- Title line 2 `"Actually enjoy it."`: fontSize 34, ExtraBold — gradient text
- Subtitle: fontSize 14, Regular, color sub, lineHeight 1.75
- CTA button: 286×58, borderRadius 29, gradient bg, text "Get started →" fontSize 17 Bold white
- Caption: "Free to use · No signup · Start in 10 sec", fontSize 11, muted, centered

Gradient text: use `expo-linear-gradient` + `MaskedView`.

---

### Screen 02 — Setup (`onboarding/setup.tsx`)

**Layout:** Full screen, bg `brandD (#3B31D0)`, transitions color on dot tap

**Transition:** When user picks a color, animate background with `useAnimatedStyle` + `withTiming(500ms)`.

**Elements:**
- Section label: "QUICK SETUP" — fontSize 10, Bold, white 40% opacity, letterSpacing 1, uppercase
- Heading: "Name your / first project" — fontSize 28, ExtraBold, white
- Sub: "Add more any time." — fontSize 13, white 48%
- Color picker: 7 dots, 34px each, gap 10, active state = white 2.5px border + scale 1.18
- Input: bg white 13%, border white 24%, borderRadius 16, fontSize 17 SemiBold white placeholder
- CTA button (inactive): bg white 15%, text white 34%, borderRadius 29, not pressable
- CTA button (active): bg white 94%, text = current dark color, pressable, scale feedback

**Interaction:**
- Input oninput → update button label to `Start tracking "{name}" →`
- Button only becomes pressable when input has value
- onSubmit → navigate to `/(tabs)/` with project already created

---

### Screen 03 — Home Idle (`(tabs)/index.tsx`)

**Status bar:** Light content, bg same as screen bg or live color.

**Layout** (top → bottom, 22px horizontal padding):
1. Header row (mt 4): Date label + greeting + streak badge (right)
2. Today card (mt 18): Progress card with top stripe, big time, percentage, goal bar, hint text
3. Timeline card (mt 14): "Today's timeline" + session blocks
4. Section label: "What will you work on?" (mt 14)
5. Project cards: 4 cards, gap 10
6. Add past session dashed button (mt 4)

**Streak badge:**
- bg `#FFF3E0`, border 1px `#FFCC8055`
- borderRadius 16, padding 8×14
- Content (stacked): emoji 22px, number 16px ExtraBold `#D97706`, "STREAK" 9px Bold uppercase `#D97706`
- Entrance: scale bounce (1→1.18→0.93→1), 500ms at 400ms delay

**Today card:**
- borderTop 3px solid brand `#5244E8`
- Height ~90px
- Left: "TODAY" micro label, big monospace time (40 mono, letterSpacing -2)
- Right: "72%" (26 mono brand), "of 9h goal" caption
- Below: 6px progress bar (surf bg → brand fill, animated)
- Caption: "Best Thursday was Xh Xm — you're close!"

**Project card anatomy:**
```
Card (borderRadius 20, overflow hidden):
  ├── Top stripe: 5px — colorL bg, color fill at pct%
  └── Body (padding 15 18):
      ├── Left column:
      │   ├── Row: dot (10px circle) + name (16px Bold) + badge (hot🔥 or needs love🌱)
      │   └── Note: "↳ Working on deposit flow" (12px Regular muted, truncated)
      └── Right column (flex-shrink 0, gap 10):
          ├── Sparkline (56×18 SVG)
          └── Play button (40×40 circle, project color bg, white ▶, colored shadow)
```

**Hot badge:** bg=colorL, text=color, borderRadius 99, padding 2×8, fontSize 10 Bold
**Needs love badge:** bg=surf, text=muted, borderRadius 99, fontSize 10 SemiBold

---

### Screen 04 — Live Timer (`(tabs)/index.tsx` — replaces home when session active)

**Marquee screen.**

**Full screen color takeover:**
- Background animates from `#F8F7F4` → project `dark` color in 400ms
- Status bar, nav bar also transition to project dark color
- `withTiming(400, { easing: Easing.out(Easing.cubic) })`

**Entry animation:**
```
Screen: opacity 0→1, scale 0.97→1, 400ms ease
Timer: appears with breathe animation immediately
Note section: slideUp 450ms at 150ms delay
Controls: slideUp 450ms at 220ms delay
```

**Timer:**
- fontFamily SpaceMono_700Bold
- fontSize 82, letterSpacing -4
- color white
- lineHeight 0.9 (set via lineHeight: 74)
- breathe (scale 1→1.013→1, 3s ease-in-out, infinite) — subtle

**Milestones (1h, 2h):**
- Pulse: scale 1→1.09→0.96→1, 650ms, ease
- haptic: `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- Toast: "+1 hour 🎯" / "+2 hours 💪"

**90 minutes (deep work):**
- "Deep work" badge replaces streak badge
- Sub label changes to "🔥 Deep session"

**Goal bar:** 4px, white 12% bg, white 42% fill at current daily pct.

**Note input:** bg white 11%, border 1.5px white 22%, borderRadius 16, fontSize 15 SemiBold white, placeholder "describe your task…" white 35%. Quick chips below: bg white 12%, border white 15%, borderRadius 99.

**Controls:**
- Pause button: 64×64, borderRadius 32, bg white 13%, border 2px white 22%, icon "⏸" / "▶" 26 white
- Stop button: flex 1, height 64, borderRadius 32, bg white, color = project dark, label "Stop & save" 16 Bold

**Mini timeline:** today at a glance with white-tinted blocks, forest-green live dot.

> Note from build: at 82px on iPhone 16 Pro, an 8-char `01:23:45` overflows with default screen padding. `<MonoText>` auto-shrinks to fit (size=xl uses minimumFontScale=0.7). Live timer screen will likely also need reduced horizontal padding.

---

### Screen 05 — Stop Celebration (Modal, `celebration.tsx`)

**Triggered:** Immediately on `stopSession()` — no tap.

**Background:** Project dark color (animated from live timer, no flash).

**Glows:** Two ellipses, violet 20% top-left, rose 14% bottom-right.

**Animation sequence:**
```
0ms:   Screen slides up (translateY H→0), 400ms ease-out
0ms:   🎉 emoji appears immediately, scale 0.9→1 with bounce
120ms: "+1h 23m" slides up (translateY 24→0), opacity 0→1, 500ms ease
300ms: "saved to Courtify" fades in
400ms: Callout chip fades in
500ms: Today total chip fades in
```

**Content:**
- 🎉 emoji: fontSize 72
- Saved time: fontSize 64, SpaceMono Bold, white, letterSpacing -3
- "saved to {name}": fontSize 17 Medium, white 50%
- Callout chip: bg white 10%, border white 16%, borderRadius 16, padding 16×48 — "🔥  Deep work session! Well done." 14 SemiBold white
- Today total chip: bg white 10%, borderRadius 23 — "Today total: 8h 01m  ·  New PB! 🏆" 13 SemiBold white 75%
- Streak chip: bg white 10% — "🔥 7 day streak kept!" 12 SemiBold white 70%

**Auto-dismiss:** 2000ms → navigate back to Home Idle.
**Haptics on show:** `Haptics.notificationAsync(NotificationFeedbackType.Success)`.

---

### Screen 06 — Projects (`(tabs)/projects.tsx`)

Live state treatment:
- Currently-tracking project: bg = project color, white text, white-tinted stripe + sparkline
- "● LIVE" pill on the tracking project
- All others: standard white card

**+ New form (inline, no modal):**
- slideDown animation
- Color picker: 7 dots, active dot 3px `#19180F` outline + scale 1.2
- Name input: borderColor = selected color (transition 200ms)
- Border top of form card: 3px solid selected color (transition 200ms)
- Create button: selected color background

---

### Screen 07 — Stats (`(tabs)/stats.tsx`)

**Weekly wrapped card:**
- bg `#19180F` (ink), borderRadius 22
- Glows: violet ellipse top-right (18%), rose ellipse bottom-right (13%)
- "54:21" mono: fontSize 48, letterSpacing -3, white
- KPI chips (4): bg white 8%, border white 6%, borderRadius 12 — streak, sessions, best session, avg/day

**Bar chart:**
- 7 bars (Mon–Sun), max height 88px
- Each bar: stacked colored segments (violet, ocean, ember, forest)
- Today: 2px brand outline + outline-offset 1px
- borderRadius 5 top, 3 bottom
- Empty bar fill: surf

**Insights:** 4 cards, 3px left accent bar in project colors.

---

## 8. Navigation

- Custom tab bar (not default RN tab bar)
- During active session: tab bar items → white text + white pill active state; bg → project dark; status bar bg → project dark
- When "Now" tab is active and session running: shows LiveTimerScreen instead of HomeScreen; cross-fade 400ms
- Onboarding (stack): welcome → setup
- Main (tabs): now | projects | stats
- Modal: celebration (presented modally over tabs)
- Sheet: addPastSession (bottom sheet)

---

## 9. Dynamic Island (Live Activities)

**iOS 16.1+. Requires Swift widget extension.**

### Setup
1. Add "ArcWidget" extension target in Xcode
2. Import ActivityKit
3. Define ActivityAttributes struct
4. Start/update/end activity from RN via native module

### Attributes
```swift
struct TimerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var elapsedSeconds: Int
    var projectName: String
    var projectColorHex: String
    var taskNote: String
    var isPaused: Bool
  }
  var projectId: String
}
```

### 3 States

**Compact (pill, 126×37):** 12px green dot + "Courtify" 11 SemiBold white | elapsed "01:23" 12 SpaceMono Bold white.
**Minimal (16×16):** Single colored dot = project color, 90% opacity, white ring stroke 1.5px.
**Expanded (up to 360×84):**
- Row 1: dot + "Courtify" 13 SemiBold | ⏸ button (32×32 circle)
- Row 2: "Working on deposit flow" 10 Regular white 42%
- Row 3: "01:23:07" 28 SpaceMono Bold white, letterSpacing -1.5
- Row 4: Progress bar (4px, white 12% bg, project color fill at daily goal %)

### React Native bridge
```ts
const { LiveActivityModule } = NativeModules;

export function useLiveActivity() {
  const start = (projectName: string, colorHex: string, note: string) =>
    LiveActivityModule?.startActivity({ projectName, colorHex, note });
  const update = (elapsedSeconds: number, isPaused: boolean) =>
    LiveActivityModule?.updateActivity({ elapsedSeconds, isPaused });
  const end = (elapsedSeconds: number) =>
    LiveActivityModule?.endActivity({ elapsedSeconds });
  return { start, update, end };
}
```

---

## 10. Animations Reference

```ts
// Breathe (timer, welcome emoji)
breathe.value = withRepeat(withSequence(
  withTiming(1.013, { duration: 1500 }),
  withTiming(1.0,   { duration: 1500 }),
), -1, true);

// Pop-in (button on welcome)
scale.value = withSpring(1, { damping: 12, stiffness: 200 });
opacity.value = withTiming(1, { duration: 400 });

// Screen color flood (home → live timer)
// animate bgColor with withTiming to project dark, 400ms

// Streak badge bounce
streakScale.value = withDelay(400, withSpring(1, { damping: 8, stiffness: 300 }));

// Milestone pulse (timer at 1h, 2h)
scale.value = withSequence(
  withTiming(1.09, { duration: 200 }),
  withTiming(0.96, { duration: 150 }),
  withTiming(1.0,  { duration: 200 }),
);

// Celebration slide-up
celY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
```

---

## 11. Haptics Map

```ts
import * as Haptics from 'expo-haptics';

// Start session:   Haptics.impactAsync(ImpactFeedbackStyle.Medium)
// Pause session:   Haptics.impactAsync(ImpactFeedbackStyle.Light)
// Stop session:    Haptics.notificationAsync(NotificationFeedbackType.Success)
// 1h milestone:    Haptics.notificationAsync(NotificationFeedbackType.Success)
// 2h milestone:    Haptics.notificationAsync(NotificationFeedbackType.Success)
// Create project:  Haptics.impactAsync(ImpactFeedbackStyle.Rigid)
// Tap project card:Haptics.selectionAsync()
```

---

## 12. Figma File Reference

```
File: https://www.figma.com/design/Xldm7IoRzDrVACoHyWd7NS

Frame IDs:
  01 – Welcome          → 66:2    (x:0)
  02 – Setup            → 66:13   (x:470)
  03 – Home (Idle)      → 66:33   (x:940)
  04 – Live Timer       → 66:116  (x:1410)
  05 – Stop Celebration → 66:156  (x:1880)
  06 – Projects         → 66:171  (x:2350)
  07 – Stats            → 66:259  (x:2820)
  DI – Compact          → 66:360  (y:920)
  DI – Expanded         → 66:366  (y:920)
  DI – Minimal          → 66:377  (y:920)
  DI – iPhone Context   → 66:382  (y:920)
```

---

## 13. Key Implementation Notes

1. **Space Mono for all numbers** — every timer, total, percentage, kpi uses `SpaceMono_700Bold`. Regular Latin text uses Plus Jakarta Sans.

2. **Color takeover on start** — when a session starts, the entire app UI (status bar, content, nav bar) transitions to the project's dark color. Reverse on stop. The #1 differentiating interaction.

3. **Timeline must render dynamically** — calculate block positions from real session data: `blockWidth = (session.durationMinutes / 540) * containerWidth`. Min block width: 4px.

4. **Sparkline data is weekly** — 7 values [Mon→Sun], each = number of sessions that day. Bars normalize to max value. 0-value days at 15% opacity.

5. **Celebration is automatic** — no tap. Auto-shows on `stopSession()`, auto-dismisses after 2s. Don't navigate manually.

6. **"needs love 🌱"** — show on projects with zero sessions in last 3 days.

7. **Streak badge bounces on mount** — spring animation, 400ms delay, only on home screen mount.

8. **Deep work = 90 min** — at 90 minutes continuous tracking, show "🔥 Deep work" badge, change sublabel, special haptic.

9. **Tab bar adapts to live state** — custom tab bar, not expo's default. During tracking: white text on project dark bg.

10. **Gradient text on welcome** — `MaskedView` + `LinearGradient`. Gradient activates at 1600ms, not initial load.
