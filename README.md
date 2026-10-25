# CareerPilot AI

Next.js 15 + Supabase (auth, Postgres, row-level security) + Anthropic API, deployable on Vercel.

## Setup and deployment
See **DEPLOYMENT.md** for the full step-by-step guide (GitHub, Supabase, Google sign-in, Vercel, and an end-user test checklist).

Local run: `cp .env.example .env.local`, fill it in, then `npm install && npm run dev`.

## Resume upload
`/api/parse` extracts text from PDF (unpdf) and DOCX (mammoth) on the server. It requires sign-in, checks file signatures, limits size to 4 MB and PDFs to 15 pages, and never stores the file. Users review the extracted text before saving.

## Security model
- Every table has RLS; users can only read and write their own rows. The browser only ever holds the anon key.
- `/api/ai` verifies the session, enforces a per-user daily limit (`AI_DAILY_LIMIT`), caps input size, and treats job text as untrusted.
- The AI prompt forbids fabricated claims, and each change is returned with its source from your resume.
- Security headers are set in `next.config.mjs`. Enabling email confirmation in Supabase Auth is recommended.

## Not included (needs a separate service)
WhatsApp Cloud API webhooks, OCR for scanned PDFs, and automated form submission on job portals. Applications are submitted by the user.
