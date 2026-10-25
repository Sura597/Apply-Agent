'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = ['Job Imported','Analysis Complete','Resume Generated','Awaiting Review','Ready to Apply','Application In Progress','Submitted','Submission Failed','Manual Action Required','Interview','Rejected','Offer','Withdrawn']
const PF: [string, string][] = [['full_name','Full name'],['email','Email'],['phone','Phone'],['location','Location'],['years_exp','Years of experience']]
type Job = Record<string, any>

export default function Dashboard({ email, initialProfile, initialJobs }: { email: string; initialProfile: Record<string, any>; initialJobs: Job[] }) {
  const sb = createClient()
  const [tab, setTab] = useState('Profile')
  const [p, setP] = useState(initialProfile)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [sel, setSel] = useState<string | null>(null)
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState('')
  const [nj, setNj] = useState({ title: '', company: '', url: '', jd: '' })
  const job = jobs.find(j => j.id === sel)
  const setJob = (j: Job) => setJobs(js => js.map(x => (x.id === j.id ? j : x)))

  async function saveProfile() {
    const { id, updated_at, ...rest } = p
    const { error } = await sb.from('profiles').update({ ...rest, updated_at: new Date().toISOString() }).eq('id', id)
    setMsg(error ? 'Could not save profile.' : 'Profile saved.')
  }
  async function uploadResume(f?: File) {
    if (!f) return
    setBusy('parse'); setMsg('')
    const fd = new FormData(); fd.append('file', f)
    const r = await fetch('/api/parse', { method: 'POST', body: fd })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setMsg(d.error ?? 'Could not read that file.')
    else { setP({ ...p, resume_text: d.text }); setMsg(`Text extracted${d.truncated ? ' (shortened to 30,000 characters)' : ''}. Check it for errors, then save your profile.`) }
    setBusy('')
  }
  async function addJob() {
    if (nj.jd.trim().length < 80) return setMsg('Paste the full job description (at least 80 characters). Pages behind logins can’t be read, so pasting is required.')
    const { data, error } = await sb.from('jobs').insert({ ...nj, user_id: p.id }).select().single()
    if (error) return setMsg(error.code === '23505' ? 'This job is already imported.' : 'Could not import job.')
    setJobs([data, ...jobs]); setSel(data.id); setNj({ title: '', company: '', url: '', jd: '' }); setMsg(''); setTab('Analyze')
  }
  async function run(mode: string) {
    if (!job) return
    setBusy(mode); setMsg('')
    const r = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jobId: job.id, mode }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setMsg(d.error ?? 'Something went wrong.'); else setJob(d.job)
    setBusy('')
  }
  async function patch(fields: Job) {
    if (!job) return
    setJob({ ...job, ...fields })
    const { error } = await sb.from('jobs').update(fields).eq('id', job.id)
    if (error) setMsg('Could not save change.')
  }
  async function del() {
    if (!job || !confirm('Delete this job?')) return
    await sb.from('jobs').delete().eq('id', job.id); setJobs(jobs.filter(j => j.id !== job.id)); setSel(null)
  }
  async function exportAll() {
    const blob = new Blob([JSON.stringify({ profile: p, jobs }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'careerpilot-export.json'; a.click()
  }
  function dl(name: string, text: string) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; a.click()
  }
  const List = ({ t, items, c }: { t: string; items?: any[]; c?: string }) => items?.length ? <><h3>{t}</h3><ul>{items.map((i, k) => <li key={k} className={c}>{typeof i === 'string' ? i : Object.values(i).join(' — ')}</li>)}</ul></> : null
  const picker = (
    <div className="card"><label htmlFor="pj">Active job</label>
      <select id="pj" value={sel ?? ''} onChange={e => setSel(e.target.value || null)}><option value="">Select a job…</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.title || 'Untitled'} – {j.company || '?'}</option>)}</select></div>
  )
  const needJob = <p className="mu">Import or select a job first.</p>
  const a = job?.analysis

  return (
    <main className="wrap">
      <div className="row"><h1>CareerPilot AI</h1><span className="mu">{email} <button className="btn alt" onClick={async () => { await sb.auth.signOut(); location.href = '/login' }}>Sign out</button></span></div>
      <div className="tabs" role="tablist">{['Profile','Jobs','Analyze','Tailor','Cover letter','Tracker','Account'].map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => { setTab(t); setMsg('') }}>{t}</button>)}</div>
      {msg && <div className="card wa" role="status">{msg}</div>}

      {tab === 'Profile' && <>
        <div className="card"><h2>Your details</h2><p className="mu">The AI uses only what’s here and in your resume.</p>
          <div className="grid">{PF.map(([k, l]) => <div key={k}><label>{l}<input value={p[k] ?? ''} onChange={e => setP({ ...p, [k]: e.target.value })} /></label></div>)}</div>
          <label>Skills (comma separated)<textarea style={{ minHeight: 70 }} value={p.skills ?? ''} onChange={e => setP({ ...p, skills: e.target.value })} /></label>
          <label>Education and certifications<textarea style={{ minHeight: 70 }} value={p.education ?? ''} onChange={e => setP({ ...p, education: e.target.value })} /></label></div>
        <div className="card"><h2>Resume text</h2><p className="mu">Upload a PDF or DOCX, or paste the text. This is the source of truth for every claim, so correct any extraction errors.</p>
          <label>Upload resume (PDF or DOCX, up to 4 MB)<input type="file" accept=".pdf,.docx" disabled={busy === 'parse'} onChange={e => { uploadResume(e.target.files?.[0]); e.target.value = '' }} /></label>
          {busy === 'parse' && <p className="mu" role="status">Reading file…</p>}
          <textarea style={{ minHeight: 280 }} value={p.resume_text ?? ''} onChange={e => setP({ ...p, resume_text: e.target.value })} />
          <button className="btn" onClick={saveProfile}>Save profile</button></div></>}

      {tab === 'Jobs' && <>
        <div className="card"><h2>Import a job</h2><div className="grid">
          <div><label>Title (optional)<input value={nj.title} onChange={e => setNj({ ...nj, title: e.target.value })} /></label></div>
          <div><label>Company (optional)<input value={nj.company} onChange={e => setNj({ ...nj, company: e.target.value })} /></label></div>
          <div><label>Posting URL (optional)<input type="url" value={nj.url} onChange={e => setNj({ ...nj, url: e.target.value })} /></label></div></div>
          <label>Job description<textarea value={nj.jd} maxLength={20000} onChange={e => setNj({ ...nj, jd: e.target.value })} /></label>
          <button className="btn" onClick={addJob}>Import job</button></div>
        {jobs.length === 0 && <p className="mu">No jobs yet. Paste one above.</p>}
        {jobs.map(j => <button key={j.id} className="job" onClick={() => { setSel(j.id); setTab('Analyze') }}><div className="row"><b>{j.title || 'Untitled'}, {j.company || 'unknown company'}</b><span className="mu">{j.status}</span></div></button>)}</>}

      {tab === 'Analyze' && <>{picker}{!job ? needJob : <>
        <div className="card"><button className="btn" disabled={!!busy} onClick={() => run('analyze')}>{busy === 'analyze' ? 'Analyzing…' : a ? 'Re-run analysis' : 'Analyze fit'}</button>
          <button className="btn alt" onClick={del}>Delete job</button></div>
        {a && <><div className="card"><div className="score">{a.score}<span className="mu">/100</span></div>
          <p className="mu">An estimate of fit against this posting. It is not an employer ATS score or a chance of selection. Method: {a.method}</p>
          {Object.entries(a.breakdown ?? {}).map(([k, v]) => <div key={k}><div className="row"><span>{k}</span><span>{String(v)}</span></div><div className="bar"><i style={{ width: `${Number(v) || 0}%` }} /></div></div>)}</div>
          <div className="card"><List t="Supported by your resume (with evidence)" items={a.supported} c="ok" /><List t="Transferable" items={a.transferable} /><List t="Missing or unverified" items={a.missing} c="er" /><List t="Relevant achievements" items={a.achievements} /><List t="Recruiter concerns" items={a.concerns} c="wa" /><List t="Recommendations" items={a.recommendations} /></div></>}</>}</>}

      {tab === 'Tailor' && <>{picker}{!job ? needJob : <>
        <div className="card"><button className="btn" disabled={!!busy} onClick={() => run('tailor')}>{busy === 'tailor' ? 'Writing…' : job.tailored ? 'Regenerate resume' : 'Generate tailored resume'}</button></div>
        {job.tailored && <>
          <div className="card"><h2>Tailored resume (editable)</h2>
            <textarea style={{ minHeight: 380 }} value={job.tailored} onChange={e => setJob({ ...job, tailored: e.target.value, approved: false })} onBlur={e => patch({ tailored: e.target.value })} />
            <button className="btn" onClick={() => patch({ approved: true, status: 'Ready to Apply' })}>{job.approved ? 'Approved ✓' : 'Approve for use'}</button>
            <button className="btn alt" onClick={() => dl('resume.txt', job.tailored)}>Download .txt</button></div>
          <div className="card"><h2>Change report</h2>{(job.changes ?? []).map((c: any, i: number) => <div key={i} style={{ marginBottom: 10 }}><b>{c.change}</b><div className="mu">Addresses: {c.addresses}</div><div className="mu">Source: {c.source}</div></div>)}
            <List t="The AI needs your input (it did not guess)" items={job.questions} c="wa" /></div>
          <div className="card"><h2>Original and tailored</h2><div className="grid"><div><b>Original</b><pre>{p.resume_text}</pre></div><div><b>Tailored</b><pre>{job.tailored}</pre></div></div></div></>}</>}</>}

      {tab === 'Cover letter' && <>{picker}{!job ? needJob : <div className="card">
        <button className="btn" disabled={!!busy} onClick={() => run('cover')}>{busy === 'cover' ? 'Writing…' : 'Generate cover letter'}</button>
        {job.cover && <><textarea style={{ minHeight: 300, marginTop: 10 }} value={job.cover} onChange={e => setJob({ ...job, cover: e.target.value })} onBlur={e => patch({ cover: e.target.value })} />
          <button className="btn alt" onClick={() => dl('cover-letter.txt', job.cover)}>Download .txt</button></>}
        <p className="mu">Answer legal, demographic, disability and salary questions yourself on the application form.</p></div>}</>}

      {tab === 'Tracker' && <>{STATUSES.map(s => { const l = jobs.filter(j => j.status === s); return l.length ? <div className="card" key={s}><h2>{s} ({l.length})</h2>
        {l.map(j => <div className="row" key={j.id} style={{ margin: '6px 0' }}><span>{j.title || 'Untitled'}, {j.company || '?'} {j.url && <a href={j.url} target="_blank" rel="noopener noreferrer">posting</a>}</span>
          <select style={{ width: 'auto' }} value={j.status} onChange={async e => { setJob({ ...j, status: e.target.value }); await sb.from('jobs').update({ status: e.target.value }).eq('id', j.id) }}>{STATUSES.map(o => <option key={o}>{o}</option>)}</select></div>)}</div> : null })}
        {jobs.length === 0 && <p className="mu">Nothing tracked yet.</p>}
        <p className="mu">You submit applications yourself. Come back here and update the status.</p></>}

      {tab === 'Account' && <div className="card"><h2>Your data</h2><p className="mu">Stored in your private account. Only you can read it.</p>
        <button className="btn" onClick={exportAll}>Export all data (JSON)</button></div>}
    </main>
  )
}
