import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchClient } from '@/components/companyAccounts/actions'

export const Route = createFileRoute('/clients_/$id/view')({
  loader: async ({ params }) => {
    const item = await fetchClient({ data: params })

    throw redirect({
      to: '/companies/$id/view',
      params: { id: item.company.id },
      search: { tab: item.id },
      replace: true,
    })
  },
  component: () => null,
})
