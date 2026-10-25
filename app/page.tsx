import Link from 'next/link'
export default function Home() {
  return (
    <main className="wrap" style={{ paddingTop: 72 }}>
      <h1>Apply with a resume that matches the job, and only says what’s true.</h1>
      <p className="mu" style={{ maxWidth: 560 }}>Paste a job. CareerPilot scores your fit with the evidence shown, rewrites your resume from your real experience, lists every change with its source, and tracks the application. You approve everything before you use it.</p>
      <Link className="btn" href="/login" style={{ display: 'inline-block', textDecoration: 'none' }}>Get started</Link>
    </main>
  )
}
