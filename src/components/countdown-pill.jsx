import { TimerIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCountdown } from '@/hooks/use-countdown'
import { cn } from '@/lib/utils'
import { describeWindow, formatCountdown } from '@/lib/time'

export function CountdownPill({ timing }) {
  const secondsLeft = useCountdown(timing)
  const running = Boolean(timing?.isRunning) && secondsLeft > 0
  const urgent = running && secondsLeft <= 120

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-sm tabular-nums',
          running ? 'bg-card text-foreground' : 'bg-muted text-muted-foreground',
          urgent && 'border-destructive text-destructive'
        )}
        aria-live={urgent ? 'polite' : 'off'}
      >
        <TimerIcon className="size-3.5" aria-hidden />
        {running ? formatCountdown(secondsLeft) : '--:--'}
        <span className="sr-only">remaining</span>
      </span>
      <Badge variant={running ? 'default' : 'outline'}>{describeWindow(timing)}</Badge>
    </div>
  )
}
