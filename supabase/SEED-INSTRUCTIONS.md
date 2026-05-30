# How to seed sample data

After deploying the auth foundation, follow these steps to get a test family + patient + visit summary to view in `/portal`:

1. Go to https://nursing-project-olive.vercel.app/en/login
2. Enter your real email address. Click Send.
3. Check your email. Click the magic link.
4. You should land on `/portal` and see "Welcome, your-email".

At this point the portal is empty (no patients linked to you). Now seed:

5. Go to your Supabase dashboard → Authentication → Users tab. Find your user, copy the UUID.
6. Open `supabase/seed.sql` in this repo. Replace `YOUR_AUTH_USER_ID_HERE` with your UUID.
7. Paste the modified SQL into the Supabase SQL Editor and click Run.
8. Refresh `/portal`. You should now see the test patient "Mariam".

To wipe the seed: in the SQL Editor, run `truncate public.families cascade;` — that cascades to memberships, patients, cases, visits, summaries.
