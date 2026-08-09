import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navLinkClass = ({ isActive }) =>
  cn(
    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
  )

export function AppShell({ children, aside, showNav = true }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <Link to="/" className="flex flex-col gap-0.5">
            <span className="eyebrow">ACM VNRVJIET</span>
            <span className="font-heading text-lg leading-none font-extrabold tracking-tight">
              API Vault Challenge
            </span>
          </Link>

          {showNav && (
            <nav className="flex items-center gap-1">
              <NavLink to="/contest" className={navLinkClass}>
                Play
              </NavLink>
              <NavLink to="/leaderboard" className={navLinkClass}>
                Leaderboard
              </NavLink>
              <a
                href="/docs"
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Docs
              </a>
            </nav>
          )}

          {aside && <div className="ml-auto flex flex-wrap items-center gap-3">{aside}</div>}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-5 py-8">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-xs text-muted-foreground">
          <span>Ten requests, three vault layers, one shared clock.</span>
          <Link to="/admin" className="ml-auto hover:text-foreground">
            Organizers
          </Link>
        </div>
      </footer>
    </div>
  )
}
