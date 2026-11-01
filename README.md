<div align="center">

<img src="public/logo.jpeg" alt="Bhaai PDFs handprint logo" width="88" />

# BHAAI PDFS · LIBRARY

### Your next exam. Our shared notes.

Free study materials. A little less searching. A lot more studying.

![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Storage-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-111111?style=flat-square&logo=vercel)

**BY STUDENTS. FOR STUDENTS.**

[Explore the source](https://github.com/loki0406/bhaai-pdfs-library) · [Contact Bhaai](mailto:srisatyalokesh80@gmail.com)

</div>

---

## One adda for your next exam

Bhaai PDFs brings academic PDFs, exam answers, revision notes and useful documents into one shared library. Visitors can browse and download without creating an account.

| On the shelf | What you’ll find |
| --- | --- |
| **Mid-1 & Mid-2 PDFs** | Materials organised by exam and subject |
| **Semester PDFs** | Resources for semester exam revision |
| **Other important documents** | Useful materials beyond the exam shelf |
| **Bhaai Tweet & Notes** | Read-only updates and reminders from Bhaai’s desk |

## Built to make studying easier

- **Find it quickly:** choose an exam category, pick a subject and browse its materials, with the newest files first.
- **Read, download, share:** preview eligible PDFs, keep files offline and share material links with WhatsApp study groups.
- **Know your way back:** subject navigation, breadcrumbs and Back buttons, including a return from the Notes feed.
- **Make it yours:** light and dark themes with a saved browser preference.
- **Ask Bhaai:** a local website guide that helps find loaded materials and explains how the library works. It does not read PDFs or call an AI service.
- **Get help:** a dedicated Contact Bhaai card opens an email for website, download or material-link issues.

## The look & feel

The original handprint identity meets **Syne** headings, **Instrument Sans** body text, charcoal surfaces, coral highlights and teal accents. Illustrated shelves, rounded cards and responsive layouts keep the experience consistent across phones and desktops. Animations respect reduced-motion preferences.

## Add a document through GitHub

Place an intended public file in this structure:

```text
public/materials/
└── 4-1/
    └── Reinforcement-Learning/
        └── Mid-2/
            └── Your PDF.pdf
```

Use `Mid-1`, `Mid-2`, `Semester` or `General` for the category folder. Subject-folder hyphens become spaces. Commit to `main`; the catalogue generator indexes the files during the next deployment, so you do not need to create cards manually.

Keep each file at **20 MiB or less**. Existing Supabase installations must run `supabase/upload-limit-20mb.sql` once to update both the storage bucket and database size constraint. Publish only materials you own or have permission to distribute. GitHub files are managed in GitHub; database-backed uploads are stored separately in Supabase. Public file URLs are not protected documents.

## A small footer, a shared journey

The community section follows these **2026 dates in Indian Standard Time**, including when the page remains open:

| Dates | Footer experience |
| --- | --- |
| Through 5 November | Link to the separate fundraising website |
| 6–9 November | Contribution thank-you, confetti and a Celebrate button |
| 10–14 November | Community section hidden |
| 15–27 November | 4-1 semester exam wishes; Thank you button releases floating hearts |
| 28–30 November | Exam-completion note celebrating another B.Tech milestone |
| From 1 December | Community section hidden |

The Contact Bhaai card stays available independently of this schedule. Payments are handled on the separate fundraising website, not inside this library.

## Under the hood

| Layer | Technology |
| --- | --- |
| Interface | HTML, CSS and JavaScript modules |
| Build | Vite |
| Public catalogue | Build-time JSON generated from GitHub materials |
| Published resources & notes | Supabase database and storage |
| Hosting | Vercel |

```text
src/                 Interface, navigation, notes and scheduled messages
public/materials/    GitHub-managed public study files
public/covers/       Illustrated shelf artwork
scripts/             Catalogue generation
api/                 Serverless endpoints
supabase/            Database migrations and access policies
tests/               Behaviour checks
```

## Run locally

```bash
npm install
cp .env.example .env
# Configure the public Supabase project URL and publishable key locally.
npm run dev
```

Generate the catalogue before local browsing if materials changed:

```bash
node scripts/catalogue.mjs
```

Verify and build:

```bash
npm run check
npm test
npm run build
```

For Vercel, use the **Vite** preset, `npm run build` and the `dist` output directory. Configure the public Supabase variables from `.env.example` in the deployment environment. Database features require the repository’s applicable migrations and access policies. Never place secret or service-role keys in browser variables or commit credentials.

## A note on the materials

These resources are study aids for revision. Verify answers against your syllabus and official course material. No invented download counts or analytics are used. Ask Bhaai’s conversation stays in the current page session.

---

<div align="center">

**Made with care. Shared for free.**

Having an issue? [Contact Bhaai ↗](mailto:srisatyalokesh80@gmail.com)

</div>
