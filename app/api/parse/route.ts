import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractText, getDocumentProxy } from 'unpdf'
import mammoth from 'mammoth'

export const runtime = 'nodejs'
export const maxDuration = 30
const MAX_BYTES = 4 * 1024 * 1024 // Vercel request bodies are limited to ~4.5 MB
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

export async function POST(req: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return fail('Not signed in', 401)

  let file: FormDataEntryValue | null
  try { file = (await req.formData()).get('file') } catch { return fail('Upload a PDF or DOCX file.') }
  if (!(file instanceof File)) return fail('Upload a PDF or DOCX file.')
  if (file.size === 0 || file.size > MAX_BYTES) return fail('File must be under 4 MB.')

  const buf = new Uint8Array(await file.arrayBuffer())
  const head = String.fromCharCode(...buf.slice(0, 4))
  let text = ''
  try {
    if (head.startsWith('%PDF')) {
      const pdf = await getDocumentProxy(buf)
      if (pdf.numPages > 15) return fail('That PDF has too many pages for a resume (max 15).')
      text = (await extractText(pdf, { mergePages: true })).text
    } else if (head.startsWith('PK')) {
      text = (await mammoth.extractRawText({ buffer: Buffer.from(buf) })).value
    } else {
      return fail('Only PDF and DOCX files are supported.')
    }
  } catch {
    return fail('Could not read that file. It may be damaged or password-protected. Paste the text instead.')
  }

  text = text.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  if (text.length < 100) return fail('No readable text found. Scanned or image-only PDFs can’t be read yet. Paste the text instead.', 422)
  return NextResponse.json({ text: text.slice(0, 30000), truncated: text.length > 30000 })
}
