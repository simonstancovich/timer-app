# Arc — Project Context for Claude Code

This file is the entry point for Claude Code working in this repo. The first section — **How I want you to work** — is the most important. It captures every durable preference and rule the user has established. Read it, follow it, don't drift from it.

The full design spec lives at [`docs/spec.md`](docs/spec.md) — read it for screen specs, animations, Dynamic Island layouts, and visual details.

---

## How I want you to work

These are non-negotiable. Every PR must respect them. If you find a rule that contradicts the spec or seems impractical, raise it with me before deviating — don't silently break the rule.

### Communication & process

- **Small steps. Always discuss before non-trivial work.** I'm getting used to working with an agent and want to stay in control. For exploratory questions, propose 2–3 options with tradeoffs and recommend one — let me redirect before you implement.
- **Keep responses tight.** Final responses are short. State results and decisions; don't narrate your internal deliberation. Tool calls aren't visible to me, so use brief text updates between them at key moments (finding something, changing direction, hitting a blocker). One sentence per update is usually enough.
- **End-of-turn summary: one or two sentences max.** What changed, what's next.
- **For risky / hard-to-reverse actions, confirm first.** Force-pushing to main, deleting branches, dropping data, sending external messages, modifying CI in ways that could break things. Local edits and reversible ops are fine to just do.

### Branching, commits, PRs

- **Always create a feature branch and open a PR. Never commit directly to `main`.** A GitHub ruleset enforces this anyway.
- **One commit per branch.** When iterating, use `git commit --amend --no-edit` + `git push --force-with-lease`. Stacked commits cause GitHub's squash-merge UI to auto-add `Co-Authored-By` trailers, which I don't want.
- **No `Co-Authored-By:` trailers in commit messages.** Not for Claude. Not for the user. None. The squash-merge UI may add them automatically; the user deletes them in the merge box.
- **Commit messages.** Subject line under ~70 chars; body explains the *why* if it's not obvious from the diff. No emojis. No trailers. No "🤖 Generated with Claude Code" footers.
- **PR body.** Include a **Summary** (what + why), a **Test plan** checklist, and any **Self-review notes** (deviations, scope drags, things to flag). Do NOT add Claude Code generation footers in PR bodies either unless I ask.
- **Branch names.** `feat/`, `fix/`, `chore/`, `docs/`, `ci/`, `refactor/` prefixes with short slugs. Examples: `feat/timeline-primitive`, `chore/app-icon`, `ci/testflight-pipeline`.

### The 9/10 quality bar (most important rule)

If the staged diff isn't a 9/10 right now, **you fix it before you commit** — never "I'll clean up later." Cursor Bugbot reviews every PR; anything Bugbot flags that you should have caught is a failure. You should be better than Bugbot.

**Before every `git commit`:**

1. Run `git diff --cached` and walk it like a strict reviewer
2. Run `npx tsc --noEmit` — must pass
3. Run `npm test` — must pass
4. Self-review checklist:
   - **Internal consistency** — does any signature, comment, or doc contradict another part of the same diff? (Past failure: PR body said "dates are ISO strings" but one signature still had `Date`.)
   - **Duplicated definitions** — same type / constant / helper defined twice? Pick one home.
   - **Dead exports** — anything exported but never imported? Remove it.
   - **Tailwind / utility collisions** — custom color keys must not clash with utility prefixes (`bg`, `text`, `border`, `ring`, etc.). Use semantic names like `canvas` instead of `bg`.
   - **Type narrowing** — can `unknown`/`any` be tightened? Can return types be annotated to catch drift?
   - **Null handling** — if a function can return `null`, callers must guard.
   - **Stub hygiene** — stubbed functions throw informatively, never silently return `undefined`.
   - **Spec drift** — cross-check against `docs/spec.md`. If the PR body claims something, every line must honor it.
   - **No speculative props/features** — every feature has a real caller.
   - **No comments unless truly necessary** (see below).
5. If anything's below 9/10, fix it. Re-amend if needed. Then commit.

### What 9/10 actually looks like — concrete heuristics

These are the patterns I keep flagging in review. Every PR is held against them.

