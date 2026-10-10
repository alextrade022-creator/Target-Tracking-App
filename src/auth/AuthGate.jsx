import { useEffect, useState } from 'react'
import { getSession, login, flushUnsaved } from '../lib/api'

/* Shows the login screen until the server confirms a session, then renders the
   app. If the session expires while the app is open, the login appears on top
   (nothing is lost) and unsaved changes are re-sent after logging back in. */

export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: 'checking' }) // checking | in | out | setup | offline
  const [expired, setExpired] = useState(false)

  const check = () => getSession().then(setState)
  useEffect(() => { check() }, [])
  useEffect(() => {
    const onExpired = () => setExpired(true)
    window.addEventListener('cc:auth-expired', onExpired)
    return () => window.removeEventListener('cc:auth-expired', onExpired)
  }, [])

  if (state.status === 'checking') return <div className="min-h-screen" aria-busy="true" />
  if (state.status !== 'in') {
    return <LoginScreen status={state.status} onRetry={check} onDone={(user) => setState({ status: 'in', user })} />
  }
  return (
    <>
      {children}
      {expired && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm">
          <LoginScreen
            status="expired"
            overlay
            onRetry={check}
            onDone={() => { setExpired(false); flushUnsaved() }}
          />
        </div>
      )}
    </>
  )
}

function LoginScreen({ status, overlay = false, onDone, onRetry }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!user.trim() || !password) { setErr('Enter your user ID and password.'); return }
    setBusy(true)
    const msg = await login(user.trim(), password)
    setBusy(false)
    if (msg) { setErr(msg); setPassword(''); return }
    onDone(user.trim())
  }

  return (
    <div className={overlay ? 'flex min-h-full items-center justify-center p-4' : 'flex min-h-screen items-center justify-center p-4'}>
      <div className="w-full max-w-[380px]">
        {!overlay && (
          <div className="mb-6 text-center">
            <div className="font-head text-[22px] font-bold tracking-[-0.01em]">Command Center</div>
            <div className="mt-1 text-[13px] text-mute">Sign in to continue</div>
          </div>
        )}
        <div className="panel p-6">
          {status === 'setup' ? (
            <div className="grid gap-3 text-[13.5px]">
              <h1 className="font-head text-[17px] font-semibold">Set up your login first</h1>
              <p className="text-mute">No user ID and password have been set for this app yet. In Terminal, in the project folder, run:</p>
              <code className="rounded-lg bg-hair/[0.06] px-3 py-2 text-[13px]">npm run set-login</code>
              <p className="text-mute">Then restart <code>npm run dev</code> and reload this page.</p>
              <button type="button" onClick={onRetry} className="mt-1 rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Check again</button>
            </div>
          ) : status === 'offline' ? (
            <div className="grid gap-3 text-[13.5px]">
              <h1 className="font-head text-[17px] font-semibold">Can't reach the server</h1>
              <p className="text-mute">Check that the app's API is running (<code>npm run dev</code>), then try again.</p>
              <button type="button" onClick={onRetry} className="rounded-lg bg-teal px-4 py-2.5 text-[13px] font-semibold text-onaccent hover:bg-teal-lt">Try again</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4">
              {overlay && (
                <div>
                  <h1 className="font-head text-[17px] font-semibold">You've been signed out</h1>
                  <p className="mt-1 text-[13px] text-mute">Sign in again. Your recent changes will be saved once you're back in.</p>
                </div>
              )}
              <label className="grid gap-1.5 text-[12px] font-medium text-mute">
                User ID
                <input className="field" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus value={user} onChange={(e) => { setUser(e.target.value); setErr('') }} />
              </label>
              <label className="grid gap-1.5 text-[12px] font-medium text-mute">
                Password
                <span className="relative block">
                  <input className="field pr-16" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setErr('') }} />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-7 rounded-md px-2 text-[12px] font-medium text-mute hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? 'Hide' : 'Show'}
                  </button>
                </span>
              </label>
              {err && <p role="alert" className="text-[12.5px] text-pink">{err}</p>}
              <button type="submit" disabled={busy} className="rounded-lg bg-teal px-4 py-2.5 text-[13.5px] font-semibold text-onaccent hover:bg-teal-lt disabled:opacity-60">
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
