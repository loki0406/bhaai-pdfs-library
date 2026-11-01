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
5. Open the website → Bhaai Adda → sign in using your email or existing username and your password. Upload a document, verify that it appears publicly, preview/download it, and test WhatsApp sharing.

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

## Themes and Ask Bhaai

The horizontal sun/moon control switches the entire interface, including dialogs and chat. The selected theme is saved only in this browser’s local storage; dark is the initial default.

Ask Bhaai is a free, local website guide with a floating chat panel. It answers common website questions, searches loaded catalogue titles and subjects, and links users to materials or Bhaai Adda. It does not call an AI service or read PDF contents. Conversation history exists only while the page is open and is not stored or sent anywhere. Fundraising suggestions respect the footer’s live completion status. No new environment variables or database changes are required.


### Illustrated shelves and Bhaai Tweet & Notes

Run `supabase/notes.sql` in the same Supabase project after the original setup. It is safe to rerun. Enable **Authentication → Providers → Anonymous Sign-ins** for visitor likes/comments. Visitors never receive post or moderation permissions. Admin access still requires membership in `library_admins`.

Open Bhaai Tweet & Notes, then sign in through Bhaai Adda to reveal the post composer and remove-comment controls. Public visitors can read, like/unlike once per browser account, and comment with a display name. Anonymous accounts are not verified identities and can be replaced by clearing browser data. Comments have a 15-second per-account throttle; enable Supabase CAPTCHA protection if public spam develops. Feed loads the latest 50 posts. No mock posts or reactions are shown.

Library navigation: four illustrated shelves → subject → materials. The first three shelves share subject names already found in the catalogue; Other Imp Documents opens its documents directly. Include your actual course code in the subject field (for example `Subject name · course code`). The full prior course list was unavailable, so no codes were invented. Add materials to populate more subjects. New uploads are refreshed for other visitors within a minute. NEW appears only on the newest material across the entire catalogue; the next upload takes the badge. PDF/image/text previews use the browser; Office document previews use Microsoft’s public Office viewer and may depend on that service. ZIP files are download-only.

Generated card covers are in `public/covers/`: mid1.webp, mid2.webp, semester.webp, other.webp, notes.webp. Built-in image generation used a charcoal studio backdrop, sculptural cream paper, coral and teal highlights: single notebook; paired notebooks; textbook/graduation cap; document folders; reference handprint with a small cream bird in its palm. All files are used locally by the website.

Validate after deployment: open each shelf, open a subject and preview/download/share a material; upload a newer document and confirm the old NEW badge disappears; confirm the login is blank; publish a note as admin; in a private window like/comment and verify no post composer; as admin remove that comment. Anonymous Sign-ins and the SQL migration are manual project setup steps and were not executed by the code update.
