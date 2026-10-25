import './globals.css'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'CareerPilot AI', description: 'Tailor your resume to each job, honestly, and track every application.' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
