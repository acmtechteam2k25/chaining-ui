import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlertIcon, CircleCheckIcon, LockOpenIcon, SendIcon } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CountdownPill } from '@/components/countdown-pill'
import { ResponsePanel } from '@/components/response-panel'
import { StepRail } from '@/components/step-rail'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { usePoll } from '@/hooks/use-poll'
import { clearSession, contestApi, getSession } from '@/lib/api'

function latestClearedStep(completedSteps) {
  if (!completedSteps?.length) return null
  return completedSteps.reduce((best, entry) =>
    Number(entry.step) > Number(best.step) ? entry : best
  ).step
}

function buildResponseMap(completedSteps, previous = {}) {
  const next = { ...previous }
  for (const entry of completedSteps ?? []) {
    const step = Number(entry.step)
    if (Number.isFinite(step) && entry.response != null) {
      next[step] = entry.response
    }
  }
  return next
}

export function PlayPage() {
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [path, setPath] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [responseByStep, setResponseByStep] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [hasToken] = useState(() => Boolean(getSession().token))
  const responseAnchorRef = useRef(null)

  const leaveToJoin = useCallback(() => {
    clearSession()
    navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (!hasToken) navigate('/', { replace: true })
  }, [hasToken, navigate])

  const applyState = useCallback((data, { preferStep } = {}) => {
    setState(data)
    setResponseByStep((prev) => buildResponseMap(data.completedSteps, prev))
    setSelectedStep((current) => {
      if (preferStep != null) return Number(preferStep)
      const stillCleared = data.completedSteps?.some(
        (entry) => Number(entry.step) === Number(current)
      )
      if (stillCleared) return Number(current)
      const latest = latestClearedStep(data.completedSteps)
      return latest == null ? null : Number(latest)
    })
  }, [])

  const refreshRun = useCallback(
    async (isActive) => {
      try {
        const data = await contestApi.me()
        if (!isActive()) return
        applyState(data)
        setConnectionError('')
        setLoading(false)
      } catch (caught) {
        if (!isActive()) return
        if (caught.status === 401) {
          leaveToJoin()
          return
        }
        setConnectionError(caught.message)
        setLoading(false)
      }
    },
    [applyState, leaveToJoin]
  )

  usePoll(refreshRun, 15000, hasToken)

  useEffect(() => {
    if (selectedStep == null) return
    responseAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedStep])

  const handleSelectCleared = useCallback((stepNumber) => {
    setSelectedStep(Number(stepNumber))
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!path.trim() || submitting) return

    setSubmitting(true)
    try {
      const data = await contestApi.attempt(path)
      if (data.correct) {
        const solvedNumber = Number(
          data.solvedStep?.number ?? latestClearedStep(data.completedSteps)
        )
        if (data.response != null && Number.isFinite(solvedNumber)) {
          setResponseByStep((prev) => ({ ...prev, [solvedNumber]: data.response }))
        }
        applyState(data, { preferStep: solvedNumber })
        setFeedback({
          kind: 'success',
          message: data.message,
          step: data.solvedStep,
        })
        setPath('')
      } else {
        applyState(data)
        setFeedback({ kind: 'error', message: data.message })
      }
    } catch (caught) {
      if (caught.status === 401) {
        leaveToJoin()
        return
      }
      if (caught.data?.participant) applyState(caught.data)
      setFeedback({ kind: 'error', message: caught.message })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedResponse = useMemo(() => {
    if (selectedStep == null) return null
    const key = Number(selectedStep)
    if (responseByStep[key] != null) return responseByStep[key]
    const entry = state?.completedSteps?.find((item) => Number(item.step) === key)
    return entry?.response ?? null
  }, [selectedStep, responseByStep, state])

  const selectedTitle = useMemo(() => {
    if (selectedStep == null || !state?.steps) return null
    return state.steps.find((step) => Number(step.number) === Number(selectedStep))?.title ?? null
  }, [selectedStep, state])

  if (loading && !state) {
    return (
      <AppShell aside={<CountdownPill timing={null} />}>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3" aria-busy="true" aria-label="Loading steps">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="size-6 shrink-0 rounded-full" />
                <div className="flex w-full flex-col gap-2 pt-0.5">
                  <Skeleton className="h-4 w-[70%]" />
                  <Skeleton className="h-3 w-[40%]" />
                </div>
              </div>
            ))}
          </aside>

          <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading contest">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-[55%]" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (!state) {
    return (
      <AppShell aside={<CountdownPill timing={null} />}>
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>Cannot load your run</AlertTitle>
          <AlertDescription>
            {connectionError || 'The contest server did not respond.'}
          </AlertDescription>
        </Alert>
      </AppShell>
    )
  }

  const totalSteps = state.steps.length
  const cleared = state.completedSteps.length
  const currentStep = state.currentStep
  const locked = state.readOnly
  const viewingCleared = selectedStep != null && selectedResponse != null

  return (
    <AppShell
      aside={
        <>
          <Badge variant="outline" className="font-mono">
            {state.participant.code}
          </Badge>
          <CountdownPill timing={state.timing} />
        </>
      }
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="h-fit min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Vault chain</CardTitle>
            <CardDescription>
              Each cleared step unlocks the next. Click a cleared step to review its response.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <Progress value={(cleared / totalSteps) * 100}>
              <ProgressLabel>Progress</ProgressLabel>
              <ProgressValue className="font-mono">
                {cleared} / {totalSteps}
              </ProgressValue>
            </Progress>
            <StepRail
              steps={state.steps}
              completedSteps={state.completedSteps}
              currentStepNumber={currentStep?.number}
              selectedStepNumber={selectedStep}
              onSelectCleared={handleSelectCleared}
            />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          {connectionError && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Connection lost</AlertTitle>
              <AlertDescription>
                {connectionError} Your saved progress is safe — this page keeps retrying.
              </AlertDescription>
            </Alert>
          )}

          {viewingCleared && (
            <div ref={responseAnchorRef} className="min-w-0">
              <ResponsePanel
                label={`Response · step ${String(selectedStep).padStart(2, '0')}${
                  selectedTitle ? ` · ${selectedTitle}` : ''
                }`}
                data={selectedResponse}
              />
            </div>
          )}

          {selectedStep != null && selectedResponse == null && (
            <div ref={responseAnchorRef}>
              <Alert>
                <CircleAlertIcon />
                <AlertTitle>Response not loaded</AlertTitle>
                <AlertDescription>
                  Refresh the page once. Cleared-step responses come from the contest server.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {state.finished ? (
            <Card className="min-w-0">
              <CardContent>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <LockOpenIcon />
                    </EmptyMedia>
                    <EmptyTitle>Final vault open</EmptyTitle>
                    <EmptyDescription>
                      You cleared all {totalSteps} steps. Your finish time is on the leaderboard.
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button variant="secondary" render={<Link to="/leaderboard" />}>
                    See the leaderboard
                  </Button>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="min-w-0">
              <CardHeader>
                <span className="eyebrow">
                  Step {String(currentStep?.number ?? 0).padStart(2, '0')} of {totalSteps}
                </span>
                <CardTitle className="text-xl">{currentStep?.title}</CardTitle>
                <CardDescription>{currentStep?.hint}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-4">
                {locked && (
                  <Alert>
                    <CircleAlertIcon />
                    <AlertTitle>Submissions are closed</AlertTitle>
                    <AlertDescription>
                      The contest window has ended. Your progress stays visible, but nothing new can
                      be submitted.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="request-path">Request URL</FieldLabel>
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="border-border bg-secondary text-secondary-foreground inline-flex h-8 min-w-14 shrink-0 items-center justify-center rounded-md border px-3 font-mono text-xs font-semibold tracking-[0.14em] uppercase"
                          aria-hidden
                        >
                          GET
                        </span>
                        <Input
                          id="request-path"
                          value={path}
                          onChange={(event) => setPath(event.target.value)}
                          placeholder="Enter the URL"
                          autoComplete="off"
                          spellCheck={false}
                          disabled={locked || submitting}
                          className="min-w-0 flex-1 font-mono"
                        />
                      </div>
                      <FieldDescription>
                        Strictly follow the URL's from the docs
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                  <Button
                    type="submit"
                    size="lg"
                    className="mt-4"
                    disabled={locked || submitting || !path.trim()}
                  >
                    {submitting ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                    {submitting ? 'Checking' : 'Run request'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {feedback && (
            <Alert variant={feedback.kind === 'success' ? 'default' : 'destructive'}>
              {feedback.kind === 'success' ? <CircleCheckIcon /> : <CircleAlertIcon />}
              <AlertTitle>
                {feedback.kind === 'success'
                  ? `${feedback.step?.title ?? 'Step'} cleared`
                  : 'Not this one'}
              </AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </AppShell>
  )
}
