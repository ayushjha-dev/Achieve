# Achieve — Personal Certificate Archive

**Achieve** is a minimalist, responsive web application designed to act as a private digital vault for professional certificates, academic transcripts, and credentials. Built with Next.js (App Router), Tailwind CSS, and Supabase, it focuses on high typographic elegance, responsive accessibility, and security.

---

## Tech Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/DB/Storage**: [Supabase](https://supabase.com/) (PostgreSQL Database, Supabase Storage, and Supabase Auth)
- **Deployment**: [Vercel](https://vercel.com/) (Free Tier)
- **Icons**: [Lucide React](https://lucide.react.dev/)

---

## Prerequisites & Supabase Setup

To deploy or run this application, you will need a free Supabase account and a free Vercel account.

### 1. Create a Supabase Project
1. Go to the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Select a name, database password, and regional host location closest to your users.

### 2. Database & Storage Migration
1. In your Supabase Dashboard, navigate to the **SQL Editor** tab from the left sidebar.
2. Click **New Query**.
3. Copy the entire contents of the [`supabase_migration.sql`](./supabase_migration.sql) file located in the root of this project and paste it into the editor.
4. Click **Run**. This will:
   - Create the `certificates` database table.
   - Activate Row Level Security (RLS) on the table.
   - Initialize a private `certificates` storage bucket.
   - Set up secure RLS policies ensuring users can only read, upload, write, and delete their own files matching their Auth UUID (e.g. `auth.uid()`).

### 3. Setup Single-User Authentication (Secure Vault)
Since this is a personal, single-user vault, you must restrict signups so external users cannot register.
1. In the Supabase Dashboard, go to **Authentication** -> **Providers** -> **Email**.
2. Toggle **"Allow new users to sign up"** to **OFF** and save.
3. Next, go to **Authentication** -> **Users**.
4. Click **Add User** -> **Create User**.
5. Input the email and password you wish to use to administer your vault. This pre-creates your single authorized account manually.

---

## Local Setup & Development

1. Clone or download this project into your workspace directory.
2. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and paste your Supabase Project credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Can be found under **Project Settings** -> **API** -> **Project URL**.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Can be found under **Project Settings** -> **API** -> **Project API keys** (labelled `anon public`).
   - `SUPABASE_SERVICE_ROLE_KEY`: Can be found under **Project Settings** -> **API** -> **Project API keys** (labelled `service_role secret`). *Note: Do not expose this key client-side.*

4. Install the package dependencies:
   ```bash
   npm install
   ```
5. Spin up the local Next.js server:
   ```bash
   npm run dev
   ```
6. Open your browser to [http://localhost:3000](http://localhost:3000) and sign in using the email and password credentials you created in the Supabase Dashboard.

---

## Deploying to Vercel (Free Tier)

This application is ready to deploy to Vercel out-of-the-box.

### 1. Import Repository
1. Push your project to a GitHub, GitLab, or Bitbucket repository.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
3. Import your repository.

### 2. Configure Environment Variables
In the project configuration pane on Vercel, expand the **Environment Variables** section and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Paste the respective values from your `.env.local` file.

### 3. Deploy
Click **Deploy**. Once compile finishes, your Certificate Vault is live!

---

## Technical Details

- **Direct Storage Uploads**: Uploading files up to 10MB goes directly from the client browser to Supabase Storage. This completely circumvents Vercel's Serverless Function payload size limit (4.5MB), preventing `413 Payload Too Large` issues.
- **Dynamic Signed URLs**: Certificate files are kept in a completely private Supabase Storage bucket. When a user requests to view or download a certificate, a temporary signed URL is generated on-the-fly and is valid for only 60 seconds.
- **Typographic System**: Features a high-contrast pairing of *Cormorant Garamond* (an elegant, bookish serif for headlines and titles) and *Inter* (a clean, crisp sans-serif for dashboard tools and controls).
- **Responsive Layout**: Designed mobile-first, ensuring certificates can be searched, previewed, and downloaded on any tablet or smartphone screen.
