import { useCallback, useState } from 'react'
import { CircleAlertIcon, TrophyIcon } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CountdownPill } from '@/components/countdown-pill'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePoll } from '@/hooks/use-poll'
import { contestApi } from '@/lib/api'
import { formatClockTime } from '@/lib/time'
import { cn } from '@/lib/utils'

const STATUS_LABEL = {
  registered: 'Not started',
  playing: 'Running',
  finished: 'Finished',
  timed_out: 'Out of time',
}

export function LeaderboardPage() {
  const [board, setBoard] = useState(null)
  const [error, setError] = useState('')

  const refreshBoard = useCallback(async (isActive) => {
    try {
      const data = await contestApi.leaderboard()
      if (!isActive()) return
      setBoard(data)
      setError('')
    } catch (caught) {
      if (isActive()) setError(caught.message)
    }
  }, [])

  usePoll(refreshBoard, 10000)

  const entries = board?.entries ?? []
  const totalSteps = board?.totalSteps ?? 10

  return (
    <AppShell aside={<CountdownPill timing={board?.timing} />}>
      <Card>
        <CardHeader>
          <span className="eyebrow">Live standings</span>
          <CardTitle className="text-xl">Leaderboard</CardTitle>
          <CardDescription>
            Ranked by steps cleared, then by who reached that step first. Refreshes every ten
            seconds.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Cannot load the leaderboard</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!board && !error && (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading leaderboard">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="flex items-center gap-4 py-1">
                  <Skeleton className="h-4 w-8 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-[45%]" />
                    <Skeleton className="h-3 w-[25%]" />
                  </div>
                  <Skeleton className="h-4 w-14 shrink-0" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                  <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {board && entries.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TrophyIcon />
                </EmptyMedia>
                <EmptyTitle>Nobody has joined yet</EmptyTitle>
                <EmptyDescription>
                  Standings appear as soon as the first participant starts their run.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {entries.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="w-28">Steps</TableHead>
                  <TableHead className="w-32">Last clear</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.code}>
                    <TableCell className="font-mono text-muted-foreground">
                      {String(entry.rank).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{entry.displayName}</span>
                        {entry.displayName !== entry.code && (
                          <span className="font-mono text-xs text-muted-foreground">
                            {entry.code}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm tabular-nums">
                          {entry.stepsCompleted}/{totalSteps}
                        </span>
                        <span
                          aria-hidden
                          className="h-1 w-12 overflow-hidden rounded-full bg-muted"
                        >
                          <span
                            className={cn(
                              'block h-full',
                              entry.status === 'finished' ? 'bg-success' : 'bg-primary'
                            )}
                            style={{ width: `${(entry.stepsCompleted / totalSteps) * 100}%` }}
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.lastCompletedAt ? formatClockTime(entry.lastCompletedAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.status === 'finished' ? 'default' : 'outline'}>
                        {STATUS_LABEL[entry.status] ?? entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}
