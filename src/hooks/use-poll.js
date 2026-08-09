import { useEffect } from 'react'

/**
 * Runs `callback` immediately and then every `intervalMs`, waiting for each run to
 * settle before scheduling the next one. The callback gets an `isActive` check so it
 * can drop results that arrive after the component is gone.
 */
export function usePoll(callback, intervalMs, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    let timer = setTimeout(async function run() {
      await callback(() => active)
      if (active) timer = setTimeout(run, intervalMs)
    }, 0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [callback, intervalMs, enabled])
}
