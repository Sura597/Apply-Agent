'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="wrap" style={{ paddingTop: 64 }}><h2>Something went wrong</h2><p className="mu">Your data is safe. Reload the page or try again.</p><button className="btn" onClick={reset}>Try again</button></main>
}
