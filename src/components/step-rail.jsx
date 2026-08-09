import { CheckIcon, LockIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatClockTime } from '@/lib/time'

export function StepRail({
  steps,
  completedSteps,
  currentStepNumber,
  selectedStepNumber,
  onSelectCleared,
}) {
  const completedAt = new Map(completedSteps.map((entry) => [entry.step, entry.completedAt]))

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const cleared = completedAt.has(step.number)
        const current = step.number === currentStepNumber
        const selected = cleared && step.number === selectedStepNumber
        const isLast = index === steps.length - 1
        const canSelect = cleared && typeof onSelectCleared === 'function'

        const content = (
          <>
            <span
              className={cn(
                'relative flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.625rem] font-medium',
                cleared && 'border-success bg-success text-success-foreground',
                current && !cleared && 'border-primary bg-primary text-primary-foreground',
                !cleared && !current && 'bg-card text-muted-foreground'
              )}
            >
              {cleared ? (
                <CheckIcon className="size-3" aria-hidden />
              ) : current ? (
                String(step.number).padStart(2, '0')
              ) : (
                <LockIcon className="size-2.5" aria-hidden />
              )}
            </span>

            <div className="flex min-w-0 flex-col text-left">
              <span
                className={cn(
                  'truncate text-sm leading-6',
                  (current || selected) && 'font-semibold',
                  !cleared && !current && 'text-muted-foreground'
                )}
              >
                {cleared || current ? step.title : `Step ${step.number}`}
              </span>
              <span className="font-mono text-[0.6875rem] text-muted-foreground">
                {cleared
                  ? selected
                    ? 'viewing response'
                    : `cleared ${formatClockTime(completedAt.get(step.number))}`
                  : current
                    ? 'in progress'
                    : 'locked'}
              </span>
            </div>
          </>
        )

        return (
          <li key={step.number} className={cn('relative flex gap-3', !isLast && 'pb-4')}>
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute top-7 bottom-0 left-[0.6875rem] w-px',
                  cleared ? 'bg-success/50' : 'bg-border'
                )}
              />
            )}

            {canSelect ? (
              <button
                type="button"
                onClick={() => onSelectCleared(step.number)}
                className={cn(
                  'relative flex min-w-0 flex-1 gap-3 rounded-md text-left transition-colors',
                  'hover:bg-secondary/60 focus-visible:ring-ring -m-1 p-1 focus-visible:ring-2 focus-visible:outline-none',
                  selected && 'bg-secondary'
                )}
              >
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ol>
  )
}
