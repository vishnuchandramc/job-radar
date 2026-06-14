const PREFIX = '[Job Radar:debug]'

export function dbg(step: string, detail?: unknown): void {
  if (detail === undefined) {
    console.log(`${PREFIX} ${step}`)
  } else {
    console.log(`${PREFIX} ${step}`, detail)
  }
}

export function dbgError(step: string, error: unknown): void {
  console.error(`${PREFIX} ${step}`, error)
}
