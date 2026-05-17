import * as React from 'react'
import { useRouter } from '@tanstack/react-router'
import { CalendarPlusIcon, FileTextIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import { MeetingForm } from '@/components/meetings/meeting-form'
import { ProposalForm } from '@/components/proposals/proposal-form'

type Props = {
  initiativeId: string
  companyId: string | null
  departmentId: string | null
}

export function InitiativeQuickActions({
  initiativeId,
  companyId,
  departmentId,
}: Props) {
  const router = useRouter()
  const [meetingOpen, setMeetingOpen] = React.useState(false)
  const [proposalOpen, setProposalOpen] = React.useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setMeetingOpen(true)}
        className="flex-1"
      >
        <CalendarPlusIcon className="size-4" />
        Новая встреча
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setProposalOpen(true)}
        className="flex-1"
      >
        <FileTextIcon className="size-4" />
        Новое КП
      </Button>

      <ResponsiveDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        title="Новая встреча"
      >
        <MeetingForm
          presetInitiativeId={initiativeId}
          presetCompanyId={companyId}
          presetDepartmentId={departmentId}
          onSuccess={async () => {
            setMeetingOpen(false)
            await router.invalidate()
          }}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        title="Новое КП"
      >
        <ProposalForm
          presetInitiativeId={initiativeId}
          onSuccess={async () => {
            setProposalOpen(false)
            await router.invalidate()
          }}
        />
      </ResponsiveDialog>
    </div>
  )
}
