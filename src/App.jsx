import { useWorkspace } from './ws/useWorkspace'
import { useTargetTracker } from './hooks/useTargetTracker'
import { useTheme } from './hooks/useTheme'
import Shell from './ws/Shell'
import Today from './ws/Today'
import Tasks from './ws/Tasks'
import Meetings from './ws/Meetings'
import CalendarPage from './ws/CalendarPage'
import Settings from './ws/Settings'
import { PageHeader } from './ws/ui'
import Branding from './components/Branding'
import Finance from './pf/Finance'
import { usePersonalFinance } from './pf/usePersonalFinance'
import Leads from './crm/Leads'
import { useLeads } from './crm/useLeads'
import Payments from './pay/Payments'
import { usePayments } from './pay/usePayments'

export default function App() {
  const ws = useWorkspace()
  // The personal-branding module keeps its existing content/tag logic.
  const legacy = useTargetTracker()
  const pf = usePersonalFinance()
  const crm = useLeads()
  const pay = usePayments()
  const { theme, toggle } = useTheme()
  const page = ws.state.page

  return (
    <Shell ws={ws} theme={theme} toggleTheme={toggle}>
      {page === 'today' && <Today ws={ws} crm={crm} pay={pay} />}
      {page === 'tasks' && <Tasks ws={ws} />}
      {page === 'meetings' && <Meetings ws={ws} />}
      {page === 'calendar' && <CalendarPage ws={ws} />}
      {page === 'settings' && <Settings ws={ws} />}
      {page === 'finance' && <Finance pf={pf} />}
      {page === 'leads' && <Leads crm={crm} ws={ws} pay={pay} />}
      {page === 'payments' && <Payments pay={pay} />}
      {page === 'branding' && (
        <>
          <PageHeader title="Personal branding" subtitle="Plan, shoot, edit and post your content." />
          <div className="-mt-7">
            <Branding vals={legacy.vals} actions={legacy.actions} />
          </div>
        </>
      )}
    </Shell>
  )
}
