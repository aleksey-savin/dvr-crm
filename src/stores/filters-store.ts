import * as React from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Persisted list-view UI state (table filters, view toggles) so it survives a
 * page reload. Keyed by route, then by filter name. Values are opaque
 * (string[], string, boolean, …) — the call site owns the type via the hook.
 */
interface FiltersStore {
  // Bucket may be absent for a route until its first write — hence `| undefined`.
  filters: Record<string, Record<string, unknown> | undefined>
  setFilter: (routeKey: string, filterKey: string, value: unknown) => void
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: {},
      setFilter: (routeKey, filterKey, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [routeKey]: {
              ...(state.filters[routeKey] ?? {}),
              [filterKey]: value,
            },
          },
        })),
    }),
    { name: 'dvr-filters-store' },
  ),
)

/**
 * Drop-in replacement for `useState` whose value is persisted in
 * {@link useFiltersStore}. The value falls back to `defaultValue` on the first
 * (server-matching) render and switches to the stored value after mount, which
 * keeps SSR hydration consistent — no flash of mismatched markup warnings.
 */
export function usePersistedFilter<T>(
  routeKey: string,
  filterKey: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const stored = useFiltersStore((s) => s.filters[routeKey]?.[filterKey]) as
    | T
    | undefined
  const setFilter = useFiltersStore((s) => s.setFilter)

  const value = mounted && stored !== undefined ? stored : defaultValue

  const setValue: React.Dispatch<React.SetStateAction<T>> = (next) => {
    const resolved =
      typeof next === 'function' ? (next as (prev: T) => T)(value) : next
    setFilter(routeKey, filterKey, resolved)
  }

  return [value, setValue]
}
