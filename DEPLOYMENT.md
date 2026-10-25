# Deploy and test CareerPilot AI (about 30 minutes)

You need free accounts at GitHub, Supabase, Vercel, Google Cloud, and an Anthropic API key (console.anthropic.com, paid per use; add a small spending limit).

## Part 1: Put the code on GitHub
1. Unzip `careerpilot.zip`. Open the `careerpilot` folder.
2. On github.com click **New repository**, name it `careerpilot`, set it to **Private**, create it.
3. In a terminal inside the folder:
   ```
   git init && git add . && git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/careerpilot.git
   git push -u origin main
   ```
   (`.env` files are git-ignored. Never commit keys.)

## Part 2: Supabase (database and login)
1. supabase.com → **New project**. Pick a region near your users and a strong database password.
2. **SQL Editor → New query**, paste all of `supabase/schema.sql`, click **Run**. You should see "Success".
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key. (Never use the `service_role` key in this app.)
4. **Authentication → Providers → Email**: keep it enabled and keep **Confirm email** on.

## Part 3: Vercel
1. vercel.com → **Add New → Project** → import your GitHub repo. Framework is detected as Next.js.
2. Under **Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
   - `ANTHROPIC_API_KEY` = your Anthropic key
   - `ANTHROPIC_MODEL` = `claude-sonnet-4-6`
   - `AI_DAILY_LIMIT` = `20`
3. Click **Deploy**. Note your URL, e.g. `https://careerpilot-xyz.vercel.app`.

## Part 4: Tell Supabase your live URL
**Authentication → URL Configuration**
- **Site URL**: `https://careerpilot-xyz.vercel.app`
- **Redirect URLs**: add `https://careerpilot-xyz.vercel.app/**` and `http://localhost:3000/**`

Without this, confirmation emails and Google sign-in will fail.

## Part 5: Enable "Continue with Google"
1. console.cloud.google.com → create a project → **APIs & Services → OAuth consent screen**: choose **External**, fill app name and your email, save. (While in "Testing" mode, add your own Google address under **Test users**, or click **Publish app** so anyone can sign in.)
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Under **Authorized redirect URIs** add the callback shown in Supabase at **Authentication → Providers → Google** (it looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
4. Copy the Client ID and Client Secret into that same Supabase Google provider page, enable it, save.

## Part 6: Test it as an end user
Open your Vercel URL in a private/incognito window.

| # | Do this | Expect |
|---|---------|--------|
| 1 | Click **Get started → Create an account** with a real email and password | "Check your email" message |
| 2 | Open the email, click the link | You land on the dashboard |
| 3 | Sign out, then **Continue with Google** | You land on the dashboard |
| 4 | Sign out, click **Forgot password?**, use the emailed link | "Choose a new password" page, then dashboard |
| 5 | Profile: fill details, upload a PDF or DOCX resume | Text fills the box. Fix errors, click **Save profile**, see "Profile saved." |
| 6 | Reload the page | Your profile and resume are still there |
| 7 | Jobs: paste a real job description, **Import job** | Job appears; pasting it again says "already imported" |
| 8 | Analyze → **Analyze fit** | Score, method, supported/missing skills with evidence |
| 9 | Tailor → **Generate tailored resume** | Resume, change report with sources, and questions it didn't guess |
| 10 | Edit the text, **Approve for use**, **Download .txt** | File downloads; status becomes Ready to Apply |
| 11 | Cover letter → generate | Letter appears and is editable |
| 12 | Tracker: change a status | Job moves groups; persists after reload |
| 13 | Account → **Export all data** | JSON file downloads |

**Privacy test (important):** create a second account in another browser. It must show no jobs or resume from the first account.

**Limit test:** set `AI_DAILY_LIMIT` to `2` in Vercel, redeploy, run three AI actions. The third should show the daily-limit message. Set it back afterwards.

## Troubleshooting
- **Email or Google link goes to localhost or errors:** fix Site URL and Redirect URLs (Part 4).
- **"AI service error":** check `ANTHROPIC_API_KEY`, billing, and Vercel → Deployments → Functions logs.
- **Scanned PDF won't extract:** it's image-only. Paste the text instead.
- **Confirmation emails slow or limited:** Supabase's built-in mailer is rate-limited. For real traffic add SMTP (e.g. Resend) under Authentication → SMTP Settings.
- **Changed an environment variable:** redeploy for it to take effect.

## Before you invite real users
- Set up custom SMTP in Supabase.
- Add a spending limit at Anthropic and keep `AI_DAILY_LIMIT` low.
- Add a privacy policy page: you store resumes and send their text to Anthropic for processing.
- Optionally add your own domain in Vercel → Settings → Domains, then update Supabase URLs again.
