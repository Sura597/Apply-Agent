'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'in' | 'up' | 'forgot'

export default function Login() {
  const [mode, setMode] = useState<Mode>('in')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(''); const [ok, setOk] = useState(false); const [busy, setBusy] = useState(false)
  useEffect(() => { const e = new URLSearchParams(location.search).get('error'); if (e) setMsg(e) }, [])
  const sb = createClient()
  const note = (m: string, good = false) => { setMsg(m); setOk(good) }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); note('')
    if (mode === 'up') {
      const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${location.origin}/auth/callback` } })
      if (error) note(error.message)
      else if (data.session) location.href = '/dashboard'
      else note('Check your email and click the confirmation link, then sign in.', true)
    } else if (mode === 'forgot') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset` })
      note(error ? error.message : 'If an account exists for that email, a reset link is on its way.', !error)
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw })
      if (error) note(error.message); else location.href = '/dashboard'
    }
    setBusy(false)
  }
  async function google() {
    note('')
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } })
    if (error) note('Google sign-in is not available right now. Use email instead.')
  }
  const title = mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create your account' : 'Reset your password'
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 64 }}>
      <form className="card" onSubmit={submit}>
        <h2>{title}</h2>
        {mode !== 'forgot' && <><button type="button" className="btn alt" style={{ width: '100%', margin: '4px 0 12px' }} onClick={google}>Continue with Google</button>
          <p className="mu" style={{ textAlign: 'center', margin: '0 0 4px' }}>or use email</p></>}
        <label htmlFor="e">Email</label><input id="e" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        {mode !== 'forgot' && <><label htmlFor="p">Password (8+ characters)</label>
          <input id="p" type="password" required minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} /></>}
        {msg && <p role="alert" className={ok ? 'ok' : 'wa'}>{msg}</p>}
        <button className="btn" disabled={busy}>{mode === 'in' ? 'Sign in' : mode === 'up' ? 'Create account' : 'Send reset link'}</button>
        <div style={{ marginTop: 12 }} className="mu">
          {mode === 'in' && <><a href="#" onClick={e => { e.preventDefault(); setMode('forgot'); note('') }}>Forgot password?</a> · </>}
          <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'up' ? 'in' : mode === 'in' ? 'up' : 'in'); note('') }}>{mode === 'in' ? 'Create an account' : 'Back to sign in'}</a>
        </div>
      </form>
    </main>
  )
}
