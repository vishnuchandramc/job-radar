# ADR 0001: Use gmail.metadata scope over gmail.readonly

## Status

Accepted

## Context

Job Radar needs Gmail API access to fetch email headers and classify them. Two scopes are available:

- `gmail.metadata` -- provides headers (From, Subject, Date) and the snippet (~100 chars of body preview). Classified as a non-sensitive scope with a faster OAuth verification path.
- `gmail.readonly` -- provides full message body access. Classified as a sensitive scope requiring a CASA Tier 2 security assessment (costly, takes weeks/months).

## Decision

Use `gmail.metadata` for v1.

## Consequences

- Classification runs against subject + snippet only. No full-body keyword matching.
- Snippet (~100 chars) captures most classification signals ("unfortunately we have decided...", "we'd like to schedule..."). Subject alone would miss many signals since ATS emails often use generic subjects.
- Avoids the sensitive scope security assessment, unblocking Chrome Web Store submission.
- If classification accuracy proves insufficient in dogfooding, upgrading to `gmail.readonly` is possible but requires the security assessment before public release.
