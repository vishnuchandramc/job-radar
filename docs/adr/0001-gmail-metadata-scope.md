# ADR 0001: Gmail API scope selection

## Status

Superseded -- originally chose `gmail.metadata`, switched to `gmail.readonly` during Phase 1.

## Context

Job Radar needs Gmail API access to fetch email headers and classify them. Two scopes are available:

- `gmail.metadata` -- provides headers (From, Subject, Date) and the snippet (~100 chars of body preview). Classified as a non-sensitive scope with a faster OAuth verification path.
- `gmail.readonly` -- provides full message body access. Classified as a sensitive scope requiring a CASA Tier 2 security assessment (costly, takes weeks/months).

## Decision

Originally chose `gmail.metadata` for v1. However, `gmail.metadata` does not permit `messages.list` API calls, which are required for the sync engine. Switched to `gmail.readonly`.

Despite using `gmail.readonly`, the extension still only fetches `format=metadata` (headers + snippet). No email body content is read or stored.

## Consequences

- `gmail.readonly` scope requires CASA Tier 2 security assessment for Chrome Web Store public release.
- Classification still runs against subject + snippet only -- the broader scope is needed for API access, not for reading body content.
- Privacy posture is unchanged in practice: no email body is fetched or stored.
