# Bhaai PDFs — free study library

A responsive library using the original Bhaai handprint logo, Syne / Instrument Sans typography, coral and teal accents, and dark glass panels. No payment integration. Visitors need no account.

## Deploy on Vercel

1. Import `loki0406/bhaai-pdfs-library` as a new Vercel project. Framework: Vite. Build: `npm run build`. Output: `dist`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using the values in `.env.example`. These are public browser credentials, not secret keys. Do not add a service-role key.
3. Deploy. Environment changes require a fresh deployment.

## Supabase setup (required for Bhaai Adda)

1. Open your project SQL Editor and run `supabase/setup.sql` (the main transaction).
2. Authentication → Users → Add user. Email: `srisatyalokesh80@gmail.com`. Set your own strong password and confirm the email. Do not send the password to anyone.
3. Run this SQL after creating the user:

```sql
insert into public.library_admins(user_id)
select id from auth.users
where lower(email)='srisatyalokesh80@gmail.com' and email_confirmed_at is not null
on conflict do nothing;
```

4. Disable public signups in Supabase Authentication settings if not needed. Public visitors do not need authentication.
5. Open the website → Bhaai Adda → sign in using `bhaaiadmin` (or your email) and your password. Upload a document, verify that it appears publicly, preview/download it, and test WhatsApp sharing.

Only user IDs explicitly in `library_admins` can upload/delete. A matching email or username alone never grants admin access. Reset a forgotten admin password securely through the Supabase dashboard. Auth sessions use Supabase's standard browser persistence; sign out on shared devices.

## Add materials through GitHub

Upload files using this folder structure, then commit to main:

```
public/materials/4-1/Reinforcement-Learning/Mid-2/Your PDF.pdf
```

Use `Mid-1`, `Mid-2`, `Semester`, or `General` as the category folder. Subject hyphens become spaces. Vercel rebuilds from main and automatically indexes every file; no manual card editing. Each file must be <=10 MiB (10,485,760 bytes). Keep only intended public documents in this folder. Use Supabase uploads when you want descriptions and explicit unit labels. Exam-to-unit mappings have deliberately not been invented.

The provided sample is listed under 4-1 / Reinforcement Learning / Mid-2; move its folder if the semester is different. Uploaded files are stored in Supabase, not committed back to GitHub. GitHub files are managed through GitHub; Supabase uploads can be removed through Bhaai Adda. Storage quotas depend on your plan; check usage as your collection grows.

## Fundraising footer

`GET /api/fundraiser` reads the support site's public campaign API. Once `mode` is `live` and `raised >= goal`, the donation link is replaced by a thank-you message. No test payments count. If the campaign API is unavailable, the footer retains the support link; change the footer manually if the fundraising backend is retired. This check does not run in the local Vite dev server; it runs on Vercel. No payments are processed on this website.

## Local development and checks

```
npm install
cp .env.example .env
node scripts/catalogue.mjs
npm run dev
npm run check
npm run build
```

Manual acceptance: search/filter empty states, PDF preview, file download, shared material URL, mobile navigation, unauthenticated upload rejection, admin upload/delete, >10 MB rejection, fundraiser live completion. Preview/download only materials you have the right to distribute. No analytics or invented download counts.
