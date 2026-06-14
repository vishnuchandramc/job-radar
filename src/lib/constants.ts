import type { EmailCategory, Settings } from '../types'

export const ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'myworkday.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'icims.com',
  'bamboohr.com',
  'linkedin.com',
  'jazzhr.com',
  'jobvite.com',
  'breezy.hr',
  'recruiterbox.com',
  'rippling.com',
  'applicantpro.com',
  'workable.com',
  'recruitee.com',
  'dover.com',
  'gem.com',
  'hired.com',
  'angel.co',
  'wellfound.com',
] as const

export const KEYWORD_RULES: Record<Exclude<EmailCategory, 'other'>, string[]> = {
  offer: [
    'offer',
    'pleased to offer',
    'congratulations',
    'offer letter',
    'compensation package',
    'start date',
  ],
  interview_request: [
    'interview',
    'schedule a call',
    'next steps',
    'meet the team',
    'available for a call',
    'phone screen',
    'technical assessment',
    'coding challenge',
    'onsite',
    'virtual onsite',
  ],
  rejection: [
    'unfortunately',
    'not moving forward',
    'other candidates',
    'decided not to proceed',
    'not selected',
    'will not be moving',
    'pursue other candidates',
    'position has been filled',
  ],
  application_confirmation: [
    'received your application',
    'thank you for applying',
    'application submitted',
    "we've received",
    'application has been received',
    'successfully submitted',
    'thank you for your interest',
  ],
}

// Classification priority order (highest first)
export const CATEGORY_PRIORITY: EmailCategory[] = [
  'offer',
  'interview_request',
  'rejection',
  'application_confirmation',
  'other',
]

export const DEFAULT_SETTINGS: Settings = {
  syncIntervalMinutes: 15,
  enabledCategories: ['interview_request', 'offer', 'rejection', 'application_confirmation'],
  customDomains: [],
}

export const ACTIVE_WINDOW_DAYS = 7
export const STORAGE_RETENTION_DAYS = 30
export const BACKFILL_DAYS = 7
export const ALARM_NAME = 'job-radar-sync'

// Categories that count toward the badge
export const BADGE_CATEGORIES: EmailCategory[] = ['interview_request', 'offer']
