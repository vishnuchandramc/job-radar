import { pipeline, env, type TextClassificationPipeline } from '@huggingface/transformers'

// Disable local model loading — always fetch from HuggingFace Hub
env.allowLocalModels = false

const MODEL_ID = 'vcmpd1/job-email-classifier'
const CATEGORIES = ['offer', 'interview_request', 'rejection', 'application_confirmation', 'other'] as const

let classifier: TextClassificationPipeline | null = null
let modelReady = false
let modelLoading = false

type CategoryLabel = typeof CATEGORIES[number]

interface ClassifyRequest {
  type: 'CLASSIFY_EMAIL'
  id: string
  subject: string
  snippet: string
}

interface LoadModelRequest {
  type: 'LOAD_MODEL'
}

interface ModelStatusRequest {
  type: 'MODEL_STATUS'
}

type OffscreenMessage = ClassifyRequest | LoadModelRequest | ModelStatusRequest

interface ClassificationResult {
  label: CategoryLabel
  confidence: number
}

function broadcastProgress(step: string, processed?: number, total?: number) {
  chrome.runtime.sendMessage({
    type: 'SYNC_PROGRESS',
    step,
    processed,
    total,
  }).catch(() => {})
}

async function loadModel(): Promise<void> {
  if (modelReady || modelLoading) return
  modelLoading = true

  try {
    broadcastProgress('Downloading AI model...')

    classifier = await pipeline('text-classification', MODEL_ID, {
      dtype: 'q8',
      progress_callback: (progress: { status: string; progress?: number }) => {
        if (progress.status === 'progress' && progress.progress != null) {
          broadcastProgress(
            'Downloading AI model...',
            Math.round(progress.progress),
            100
          )
        }
      },
    }) as TextClassificationPipeline

    modelReady = true
    broadcastProgress('AI model ready')
  } catch (error) {
    console.error('[Job Radar] Failed to load AI model:', error)
    modelReady = false
    classifier = null
  } finally {
    modelLoading = false
  }
}

async function classifyEmail(subject: string, snippet: string): Promise<ClassificationResult> {
  if (!classifier || !modelReady) {
    return { label: 'other', confidence: 0 }
  }

  const input = `${subject} [SEP] ${snippet}`

  try {
    const results = await classifier(input, { top_k: 5 })
    const topResult = Array.isArray(results) ? results[0] : results

    // Map model label to our category
    const label = (topResult.label as string).toLowerCase() as CategoryLabel
    const confidence = topResult.score as number

    if (CATEGORIES.includes(label)) {
      return { label, confidence }
    }

    return { label: 'other', confidence }
  } catch (error) {
    console.error('[Job Radar] Classification error:', error)
    return { label: 'other', confidence: 0 }
  }
}

// Handle messages from service worker
chrome.runtime.onMessage.addListener((message: OffscreenMessage, _sender, sendResponse) => {
  if (message.type === 'LOAD_MODEL') {
    loadModel().then(() => {
      sendResponse({ success: modelReady })
    })
    return true
  }

  if (message.type === 'MODEL_STATUS') {
    sendResponse({ ready: modelReady, loading: modelLoading })
    return true
  }

  if (message.type === 'CLASSIFY_EMAIL') {
    classifyEmail(message.subject, message.snippet).then((result) => {
      sendResponse(result)
    })
    return true
  }
})
