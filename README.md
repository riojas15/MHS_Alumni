# Laredo Martin High School Alumni Directory

A private, moderated alumni directory designed for approximately 500 alumni.

## Features

- Email/password member authentication through Supabase Auth
- Email verification
- Administrator approval before a profile appears in the directory
- Search by name/city and graduation year
- Member-controlled visibility for street address, phone, and email
- Private in-app member-to-member messaging without exposing email addresses
- Block/report can be added as a follow-up moderation feature
- Administrator dashboard for pending registrations
- GitHub Pages deployment with GitHub Actions

## Architecture

GitHub Pages hosts the static HTML/CSS/JavaScript. Supabase provides authentication and PostgreSQL storage. Row Level Security (RLS) is used to protect the data.

## Setup

### 1. Create a Supabase project

Create a project at https://supabase.com/.

In Authentication settings:
- Enable Email provider.
- Require email confirmation.
- Set the Site URL to your eventual GitHub Pages URL.
- Add the same URL under Redirect URLs if needed.

### 2. Create the database

Open the Supabase SQL Editor and run:

`sql/schema.sql`

### 3. Create the first administrator

First create your own account through `register.html` after the site is deployed (or use Supabase Authentication > Users).

Then in Supabase SQL Editor run:

```sql
insert into public.admins (user_id)
values ('YOUR-AUTH-USER-UUID');
```

Replace the UUID with your own Auth user ID.

### 4. Configure the website

Open `js/config.js` and replace:

```js
export const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
export const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";
```

Use the Project URL and publishable key from the Supabase project settings. Never use a service-role or secret key in this file.

### 5. Put the files in GitHub

Create a new repository, for example:

`laredo-martin-alumni`

Upload all files in this project and push them to the `main` branch.

### 6. Enable GitHub Pages

In the repository:
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions.

The included `.github/workflows/deploy.yml` will deploy the site.

### 7. Configure Supabase redirect URL

Once GitHub gives you the Pages URL, add it to Supabase Authentication URL Configuration.

Example:

`https://YOUR-GITHUB-USERNAME.github.io/laredo-martin-alumni/`

Also add the relevant page URL used after email verification if your configuration requires it.

## Important security notes

- Do not put Supabase secret/service-role keys in browser JavaScript.
- Keep RLS enabled.
- The repository contains no alumni data.
- Approved directory data lives in Supabase, not GitHub Pages.
- GitHub Pages itself is public; the sensitive database is not.
- This starter intentionally keeps member-to-member messages inside the application rather than sending a recipient's email address to another member.

## Privacy model

Each member independently controls:
- Full street address visibility
- Phone visibility
- Email visibility
- Whether private messages are accepted

Name, graduation year, and city/state are available to approved members according to the current directory UI. If you want these to be individually switchable too, add the corresponding fields/policies before launch.

## Before real-world use

For a production alumni directory, add:
- Block member
- Report message/member
- Admin message moderation
- Rate limiting / anti-abuse controls
- Account deletion
- Privacy policy and terms
- Data export/deletion request workflow
- Optional CAPTCHA or email-domain/invitation verification

This is a functional starter, not a substitute for a formal security/privacy review.
