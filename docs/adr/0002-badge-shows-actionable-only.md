# ADR 0002: Badge count reflects only actionable categories

## Status

Accepted

## Context

The badge on the Chrome extension icon needs to convey "do I need to act?" at a glance. Job Radar classifies emails into five categories: offer, interview_request, rejection, application_confirmation, and other.

Including all categories in the badge count inflates it with items that don't require a response (rejections, confirmations), training users to ignore the badge entirely.

## Decision

Badge count includes only unseen `interview_request` and `offer` emails. All other categories are visible in the popup but do not affect the badge.

## Consequences

- A badge of `2` means "you have 2 things that need a response" -- immediately actionable.
- New rejections and application confirmations are silently available in the popup without creating urgency.
- Users who want to see all activity must open the popup, which is the intended interaction model.
