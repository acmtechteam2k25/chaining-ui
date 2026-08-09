import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon, CircleAlertIcon } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CountdownPill } from '@/components/countdown-pill'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Spinner } from '@/components/ui/spinner'
import { usePoll } from '@/hooks/use-poll'
import { contestApi, getSession, saveSession } from '@/lib/api'

const BRIEFING = [
  'Every value comes from a live response on this server — nothing is typed from memory.',
  'Clear a step by pasting the full request URL, for example https://api-chaining-server.onrender.com/v6/latest/XYZ (path-only also works).',
  'Your progress is saved as you go, so a refresh never costs you a step.',
]

export function JoinPage() {
  const navigate = useNavigate()
  const [timing, setTiming] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [resumeCode] = useState(() => {
    const session = getSession()
    return session.token ? session.code : ''
  })

  const refreshStatus = useCallback(async (isActive) => {
    try {
      const data = await contestApi.status()
      if (isActive()) setTiming(data)
    } catch {
      // Keep showing the last known window instead of blanking the header.
    }
  }, [])

  usePoll(refreshStatus, 10000)

  const handleJoin = async (event) => {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const data = await contestApi.join(code)
      saveSession({ token: data.token, code: data.participant.code })
      navigate('/contest')
    } catch (caught) {
      setError(caught.message)
      if (caught.data?.timing) setTiming(caught.data.timing)
    } finally {
      setPending(false)
    }
  }

  return (
    <AppShell showNav={false} aside={<CountdownPill timing={timing} />}>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <section className="flex flex-col gap-6">
          <span className="eyebrow">Round 01 · Sweden</span>
          <h1 className="font-heading max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
            Ten requests stand between you and the vault.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Chain the public APIs hosted on this server, derive each vault key by hand, and paste the
            request path that proves you found it. Everyone in the room shares one clock.
          </p>

          <ol className="flex max-w-xl flex-col gap-3 border-t pt-6">
            {BRIEFING.map((line, index) => (
              <li key={line} className="flex gap-3 text-sm">
                <span className="font-mono text-xs leading-6 text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="leading-6">{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Join the contest</CardTitle>
            <CardDescription>
              Enter the participant ID printed on your table card.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {resumeCode && (
              <Alert>
                <AlertTitle>You already joined as {resumeCode}</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-2">
                  Pick up exactly where you left off.
                  <Button size="sm" variant="secondary" onClick={() => navigate('/contest')}>
                    Resume run
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form id="join-form" onSubmit={handleJoin}>
              <FieldGroup>
                <Field data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor="participant-code">Participant ID</FieldLabel>
                  <Input
                    id="participant-code"
                    name="code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="ACM100"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="font-mono tracking-[0.12em]"
                    aria-invalid={error ? true : undefined}
                  />
                  <FieldDescription>
                    IDs are handed out by the organizers. Nothing else is needed to play.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>

            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>Cannot join yet</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button type="submit" form="join-form" size="lg" disabled={pending || !code.trim()}>
              {pending && <Spinner data-icon="inline-start" />}
              {pending ? 'Joining' : 'Start my run'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  )
}
