# Laredo Martin High School Alumni Directory

Private, moderated alumni directory for approximately 500 alumni.

## Current security model

- Email/password authentication with email confirmation.
- Registration creates a `pending` profile automatically in the database, even when the browser has no authenticated session yet.
- Only administrators can approve or reject a profile.
- Only approved members can access the directory RPC.
- The database, not the browser UI, enforces address/phone/email visibility choices.
- Private messaging never exposes a recipient's email address.
- Regular members cannot directly select other members' profile rows.
- Regular members cannot change their own approval status.
- Message ownership/content cannot be changed through a general UPDATE policy.

## Supabase setup

1. In Supabase **Authentication ? URL Configuration** set **Site URL** to:

   `https://riojas15.github.io/MHS_Alumni/`

2. Add this Redirect URL:

   `https://riojas15.github.io/MHS_Alumni/**`

3. Enable the Email provider and require email confirmation.

4. Open **SQL Editor** and run `sql/schema.sql` in its entirety. It is safe to run against the existing starter schema because the policies, triggers and functions are recreated as needed.

5. Create your own account through the deployed registration page and confirm your email.

6. In **Authentication ? Users**, copy your user's UUID.

7. In SQL Editor make yourself the first administrator:

```sql
insert into public.admins (user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

8. In `js/config.js`, verify the Supabase **Project URL** and **publishable key**. Do not use the REST endpoint URL and never put a secret/service-role key in browser code.

## GitHub Pages

The intended Pages URL is:

`https://riojas15.github.io/MHS_Alumni/`

GitHub deploys the repository to GitHUb Pages. In GitHub, use **Settings >> Pages >> Build and deployment >> Source >> Deploy from a branch.**

## Important

The `profiles` table intentionally does **not** grant approved members broad SELECT access. The directory calls `get_directory_profiles()`, which returns only fields allowed by each member's privacy selections. This is important because hiding fields only in JavaScript would not be real privacy.

For production use, consider adding CAPTCHA/rate limiting, block/report controls, account deletion, privacy terms, and a formal security review.
