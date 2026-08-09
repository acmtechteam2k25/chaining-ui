export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export function formatClockTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function describeWindow(timing) {
  if (!timing) return 'Checking the contest window…'
  if (timing.isRunning) return 'Contest is live'
  if (timing.isOpen) return 'Time is up'
  return timing.startedAt ? 'Contest closed' : 'Contest has not opened yet'
}
