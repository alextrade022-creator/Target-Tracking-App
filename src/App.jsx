import { useWorkspace } from './ws/useWorkspace'
import { useTheme } from './hooks/useTheme'
import Shell from './ws/Shell'
import Today from './ws/Today'
import Tasks from './ws/Tasks'
import Meetings from './ws/Meetings'
import CalendarPage from './ws/CalendarPage'
import Settings from './ws/Settings'
import Branding from './brand/Branding'
import { useBranding } from './brand/useBranding'
import Finance from './pf/Finance'
import { usePersonalFinance } from './pf/usePersonalFinance'
import Leads from './crm/Leads'
import { useLeads } from './crm/useLeads'
import Payments from './pay/Payments'
import Notes from './notes/Notes'
import { useNotes } from './notes/useNotes'
import { usePayments } from './pay/usePayments'

export default function App() {
  const ws = useWorkspace()
  const brand = useBranding()
  const pf = usePersonalFinance()
  const crm = useLeads()
  const pay = usePayments()
  const nb = useNotes()
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
      {page === 'notes' && <Notes nb={nb} ws={ws} />}
      {page === 'branding' && <Branding brand={brand} />}
    </Shell>
  )
}
