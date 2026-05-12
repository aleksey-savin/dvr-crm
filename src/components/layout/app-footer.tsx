import { Link } from '@tanstack/react-router'

import { appVersion } from '@/lib/app-version'

export function AppFooter() {
  return (
    <footer className="shrink-0 border-t px-4 py-3">
      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>DVR Group</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            to="/changelog"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Changelog
          </Link>
          <span>Версия {appVersion}</span>
        </div>
      </div>
    </footer>
  )
}
