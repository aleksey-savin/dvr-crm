import { createFileRoute, redirect } from '@tanstack/react-router'

import { fetchWishlistClient } from '@/components/companyAccounts/actions'

export const Route = createFileRoute('/wishlist_/$id/view')({
  loader: async ({ params }) => {
    const item = await fetchWishlistClient({ data: params })

    throw redirect({
      to: '/companies/$id/view',
      params: { id: item.company.id },
      search: { tab: item.id },
      replace: true,
    })
  },
  component: () => null,
})
