# Job Radar -- Design Guidelines

## Component Libraries

### Coss UI (primary)
- Source: https://coss.com/ui/docs
- Usage: Core functional UI -- popup, settings, category cards, email rows, onboarding
- Integration: React components + Tailwind CSS. All interactivity handled via React state.
- Why: Extremely modern, clean design. Lightweight and fast for a utility popup opened multiple times daily.

### Magic UI (accent / marketing)
- Source: https://magicui.design/docs/components
- Usage: Marketing moments, delight interactions, product website
- Where to use:
  - Offer celebration banner (confetti, animated border)
  - Onboarding screen (subtle accent)
  - Product website / upsell page (v1.1)
- Where NOT to use: Core popup workflow (category cards, email rows, settings)

### Hybrid usage
Both libraries are Tailwind-based and can coexist. Coss UI provides the structural foundation; Magic UI provides selective polish at key moments.

## Loading States

- Use Magic UI's **Ripple** component for all loading states (first sync, re-sync, background refresh indicator)
- No generic spinners or progress bars

## General Principles

- Popup should feel fast and scannable -- no heavy animations in the daily workflow
- Reserve animation/delight for emotionally significant moments (offer detected, first sync complete)
- Dark mode: follow system preference via Tailwind's `dark:` variant
- Keep the popup compact -- all 4 category cards visible without scrolling when collapsed
