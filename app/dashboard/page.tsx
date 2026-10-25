import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from './Dashboard'
export default async function Page() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: jobs }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', user.id).single(),
    sb.from('jobs').select('*').order('created_at', { ascending: false }),
  ])
  return <Dashboard email={user.email ?? ''} initialProfile={profile ?? {}} initialJobs={jobs ?? []} />
}
