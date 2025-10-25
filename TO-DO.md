# TO-DO — Gaps and Next Steps vs Proposal_Group10_Despro.pdf

This doc lists what’s still missing or needs refinement based on the current code and the proposal. Items are grouped by feature area, with priorities and clear acceptance criteria.

Legend: P0 = critical, P1 = important, P2 = nice-to-have

## P0 — Critical features

### 1) NFC-based attendance (Presensi via NFC)
- Status: Not started
- Notes:
  - Proposal calls for NFC as an alternative to QR, especially for younger students.
  - Expo Go cannot use native NFC modules; requires Expo Dev Client/EAS Build and a library like `react-native-nfc-manager`.
  - Android support is broad; iOS requires devices with NFC and entitlements.
- Tasks:
  - [ ] Decide build path: Expo Dev Client (recommended) or bare workflow.
  - [ ] Add NFC lib (e.g., `react-native-nfc-manager`), configure iOS entitlements and Android manifest.
  - [ ] Implement NFC read flow (background tag detection, screen guidance, success/fail handling).
  - [ ] Map NFC payload to student ID (secure token format) and call submitOrQueue to record attendance.
  - [ ] Add UI fallback messaging when device lacks NFC.
- Acceptance:
  - [ ] On supported devices, tapping a registered tag records attendance (online) or queues (offline) with a visible success state.
  - [ ] Proper permission/entitlement setup; gracefully degrades on unsupported devices.

### 2) Dynamic QR codes (secure + anti-replay)
- Status: Not started / needs flow definition
- Notes:
  - Proposal mentions dynamic QR. Options:
    - Server-issued, time-bound signed token (JWT/JWS) embedded in QR.
    - Rotation window (e.g., 30–60s) to prevent reuse.
  - Scanner must validate signature, freshness, and binding to student/school.
- Tasks:
  - [ ] Define QR payload schema: {sub, schoolId, issuedAt, exp, nonce, signature}.
  - [ ] Implement token verification client-side (signature + exp + nonce cache) and server-side fallback.
  - [ ] Update `attendance-scan.tsx` and `QRScanner.tsx` to parse/validate payload, show outcomes, then submitOrQueue.
  - [ ] Add anti-replay cache (short-lived) in memory/AsyncStorage.
- Acceptance:
  - [ ] Valid QR within time window is accepted; expired/forged/replayed QR is rejected with clear messages.

### 3) Real-time notifications (Emergency alerts)
- Status: Not started
- Notes:
  - Use `expo-notifications` for push; backend must send notifications to Dinkes/Super Admin on new emergency.
- Tasks:
  - [ ] Add and configure `expo-notifications`; request permissions, get Expo push token, persist to backend.
  - [ ] Define server endpoint for notification dispatch on emergency creation/update.
  - [ ] Implement notification categories (e.g., "Emergency", actionable intents to open detail screen).
- Acceptance:
  - [ ] Admin Dinkes devices receive a push within seconds of new emergency, tapping it opens detail page.

### 4) Backend integration (replace placeholders)
- Status: Not started / placeholder URLs
- Notes:
  - `services/api.ts` points to example.com; most submit handlers log to console.
- Tasks:
  - [ ] Add environment config (baseURL) via `app.json -> expo.extra` and `expo-constants`.
  - [ ] Implement real endpoints for: attendance, menu QC, feedback, emergencies, analytics.
  - [ ] Wire all producers to call API or `submitOrQueue` with proper payloads.
  - [ ] Add loading/error states and optimistic UI where applicable.
- Acceptance:
  - [ ] Data persists to real backend; error paths are handled with user-visible feedback; offline queues sync successfully when online.

## P1 — Important enhancements

### 5) Adopt submitOrQueue across all producers
- Status: Pending
- Tasks:
  - [ ] Feedback submission (`portal-feedback.tsx`) sends via `submitOrQueue`.
  - [ ] Attendance (scan/assisted) uses `submitOrQueue` with robust payload (student, time, method=QR/NFC).
  - [ ] Catering QC form posts via `submitOrQueue` including photos (FormData supported).
  - [ ] Dinkes emergency status changes use `submitOrQueue`.
