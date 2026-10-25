import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow same-site relative paths to prevent open redirects.
const safe = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard')

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = safe(searchParams.get('next'))
  if (code) {
    const sb = await createClient()
    const { error } = await sb.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('That link is invalid or has expired. Please try again.')}`)
}
