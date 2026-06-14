# Job Radar -- Implementation Phases

## Phase 1: Foundation (Dogfood MVP)

Goal: A working Chrome extension you use daily to track your own job search.

### 1.1 Project scaffold
- Chrome Extension with Manifest V3 (React + Vite + TypeScript)
- Manifest with permissions: `identity`, `storage`, `alarms`
- Gmail API OAuth client setup (GCP project, OAuth consent screen)

### 1.2 OAuth flow
- "Connect Gmail" onboarding screen (one-liner + permission note + connect button)
- `chrome.identity` OAuth with `gmail.metadata` scope
- Token storage and silent refresh
- Connection state machine: Connected / Disconnected / Offline
- "Reconnect Gmail" UI for disconnected state

### 1.3 Sync engine
- First-sync backfill: 30-day history via `messages.list` with `after:` date query, filtered by ATS sender domains
- Incremental sync via `history.list` using stored `historyId`
- Fallback to date-based query when `historyId` expires
- `chrome.alarms` at 15-minute default interval
- "Re-sync now" manual trigger
- Store sync state (`lastSyncTimestamp`, `historyId`) in `chrome.storage.local`

### 1.4 Classification engine
- Hardcoded ATS domain list (Greenhouse, Lever, Workday, SmartRecruiters, Ashby, iCIMS, BambooHR, LinkedIn, JazzHR, Jobvite, Breezy, Recruiterbox, Rippling, ApplicantPro)
- Keyword matching against subject + snippet (concatenated)
- Priority-ordered classification: Offer > Interview Request > Rejection > Application Confirmation > Other
- Store classified emails in `chrome.storage.local`

### 1.5 Badge
- Badge count = unseen interview_request + offer emails within 7-day window
- `chrome.action.setBadgeText` / `setBadgeBackgroundColor`
- Show `!` when disconnected
- Clear badge on "Mark all as seen"

### 1.6 Popup UI
- Header: "N job emails - last 7 days" + sync button + settings gear
- 4 category cards (accordion) with counts (all emails in 7-day window)
- Email rows inside expanded cards: sender, label, relative timestamp
- Click email row -> open in Gmail (`mail.google.com/?authuser={email}#inbox/{threadId}`), mark as seen
- "Mark all as seen" button
- Dismiss button ("x") on each email row -> adds to exclusion list
- "Recent history" section below cards for 7-30 day old emails
- Empty state: "No job emails found in the last 7 days"
- Loading state: "Scanning your inbox..." (first sync)
- Sync error state: "Couldn't reach Gmail. Will retry at next sync."

### 1.7 Settings panel
- Sync frequency (min 5 min, max 60 min, default 15 min)
- Custom sender domains (add/remove)
- Toggle categories on/off
- Disconnect/reconnect Gmail
- Manual re-sync

### 1.8 Storage management
- 30-day rolling retention: purge emails older than 30 days on each sync
- Auto-mark as seen when email transitions from active (7-day) to history
- Exclusion list for dismissed emails

---

## Phase 2: Public Launch (v1.1)

Goal: Ship to Chrome Web Store with Pro tier, payment, and AI classification.

### 2.1 Pro tier + payment
- Product website with subscription/purchase page
- Merchant of Record integration (ExtensionPay / Dodo Payments / Paddle)
- One-time $5.99 unlock
- License state check in extension
- Pro gate: unlimited history, custom domains, CSV export, weekly digest
- Upsell flow in onboarding (free vs Pro benefits page)
- Locked feature UI -> navigates to product website

### 2.2 AI classification fallback
- Chrome Built-in AI (Gemini Nano) integration via Prompt API
- Used only for "Other/Uncertain" emails that match ATS domain but no keyword
- Graceful degradation: falls back to "Other" when API unavailable
- Marketing: "AI-powered classification"

### 2.3 Growth mechanic
- Offer detection (0 -> 1 transition): one-time congratulations banner
- Share/referral CTA tied to the offer moment
- Does not repeat on subsequent offers in the same session

### 2.4 Weekly email digest (Pro)
- Summary of the week's job email activity
- Sent via the product website backend

### 2.5 Chrome Web Store submission
- OAuth verification (plan for timeline)
- Store listing, screenshots, description
- Privacy policy (metadata scope, no email content stored)

---

## Phase 3: Growth (v1.2+)

Goal: Expand capabilities based on real user feedback.

### 3.1 LLM-based classification
- Fallback for emails from non-ATS domains (recruiter outreach from personal emails)
- Broader coverage beyond rule-based patterns

### 3.2 Multi-account support
- Multiple Gmail accounts connected simultaneously
- Account switcher in popup

### 3.3 CSV export (Pro)
- Export classified email history as CSV

### 3.4 Daily digest notification
- Desktop notification option (in addition to weekly email digest)
