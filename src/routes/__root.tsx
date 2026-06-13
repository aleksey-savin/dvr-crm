import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
import { Toaster } from '@/components/ui/sonner'
import { AppSidebar } from '@/components/layout/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppBreadcrumb } from '@/components/layout/app-breadcrumb'

import { authClient } from 'utils/auth-client'
import { authMiddleware } from 'utils/middleware'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { useDepartmentStore } from '@/stores/department-store'
import { AppFooter } from '@/components/layout/app-footer'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Корпоративный портал DVR Group',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  server: {
    middleware: [authMiddleware],
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const accentColor = useDepartmentStore((s) => s.selectedAccentColor)

  return (
    <html lang="ru" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            {isPending ? null : session?.user ? (
              <SidebarProvider>
                <AppSidebar />
                <SidebarInset
                  className="min-w-0"
                  style={
                    accentColor
                      ? ({
                          '--dept-accent': accentColor,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  <header
                    className={`flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between${accentColor ? ' header-dept-accent' : ''}`}
                  >
                    <div className="flex gap-4 items-center">
                      <SidebarTrigger className="-ml-1" />
                      <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                      />
                      <AppBreadcrumb />
                    </div>
                    <ModeToggle />
                  </header>
                  <main className="flex min-h-0 flex-1 flex-col p-4">
                    {children}
                  </main>
                  <AppFooter />
                </SidebarInset>
              </SidebarProvider>
            ) : (
              <>{children}</>
            )}

            <Toaster />
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </ThemeProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
