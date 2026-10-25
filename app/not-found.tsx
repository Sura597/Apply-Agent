import Link from 'next/link'
export default function NotFound() {
  return <main className="wrap" style={{ paddingTop: 64 }}><h2>Page not found</h2><Link href="/">Go to the home page</Link></main>
}
