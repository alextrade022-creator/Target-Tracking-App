import { useTargetTracker } from './hooks/useTargetTracker'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import TodoBoard from './components/TodoBoard'
import CalendarView from './components/CalendarView'
import Notes from './components/Notes'
import Report from './components/Report'

export default function App() {
  const { vals, actions } = useTargetTracker()

  return (
    <div
      id="app-root"
      className="mx-auto box-border w-[1600px] max-w-full px-11 pb-16 pt-11 text-fg print:w-auto print:p-0"
    >
      {!vals.printing && <Header vals={vals} goPage={actions.goPage} />}

      {vals.page === 'dash' && <Dashboard vals={vals} actions={actions} />}
      {vals.page === 'todo' && <TodoBoard vals={vals} actions={actions} />}
      {vals.page === 'cal' && <CalendarView vals={vals} actions={actions} />}
      {vals.page === 'notes' && <Notes vals={vals} actions={actions} />}
      {vals.page === 'report' && <Report vals={vals} actions={actions} />}
    </div>
  )
}
