import { useTargetTracker } from './hooks/useTargetTracker'
import { useTheme } from './hooks/useTheme'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TodoBoard from './components/TodoBoard'
import CalendarView from './components/CalendarView'
import Notes from './components/Notes'
import Report from './components/Report'

export default function App() {
  const { vals, actions } = useTargetTracker()
  const { theme, toggle } = useTheme()

  return (
    <div
      id="app-root"
      className="mx-auto box-border w-full max-w-[1600px] px-4 pb-16 pt-6 text-fg sm:px-6 lg:px-11 lg:pt-11 print:p-0"
    >
      {!vals.printing && <Header vals={vals} goPage={actions.goPage} theme={theme} toggleTheme={toggle} />}

      {vals.page === 'dash' && <Dashboard vals={vals} actions={actions} />}
      {vals.page === 'todo' && <TodoBoard vals={vals} actions={actions} />}
      {vals.page === 'cal' && <CalendarView vals={vals} actions={actions} />}
      {vals.page === 'notes' && <Notes vals={vals} actions={actions} />}
      {vals.page === 'report' && <Report vals={vals} actions={actions} />}
    </div>
  )
}