1. **Dead code is unacceptable** — orphan styles, static style props that get overridden by animated styles every render, unused exports, backup files (`*.bak`, `*.old`), throwing stubs without a real caller. Delete before commit.
2. **Single source of truth** — one canonical list/table per concept; derive the rest. No parallel arrays describing the same set. Prefer token derivation (`colors[`${c}Dark`]`) over hand-maintained duplicate maps.
3. **Memoization must actually fire** — verify the chain: stable props all the way down to a `memo`'d child. Inline arrows in `renderItem` (`onPress={() => handlePick(item)}`) defeat memo. For list rows: pass `item` and a stable handler down; let the row do `useCallback(() => onPick(item), [onPick, item])` internally. If memo doesn't help (e.g. `label` changes per keystroke), **drop the memo** — false symmetry is worse than no memo.
4. **Encapsulate orchestration in custom hooks** — multi-side-effect handlers (≥3 setStates / shared-value writes / animations triggered together) belong in a `useXxxState()` hook. The screen body should read declaratively: `const { selected, pick } = useSetupColorState(...)`. Not 10 lines of imperative side-effect orchestration inline.
5. **Type narrowing at boundaries, never at call sites** — if a hook returns a poorly-typed thing, fix the hook's return type. `as StyleProp<TextStyle>` repeated at 3 call sites is wrong; one encapsulated cast inside the hook is right. No `as never`, no `as unknown as X`, no `as any` at call sites.
6. **`noUncheckedIndexedAccess`-safe code** — never `arr[0]` without a guard or `!`. Construct module-level constants directly; don't index into arrays for them. If indexing is necessary, use `.find(...) ?? fallback`.
7. **Pure functions get tests** — utilities (color math, generators, formatters) live in `src/utils/` with a `.test.ts` next to them. Hooks with native bindings (Reanimated worklets, AsyncStorage) — fair to skip with mocks at the boundary. UI animation timing — manual visual QA, not jest.
8. **File organization** — screen route files ≤ 300 lines; extract screen-local helpers to `src/features/<screen-name>/`. Single-responsibility modules with descriptive filenames. Each module readable top-to-bottom: imports → constants → exports → styles.
9. **Clean imports** — no `const X = ...` declarations interleaved with import statements. Import groups: external packages → internal absolute → relative — separated by blank lines. One blank line between the last import and the first declaration.
10. **Iterative review = honest critique, not rubber-stamps** — when reviewing a diff, find concrete, fixable misses and propose specific fixes. Apply them. Re-rate. The goal is 9/10 work, not "looks good to me."

### Code style

