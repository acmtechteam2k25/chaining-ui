import { cn } from '@/lib/utils'

export function ResponsePanel({ label, data, className }) {
  return (
    <div className={cn('flex min-w-0 max-w-full flex-col gap-1.5', className)}>
      <span className="eyebrow">{label}</span>
      <pre className="max-h-72 w-full max-w-full overflow-x-auto overflow-y-auto rounded-md border bg-card p-3 font-mono text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
