# Job Radar -- Domain Glossary

## Core Entities

**Job Email** -- A single Gmail message (not thread) that has been classified as job-search-related via keyword matching on subject and snippet. Tracked by Gmail message ID. The unit of classification, display, and "seen" tracking. Can come from any sender — not limited to known ATS domains.

**Category** -- The classification label assigned to a Job Email. One of: `interview_request`, `offer`, `rejection`, `application_confirmation`, `other`. Applied by the Classification Engine using priority order: Offer > Interview Request > Rejection > Application Confirmation > Other.

**Custom Domain** -- A sender domain added by the user in settings (e.g., a specific recruiter's company domain). Included as an additional `from:` filter in Gmail queries alongside keyword-based search, broadening coverage.

## Lifecycle States

**Active Email** -- A Job Email within the rolling 7-day display window. Shown in category cards in the popup.

**History Email** -- A Job Email older than 7 days but within the 30-day storage window. Shown in the "Recent history" section. Auto-marked as seen when it transitions from active to history.

**Seen** -- A Job Email the user has opened in Gmail (via deep link) or explicitly marked via "Mark all as seen." Seen emails do not count toward the badge. Emails auto-transition to seen when they age out of the active window.

**Dismissed** -- A Job Email the user has manually marked as "not a job email." Excluded from counts, feed, and future syncs (message ID stored in an exclusion list).

## Sync

**Sync Cycle** -- A periodic background fetch of new Gmail messages via the Gmail API. Uses `historyId` for incremental sync; falls back to date-based query (`after:`) when `historyId` is unavailable or expired.

**Backfill** -- The one-time initial sync that pulls 30 days of history on first connection. Emails older than 7 days enter as history emails (already seen).

**Display Window** -- The rolling 7-day period of emails shown as active in the popup. Category card counts reflect all emails (seen and unseen) within this window.

## Connection States

**Connected** -- Gmail OAuth token is valid. Background syncs run normally.

**Disconnected** -- OAuth token is revoked or refresh has failed. Badge shows `!`. No syncs attempted. Popup shows "Reconnect Gmail."

**Offline** -- Network unavailable. Stale data displayed with "Last synced" timestamp. Syncs resume automatically when connectivity returns.

## UI Concepts

**Badge** -- The count shown on the Chrome extension icon. Reflects unseen interview requests + offers only. Does not include application confirmations, rejections, or other.

**Category Card** -- A collapsible accordion element in the popup, one per category. Shows the category count (all emails in the 7-day window, regardless of seen status). Expands to show individual email rows.

**Email Row** -- A single Job Email displayed within an expanded category card. Shows sender, short label, relative timestamp. Clicking opens the email in Gmail (via thread deep link with `authuser` param) and marks it as seen.

**Recent History** -- A section below the category cards showing history emails (7-30 days old). All entries are already marked as seen.