- **Default to ZERO comments.** Identifier names and types carry meaning. Don't narrate code. Don't add docstrings, header comments, section banners, or "// future X here" placeholders. The exception is genuinely non-obvious constraints (workarounds for external bugs, subtle invariants the code can't express), and even then keep it one short line. License headers / auto-generated markers are fine.
- **Arrow-const components, never `function`.** Every component — public, internal sub-component, default-exported route — is declared as `const Foo = (props) => { ... }`. Never `function Foo() {}` or `export default function Foo() {}`. Applies to components only; non-component helpers can stay as `function` declarations.
- **Strict TypeScript.** Avoid `any`. Prefer `satisfies` over `as`. Annotate return types when it catches drift.
- **No emojis in code, commits, or PRs** unless I ask. UI strings can have emojis where the design calls for them.

### Component primitives — the typed-token-prop rule

This is how every primitive is designed. New primitives must mirror this shape.

```tsx
import { colors, type ColorToken } from '../../tokens/colors';

type FooProps = Omit<ViewProps, 'children'> & {  // extend native props for testID, accessibility, etc.
  variant?: FooVariant;        // string-literal union, derived from a tokens map
  color?: ColorToken;           // strict token; no escape hatch
  children: ReactNode;
};

const variantToStyle = {
  // ...
} satisfies Record<FooVariant, ViewStyle>;       // catches missing entries on add

export function Foo({ variant = 'body', color = 'ink', style, ...rest }: FooProps) {
  return <Native {...rest} style={[variantToStyle[variant], { color: colors[color] }, style]} />;
}
```

Rules this enforces:
- **Token names at call sites, never imports.** Callers write `color="sub"`, not `color={colors.sub}`. The component does the lookup.
- **Tokens are flat.** No nested palette objects. `violet`, `violetLight`, `violetDark` — never `colors.violet.c`. If a value is needed and isn't a token, **add it to `src/tokens/colors.ts` with a clear semantic name** before reaching for raw strings.
- **No escape-hatch unions.** Props take `ColorToken` strictly, not `ColorToken | (string & {})`. If tokens don't cover something, expand the tokens.
- **Sensible defaults.** Common usage should require zero props.
- **Mirror the API across related primitives.** `<MonoText>` → `size + color`; `<UIText>` → `variant + color`; `<Pill>` → `bg`. Learn one, you've learned the rest.
- **Extend native props.** `Omit<ViewProps, 'children'>` etc. so callers can pass `testID`, accessibility props, style overrides, refs.
- **`style` stays available** for one-off overrides that don't belong in the design system.
- **No speculative props.** Don't add `onPress` to Card "in case we need it" — wait for a real caller.
- **Don't gold-plate placeholder/sandbox code.** Things in `app/(tabs)/index.tsx` will be deleted in Phase 3.
- **Don't prematurely extract shared helpers.** Three similar copies is fine; refactor when the third real use case appears.

### Testing

- **Every new primitive ships with a `.test.tsx`.** Cover: rendering, default props, each variant/size, color resolution, style override merging.
- **`npm test` must be green before commit.**
- The `flattenStyle` test helper is duplicated across primitive test files. Once it's in 5+ files, extract to `src/test-utils/`. (Currently overdue — fold into the next primitive PR if convenient.)

### Visual verification (UI changes)

Before pushing any PR that changes UI:

1. Make sure Metro is running and the sim has the latest bundle (terminate + relaunch the app via `xcrun simctl terminate booted <bundle-id>` + `xcrun simctl launch booted <bundle-id>` if hot reload is stale).
2. `xcrun simctl io booted screenshot /tmp/sim.png`
3. Read the PNG with the Read tool to inspect.
4. If the change isn't visible in the default scroll position, temporarily reorder the sandbox to surface it, or scroll programmatically.
5. Don't claim "looks right" without actually capturing and reading the screenshot.

### When tokens don't cover a need

If you're tempted to write `color={colors.violet.c}` or `bg="#5244E8"` at a call site, **stop**. Either:
- The value is already a flat token — use the token name (`color="violet"`).
- It's not a token yet — add it to `src/tokens/colors.ts` with a clear semantic name in the same PR.

Never plumb raw colors through component props. Never reach into nested palette objects.

### Memory & continuity

I have persistent memory under `~/.claude/projects/.../memory/`. The MEMORY.md index lists durable preferences. If you learn something new about how I work, save it as memory AND update this file. New sessions in this repo should reach the same standard automatically.

---

## What Arc is

iOS-first React Native + Expo app for time tracking. Single-user, local-first, no backend. Sessions are tied to colored projects; the live timer is the marquee experience (full-screen color takeover, breathing animation, milestone haptics, Dynamic Island).

- **Repo:** https://github.com/simonstancovich/timer-app
- **Bundle ID:** `com.simonstancovich.arc`
- **App Store name:** `Arc Timer` (`Arc` was taken)
- **Figma:** https://www.figma.com/design/Xldm7IoRzDrVACoHyWd7NS

---

## Tech stack

- **Expo SDK 54** with `expo-router` (file-based nav)
- **TypeScript strict**
- **NativeWind v4** (Tailwind for RN — installed; primitives currently use tokens + StyleSheet objects)
- **Zustand** + `persist` middleware backed by **AsyncStorage** for state persistence (versioned, with `migrate` hook)
- **Reanimated 4** + **react-native-worklets** for animations
- **react-native-svg** for sparklines / charts
- **expo-haptics**, **expo-notifications**, **expo-linear-gradient**, **@react-native-masked-view/masked-view**
- **expo-google-fonts**: Plus Jakarta Sans (UI text) + Space Mono (timers, numbers)
- Local prebuild + Xcode (no Expo Go) — `ios/` is committed because the Dynamic Island widget will live in Swift

Test stack: **jest@29 + jest-expo@54 + @testing-library/react-native**. Pinned to v29 — v30 hits a module-resolution bug in expo's runtime during test setup.

---

## Repo layout

```
src/
├── components/primitives/     # MonoText, UIText, Pill, Card, ProgressBar, Sparkline, GradientText (each with .test.tsx)
├── tokens/                    # colors, typography, spacing, shadows
├── types/                     # Project, Session, AppState
└── store/                     # zustand store (persist + version + migrate)

app/
├── _layout.tsx                # Root: font loading, splash lifecycle
└── (tabs)/index.tsx           # Currently a temporary primitives sandbox; will become Home in Phase 3

ios/                           # Native Xcode project (committed, will host Dynamic Island widget extension)
.github/workflows/             # ios-testflight.yml — push to main → EAS build + auto-submit
eas.json                       # EAS profiles: development / preview / production
docs/spec.md                   # Full design + interaction spec (single source of truth for screens, animations, DI)
```

---

## Build phases

| Phase | Status | Notes |
|---|---|---|
| 0. Setup (toolchain, scaffolds, deps, prebuild, tokens, types, store stub) | ✅ Done |  |
| 1. Core primitives (`MonoText`, `UIText`, `Pill`, `Card`, `ProgressBar`, `Sparkline`, `GradientText`, `Timeline`) | ⏳ In progress | All but `<Timeline>` shipped. `<Timeline>` is next. |
| 2. Onboarding (welcome + setup screens) | ⏳ Pending |  |
| 3. Home idle (replaces sandbox) | ⏳ Pending |  |
| 4. Live timer (full-screen color takeover, marquee feature) | ⏳ Pending |  |
| 5. Celebration + Projects + Stats | ⏳ Pending |  |
| 6. Dynamic Island (Swift widget extension, ActivityKit, RN bridge) | ⏳ Pending | Requires real iPhone iOS 16.1+. |
| 7. Polish (notifications, accessibility, app icon, splash, TestFlight) | ⏳ Partly done | TestFlight pipeline live; icon shipped; basic centered splash shipped. |

---

## Next up: `<Timeline>` primitive

Spec §6 — horizontal session timeline for today, sessions as colored blocks from 9am → current time (540min window). Track 2px tall in `surf`; session blocks 24px tall, borderRadius 5, top stripe 3px in a darkened color. Live session shows a pulsing 10px forest-green dot. See `docs/spec.md` for the full prop signature.

---

## Local development

```bash
cd ~/apps/timer-app

# First-time setup (after fresh clone / pod changes)
cd ios && pod install && cd ..

# Boot sim (Metro starts automatically)
npm run ios

# Or just Metro if app already installed
npx expo start

# Tests
npm test

# Type check
npx tsc --noEmit
```

The default tab (`app/(tabs)/index.tsx`) is a primitives sandbox showing every component for visual QA. It will be replaced by the real Home in Phase 3.

---

## CI / TestFlight

`.github/workflows/ios-testflight.yml` triggers on push to `main` (or manual `workflow_dispatch`). It runs `eas build --platform ios --profile production --auto-submit --non-interactive` — EAS builds in the cloud and submits to TestFlight. ASC App ID is in `eas.json`. Apple credentials are EAS-managed (cert + provisioning profile stored server-side, valid through Apr 2027). ASC API key is stored in EAS server-side too.

GH secrets in use: `EXPO_TOKEN`.

After merge to `main`: ~20 min build + ~5 min Apple processing → appears in TestFlight.

---

## Token reference (quick)

Colors — flat keys in `src/tokens/colors.ts`:
- Surface: `bg`, `white`, `surf`, `brd`
- Text: `ink`, `sub`, `muted`
- Brand: `brand`, `brandLight`, `brandDark`
- 7 project palettes: `violet`, `violetLight`, `violetDark`, `ocean`, `oceanLight`, `oceanDark`, `ember`, `emberLight`, `emberDark`, `forest`, `forestLight`, `forestDark`, `rose`, `roseLight`, `roseDark`, `amber`, `amberLight`, `amberDark`, `teal`, `tealLight`, `tealDark`
- Streak: `streakBg`, `streakText`
- Gradients (separate export): `celebration`

Typography — `src/tokens/typography.ts`:
- UI (Plus Jakarta Sans): `display` (24/ExtraBold), `bodyLg` (16/Bold), `body` (14/SemiBold), `bodySm` (13/Medium), `caption` (12/Regular), `micro` (10/Bold/uppercase)
- Numbers (Space Mono Bold): `timerXl` (82), `timerLg` (48), `timerMd` (28), `timerSm` (12), `numXl` (40), `numLg` (26), `numMd` (14)

Spacing — `src/tokens/spacing.ts`: `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 20, `xxl` 24, plus layout: `screenPadH` 22, `cardRadius` 20, `pillRadius` 99, `navHeight` 72, `statusBar` 44.

---

## Known follow-ups

- `<Timeline>` primitive (Phase 1 final piece)
- Replace temporary sandbox in `app/(tabs)/index.tsx` with onboarding + real Home
- Full-bleed designed splash screen ("Arc / Your day. Your arc.") — current splash is centered icon only because Expo's plugin doesn't support full-bleed; would need manual `LaunchScreen.storyboard` edit
- Dark mode visuals across screens
- App Store Connect submission compliance: in-app encryption answer is "None of the above" → set permanently via `app.json` `ios.config.usesNonExemptEncryption: false`
- Set up Push Notifications in EAS once milestone notifications are wired
- Extract `flattenStyle` test helper into `src/test-utils/` once it's used in 5+ test files (currently 7 — overdue)
