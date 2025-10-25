Short, action-oriented guidance for AI coding agents working on this repository.

Repository snapshot
- Expo + React Native app (web + mobile) using Expo Router and NativeWind (Tailwind CSS).
- Code is inside the `app/` directory (file-based routing). Starter example lives in `app-example/`.

What to do first
- Run `npm install` then `npm start` (or `npx expo start`) to launch Metro/Expo locally. See `package.json` scripts.
- For web, run `npm run web` or `npx expo start --web`.

Architecture and important files
- Routing & UI: `app/` — file-based routes (e.g. `app/(auth)/index.tsx` for auth, `app/(app)/` for main app screens).
- Components: `components/` includes `ui/` primitives (Button, TextInput, Card) and feature folders (attendance, feedback, reports).
- State & services: `context/` and `hooks/` contain Auth and Offline contexts (`context/AuthContext.tsx`, `hooks/useAuth.ts`).
- API & persistence: `services/` holds `api.ts`, `auth.ts`, `storage.ts`, `sync.ts` — use these for network/storage interactions.
- Styling: NativeWind + Tailwind (see `tailwind.config.js` and `global.css`). Metro configured in `metro.config.js`.
- Config: `app.json` contains Expo build targets, dev users in `expo.extra.auth.users` for local demo authentication.

Project-specific conventions
- Keep route files under `app/` and use default exports for pages. Example: `app/(auth)/index.tsx` returns the login view.
- UI primitives live at `components/ui/*.tsx` — prefer reusing Button/TextInput instead of raw RN primitives for consistent styling and props.
- Use `useAuth()` from `hooks/useAuth.ts` for authentication flows; demo credentials are in `app.json` under `expo.extra.auth.users`.
- Web-specific layout patterns: code often branches on `Platform.OS !== 'web'` to show simplified mobile vs polished web UI (see `app/(auth)/index.tsx`).

Build / debug / Docker
- Local dev: `npm start` -> opens Expo dev tools. Use `npm run android` / `npm run ios` / `npm run web` for platform targets.
- Docker: `Dockerfile` builds an image that runs `npx expo start --tunnel`. `compose.yaml` defines `expo-dev` for containerized dev with ports 8081/19000-19002.

Testing & linting
- Lint: `npm run lint` (alias for `expo lint`). There are no automated tests in the repo by default — add unit tests under a `__tests__` folder if needed.

Integration points & data flows
- Auth: `services/auth.ts` and `context/AuthContext.tsx` manage session state and expose `useAuth()` hook used across pages (e.g. `app/(auth)/index.tsx`).
- Storage: `services/storage.ts` wraps AsyncStorage usage — prefer this for saving session or cached data.
- Sync: background sync logic lives in `services/sync.ts` and `context/OfflineContext.tsx` for network-aware behavior.

Safe edits & common PRs
- Small UI changes: modify `components/ui/*` and update usages in `app/` routes. Preserve props and className/tailwind usage.
- Add screens: create a new file under `app/` (follow folder grouping and named route conventions). Export default a React component.
- Do not change Expo SDK version unless you update `package.json` and verify Metro/EAS compatibility.

Examples to reference
- Auth page: `app/(auth)/index.tsx` — platform branching, demo creds, use of `useAuth()` and `TextInput`/`Button` primitives.
- Metro + nativewind: `metro.config.js` and `tailwind.config.js` show how nativewind is wired and where `global.css` is used.

When unsure
- Look at `app-example/` for canonical starter patterns (layout, tabs, components).
- If runtime issues appear, run Expo locally (`npx expo start`) and reproduce on web to inspect console errors.

If you modify project structure
- Update `README.md` and `app.json` where appropriate (e.g., new deep links, scheme, or plugin changes).

Ask the developer for
- Any CI or secret-backed environment setup (none discovered in repo).
- Preferred testing framework and target coverage for future tests.

End of instructions.
