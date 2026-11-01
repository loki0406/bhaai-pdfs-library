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
5. Open the website → Admin Login → sign in using your email or existing username and your password. Upload a document, verify that it appears publicly, preview/download it, and test WhatsApp sharing.

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


### BHAAI ADDA and read-only notes

The public interface is identical for all visitors. There are no student accounts, reaction buttons, comment forms, anonymous sign-ins, or public post composers. The Admin Login option opens `/adda.html`. Only the verified admin can enter BHAAI ADDA. Signing in or out never adds management controls to the public library.

Run `supabase/setup.sql`, `supabase/notes.sql`, then **`supabase/adda.sql`** in the Supabase SQL Editor. Existing installations need only `adda.sql`. It adds publication/preview/download flags and revokes old visitor reaction permissions without deleting historical data. Disable Anonymous Sign-ins; they are no longer needed. Keep public signups disabled. Retain the existing approved `library_admins` membership and your own admin credentials.

BHAAI ADDA supports upload, edit metadata, publish/hide, show/hide preview and download buttons, delete uploaded materials, publish notes and delete notes. Changes reach visitors on refresh or within 60 seconds (notes within 30 seconds while the feed is open). GitHub materials remain managed in GitHub and appear after deployment. Hiding a listing or download button does not revoke an existing public file URL: this library serves public study materials, not protected documents.

The dashboard uses the existing handprint, Syne/Instrument Sans, charcoal/coral/teal palette, responsive navigation, entrance transitions and reduced-motion support. The public library design, illustrated shelves, subject navigation, Back buttons, theme toggle, guide, previews and sharing are preserved.

Validation after deployment: sign in from Admin Login, confirm a non-admin cannot manage content, upload a test document, edit and hide/publish it, verify public visibility in a private window, toggle preview/download buttons, publish/delete a note, delete the test material, sign out and reopen `/adda.html`. Public visitors must never see admin tools or like/comment controls.
