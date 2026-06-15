import type { EmailCategory } from '../types'
import { classifyEmail as keywordClassify } from './classifier'
import { dbg, dbgError } from './debug'

const AI_CONFIDENCE_HIGH = 0.7
const AI_CONFIDENCE_LOW = 0.4

const OFFSCREEN_URL = 'src/offscreen/offscreen.html'

let offscreenCreated = false

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenCreated) return

  // Check if already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_URL)],
  })

  if (existingContexts.length > 0) {
    offscreenCreated = true
    return
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'AI model inference for email classification',
  })

  offscreenCreated = true
}

export async function loadAIModel(): Promise<boolean> {
  try {
    await ensureOffscreenDocument()
    const response = await chrome.runtime.sendMessage({ type: 'LOAD_MODEL' })
    dbg('ai-classifier.loadAIModel', { success: response?.success })
    return response?.success ?? false
  } catch (error) {
    dbgError('ai-classifier.loadAIModel — failed', error)
    return false
  }
}

export async function getModelStatus(): Promise<{ ready: boolean; loading: boolean }> {
  try {
    await ensureOffscreenDocument()
    const response = await chrome.runtime.sendMessage({ type: 'MODEL_STATUS' })
    return response ?? { ready: false, loading: false }
  } catch {
    return { ready: false, loading: false }
  }
}

/**
 * Three-tier classification:
 * 1. AI confidence >= 0.7 → use AI result
 * 2. AI confidence 0.4-0.7 → keyword fallback as tiebreaker
 * 3. AI confidence < 0.4 → default to 'other'
 *
 * Falls back to keyword-only if AI is unavailable.
 */
export async function classifyWithAI(
  subject: string,
  snippet: string
): Promise<EmailCategory> {
  try {
    const status = await getModelStatus()

    if (!status.ready) {
      dbg('ai-classifier.classifyWithAI — model not ready, using keywords')
      return keywordClassify(subject, snippet)
    }

    const result = await chrome.runtime.sendMessage({
      type: 'CLASSIFY_EMAIL',
      subject,
      snippet,
    })

    if (!result || result.confidence === 0) {
      dbg('ai-classifier.classifyWithAI — AI returned no result, using keywords')
      return keywordClassify(subject, snippet)
    }

    const { label, confidence } = result as { label: EmailCategory; confidence: number }

    // Tier 1: High confidence — trust the AI
    if (confidence >= AI_CONFIDENCE_HIGH) {
      dbg('ai-classifier.classifyWithAI — tier 1 (high confidence)', { label, confidence })
      return label
    }

    // Tier 2: Medium confidence — keyword tiebreaker
    if (confidence >= AI_CONFIDENCE_LOW) {
      const keywordResult = keywordClassify(subject, snippet)
      if (keywordResult !== 'other') {
        dbg('ai-classifier.classifyWithAI — tier 2 (keyword wins)', {
          aiLabel: label,
          confidence,
          keywordLabel: keywordResult,
        })
        return keywordResult
      }
      // Keywords say 'other', use AI's best guess
      dbg('ai-classifier.classifyWithAI — tier 2 (AI wins over keyword other)', {
        label,
        confidence,
      })
      return label
    }

    // Tier 3: Low confidence — default to other
    dbg('ai-classifier.classifyWithAI — tier 3 (low confidence)', { label, confidence })
    return 'other'
  } catch (error) {
    dbgError('ai-classifier.classifyWithAI — failed, using keywords', error)
    return keywordClassify(subject, snippet)
  }
}