- Acceptance:
  - [ ] Offline actions queue reliably; automatic sync on reconnect works; UI informs user of queued/sent status.

### 6) Analytics and reporting (replace placeholders)
- Status: Placeholder UI
- Notes:
  - Replace dummy visuals in `analytics.tsx` with real data: per-school attendance recap, trends, QC logs, incident history.
- Tasks:
  - [ ] Define analytics API endpoints and query params (date ranges, school filter).
  - [ ] Implement charts/tables (e.g., `victory-native` or `react-native-svg-charts`).
  - [ ] Add empty/loading/error states, CSV export (web) if feasible.
- Acceptance:
  - [ ] Dashboards show real metrics with filter controls; visuals match the proposal’s intent.

### 7) Offline sync robustness
- Status: Basic
- Tasks:
  - [ ] Retry/backoff strategy (exponential with cap); store try count and lastError.
  - [ ] Conflict resolution policy (client-wins/server-wins or merge where possible).
  - [ ] Outbox UI: small screen/section to view queued items with retry/cancel.
  - [ ] Background sync triggers (app focus, network change already wired; add periodic timer while online).
- Acceptance:
  - [ ] Queued data reliably syncs under intermittent connectivity; users can manage outbox; conflicts are surfaced and resolved.

### 8) Web parity & camera/NFC fallbacks
- Status: Partial
- Tasks:
  - [ ] Ensure QR scanning works on web (camera permissions, device selection); fallback to manual code entry.
  - [ ] NFC is mobile-only; ensure UI hides NFC prompts on web or unsupported devices.
- Acceptance:
  - [ ] Web build gracefully supports scan or manual fallback; no unsupported UI shown.

### 9) Security, auth, and roles
- Status: Partially present
- Tasks:
  - [ ] Move demo users from `app.json` to environment-appropriate setup; implement real login/token storage.
  - [ ] Store tokens securely (consider `expo-secure-store`).
  - [ ] Enforce role checks server-side; verify route guards match backend permissions.
- Acceptance:
  - [ ] Auth flows with real tokens; protected endpoints enforce role; client and server are aligned.

## P2 — Developer experience & quality

### 10) Automated testing
- Status: Not started
- Tasks:
  - [ ] Add Jest + React Native Testing Library; configure for Expo SDK 54.
  - [ ] Write smoke tests (AuthContext, OfflineContext, submitOrQueue).
  - [ ] Unit test QRScanner parsing and sync retry logic.
- Acceptance:
  - [ ] CI test suite passes; basic regressions are caught locally and in PRs.

### 11) Dev environment & release
- Status: Ongoing
- Tasks:
  - [ ] Standardize Node 20 LTS for dev (avoid Node 22 dev-server issues noted previously).
  - [ ] EAS Build profiles (development, preview, production) for NFC-capable builds.
  - [ ] Docker dev container docs: clarify ports, tunnel, and platform targets.
- Acceptance:
  - [ ] Developers can run/start/web reliably; NFC builds produced via EAS as needed.

### 12) Cleanup leftovers and docs
- Status: In progress
- Tasks:
  - [ ] Remove MOCK fallbacks (e.g., in `services/emergency.ts`) once backend endpoints exist.
  - [ ] README updates: environment variables, baseURL, permissions (camera, notifications, NFC), offline mode.
  - [ ] Document offline queue item schema and sync contract.
- Acceptance:
  - [ ] No stale mocks in main code paths; README reflects real setup.

## Quick wins (small tasks)
- [ ] Ensure `attendance-scan.tsx` fully implements `onBarCodeScanned` flow: parse, validate, haptic feedback, throttle, and `submitOrQueue`.
- [ ] Add image compression/resizing before upload in feedback and QC forms to save bandwidth.
- [ ] Verify all deleted placeholder routes are removed from the generated router types after restarting Expo.
- [ ] Add snackbars/toasts for success/failure using a consistent UI primitive.

## Dependencies to consider
- NFC: `react-native-nfc-manager` (requires Dev Client/EAS)
- Notifications: `expo-notifications`
- Charts: `victory-native` and `react-native-svg`
- Secure storage: `expo-secure-store`

---

If you want, I can start by wiring `submitOrQueue` into feedback and attendance, then move on to QR validation and a basic push notification setup.
