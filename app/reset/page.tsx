'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Reset() {
  const [pw, setPw] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('')
    const { error } = await createClient().auth.updateUser({ password: pw })
    if (error) { setMsg(error.message); setBusy(false) } else location.href = '/dashboard'
  }
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingTop: 64 }}>
      <form className="card" onSubmit={submit}>
        <h2>Choose a new password</h2>
        <label htmlFor="p">New password (8+ characters)</label>
        <input id="p" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} />
        {msg && <p role="alert" className="wa">{msg}</p>}
        <button className="btn" disabled={busy}>Save password</button>
      </form>
    </main>
  )
}
