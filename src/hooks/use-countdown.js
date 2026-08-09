import { useSyncExternalStore } from 'react'

function subscribe(onTick) {
  const id = setInterval(onTick, 1000)
  return () => clearInterval(id)
}

function getNowSeconds() {
  return Math.floor(Date.now() / 1000)
}

// Offset between the server clock and this device, cached per status payload so a
// participant with a wrong system clock still sees the real remaining time.
const skewCache = new Map()

function skewFor(serverNow) {
  if (!serverNow) return 0
  if (!skewCache.has(serverNow)) {
    if (skewCache.size > 16) skewCache.clear()
    skewCache.set(serverNow, Date.parse(serverNow) - Date.now())
  }
  return skewCache.get(serverNow)
}

export function useCountdown(timing) {
  const nowSeconds = useSyncExternalStore(subscribe, getNowSeconds)

  if (!timing?.endsAt) return 0

  const skewSeconds = skewFor(timing.serverNow) / 1000
  const deadlineSeconds = Date.parse(timing.endsAt) / 1000
  return Math.max(0, Math.round(deadlineSeconds - (nowSeconds + skewSeconds)))
}
