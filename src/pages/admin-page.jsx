import { useCallback, useState } from 'react'
import {
  CircleAlertIcon,
  FlagIcon,
  LockIcon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
  UserPlusIcon,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CountdownPill } from '@/components/countdown-pill'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePoll } from '@/hooks/use-poll'
import { adminApi, clearAdminSecret, getAdminSecret, saveAdminSecret } from '@/lib/api'
import { formatClockTime } from '@/lib/time'

const STATUS_LABEL = {
  registered: 'Not started',
  playing: 'Running',
  finished: 'Finished',
  timed_out: 'Out of time',
}

export function AdminPage() {
  const [authed, setAuthed] = useState(() => Boolean(getAdminSecret()))
  const [secret, setSecret] = useState('')
  const [authError, setAuthError] = useState('')
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [duration, setDuration] = useState(25)
  const [seedRange, setSeedRange] = useState({ prefix: 'ACM', from: 100, to: 120 })
  const [newCodes, setNewCodes] = useState('')
  const [renaming, setRenaming] = useState({ code: '', value: '' })

  const signOut = useCallback(() => {
    clearAdminSecret()
    setAuthed(false)
    setOverview(null)
  }, [])

  const load = useCallback(async () => {
    try {
      const data = await adminApi.overview()
      setOverview(data)
      setError('')
    } catch (caught) {
      if (caught.status === 401) {
        signOut()
        setAuthError('That secret was rejected. Try again.')
        return
      }
      setError(caught.message)
    }
  }, [signOut])

  const refreshOverview = useCallback(
    async (isActive) => {
      if (isActive()) await load()
    },
    [load]
  )

  usePoll(refreshOverview, 10000, authed)

  const handleAuth = async (event) => {
    event.preventDefault()
    setAuthError('')
    saveAdminSecret(secret.trim())
    try {
      await adminApi.overview()
      setSecret('')
      setAuthed(true)
    } catch (caught) {
      clearAdminSecret()
      setAuthError(caught.status === 401 ? 'Wrong admin secret.' : caught.message)
    }
  }

  const run = async (key, action) => {
    setBusy(key)
    setError('')
    try {
      const data = await action()
      if (data?.participants) {
        setOverview((current) => (current ? { ...current, participants: data.participants } : current))
      }
      if (data?.timing) {
        setOverview((current) => (current ? { ...current, timing: data.timing } : current))
      }
      await load()
    } catch (caught) {
      if (caught.status === 401) {
        signOut()
        return
      }
      setError(caught.message)
    } finally {
      setBusy('')
    }
  }

  if (!authed) {
    return (
      <AppShell showNav={false}>
        <div className="mx-auto max-w-md pt-8">
          <Card>
            <CardHeader>
              <span className="eyebrow">Organizers only</span>
              <CardTitle>Admin console</CardTitle>
              <CardDescription>
                The secret lives in the server environment, not in this app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="admin-auth" onSubmit={handleAuth}>
                <FieldGroup>
                  <Field data-invalid={authError ? true : undefined}>
                    <FieldLabel htmlFor="admin-secret">Admin secret</FieldLabel>
                    <Input
                      id="admin-secret"
                      type="password"
                      value={secret}
                      onChange={(event) => setSecret(event.target.value)}
                      autoComplete="current-password"
                      aria-invalid={authError ? true : undefined}
                    />
                    {authError && <FieldDescription>{authError}</FieldDescription>}
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="admin-auth" disabled={!secret.trim()}>
                <LockIcon data-icon="inline-start" />
                Unlock console
              </Button>
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!overview && !error) {
    return (
      <AppShell
        showNav={false}
        aside={
          <>
            <CountdownPill timing={null} />
            <Button variant="ghost" size="sm" onClick={signOut}>
              Lock
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading admin console">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <Skeleton className="mt-2 h-10 w-36" />
            </div>
            <div className="flex flex-col gap-4 rounded-lg border bg-card p-6">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-6">
            <Skeleton className="h-7 w-48" />
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 py-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  const participants = overview?.participants ?? []
  const totalSteps = overview?.totalSteps ?? 10
  const joined = participants.filter((row) => row.joinedAt).length
  const finished = participants.filter((row) => row.status === 'finished').length

  return (
    <AppShell
      showNav={false}
      aside={
        <>
          <CountdownPill timing={overview?.timing} />
          <Button variant="ghost" size="sm" onClick={signOut}>
            Lock
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <span className="eyebrow">Clock</span>
              <CardTitle>Contest window</CardTitle>
              <CardDescription>
                One window for everyone. Opening restarts the countdown for the whole room.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col">
                  <dt className="eyebrow">Started</dt>
                  <dd className="font-mono">{formatClockTime(overview?.timing?.startedAt)}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="eyebrow">Ends</dt>
                  <dd className="font-mono">{formatClockTime(overview?.timing?.endsAt)}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="eyebrow">Joined</dt>
                  <dd className="font-mono">
                    {joined} / {participants.length}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="eyebrow">Finished</dt>
                  <dd className="font-mono">{finished}</dd>
                </div>
              </dl>

              <Separator />

              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="duration">Minutes</FieldLabel>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={600}
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    className="w-24 font-mono"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button
                disabled={busy === 'open'}
                onClick={() => run('open', () => adminApi.open(duration))}
              >
                {busy === 'open' ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                Open contest
              </Button>
              <Button
                variant="destructive"
                disabled={busy === 'close'}
                onClick={() => run('close', () => adminApi.close())}
              >
                {busy === 'close' ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SquareIcon data-icon="inline-start" />
                )}
                Close now
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <span className="eyebrow">Roster</span>
              <CardTitle>Participant IDs</CardTitle>
              <CardDescription>
                Seed a numbered range, or paste specific IDs separated by spaces or commas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="seed-prefix">Prefix</FieldLabel>
                  <Input
                    id="seed-prefix"
                    value={seedRange.prefix}
                    onChange={(event) =>
                      setSeedRange((current) => ({
                        ...current,
                        prefix: event.target.value.toUpperCase(),
                      }))
                    }
                    className="w-24 font-mono"
                  />
                  <FieldLabel htmlFor="seed-from">From</FieldLabel>
                  <Input
                    id="seed-from"
                    type="number"
                    value={seedRange.from}
                    onChange={(event) =>
                      setSeedRange((current) => ({ ...current, from: Number(event.target.value) }))
                    }
                    className="w-20 font-mono"
                  />
                  <FieldLabel htmlFor="seed-to">To</FieldLabel>
                  <Input
                    id="seed-to"
                    type="number"
                    value={seedRange.to}
                    onChange={(event) =>
                      setSeedRange((current) => ({ ...current, to: Number(event.target.value) }))
                    }
                    className="w-20 font-mono"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="extra-codes">Extra IDs</FieldLabel>
                  <Input
                    id="extra-codes"
                    value={newCodes}
                    onChange={(event) => setNewCodes(event.target.value.toUpperCase())}
                    placeholder="ACM200, ACM201"
                    className="font-mono"
                  />
                  <FieldDescription>Adding an existing ID leaves it untouched.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={busy === 'seed'}
                onClick={() => run('seed', () => adminApi.seed(seedRange))}
              >
                {busy === 'seed' ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <UserPlusIcon data-icon="inline-start" />
                )}
                Seed {seedRange.prefix}
                {seedRange.from}–{seedRange.prefix}
                {seedRange.to}
              </Button>
              <Button
                variant="outline"
                disabled={busy === 'add' || !newCodes.trim()}
                onClick={() =>
                  run('add', async () => {
                    const data = await adminApi.addCodes(newCodes)
                    setNewCodes('')
                    return data
                  })
                }
              >
                Add listed IDs
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <span className="eyebrow">Live progress</span>
            <CardTitle>Participants</CardTitle>
            <CardDescription>
              Renaming only changes what the leaderboard shows. Resetting clears that player&apos;s
              run and session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead className="w-20">Steps</TableHead>
                  <TableHead className="w-20">Tries</TableHead>
                  <TableHead className="w-28">Last clear</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="w-56 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell className="font-mono">{row.code}</TableCell>
                    <TableCell>
                      {renaming.code === row.code ? (
                        <form
                          className="flex gap-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            const value = renaming.value
                            run(`rename-${row.code}`, async () => {
                              const data = await adminApi.rename(row.code, value)
                              setRenaming({ code: '', value: '' })
                              return data
                            })
                          }}
                        >
                          <Input
                            value={renaming.value}
                            onChange={(event) =>
                              setRenaming({ code: row.code, value: event.target.value })
                            }
                            className="h-7"
                            autoFocus
                          />
                          <Button type="submit" size="sm">
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setRenaming({ code: '', value: '' })}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className="rounded-sm text-left hover:underline"
                          onClick={() => setRenaming({ code: row.code, value: row.displayName })}
                        >
                          {row.displayName}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {row.stepsCompleted}/{totalSteps}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground">
                      {row.attemptCount ?? 0}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.lastCompletedAt ? formatClockTime(row.lastCompletedAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'finished' ? 'default' : 'outline'}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === `finish-${row.code}`}
                          onClick={() => run(`finish-${row.code}`, () => adminApi.finish(row.code))}
                        >
                          <FlagIcon data-icon="inline-start" />
                          Finish
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy === `reset-${row.code}`}
                          onClick={() => run(`reset-${row.code}`, () => adminApi.reset(row.code))}
                        >
                          <RotateCcwIcon data-icon="inline-start" />
                          Reset
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
