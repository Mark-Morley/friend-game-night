# Co-op Lobby

A private game-night planner for friends. Create upcoming sessions, set the game/platform/time and player limit, and let friends claim a spot with their gamer tag.

## Run locally

1. Install Node.js 20 or newer.
2. Create a Supabase project. Open [`supabase/schema.sql`](./supabase/schema.sql), copy the SQL statements from the file, and run those statements in the Supabase SQL Editor. Do not paste the filename or Markdown link itself.
3. Copy `.env.example` to `.env.local`.
4. Set `SITE_PASSWORD` to a long, private crew password.
5. Set `SESSION_SECRET` to a random value of at least 32 characters.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project settings. Keep the service-role key secret; it must only be used by the server.
7. Run `npm install`, then `npm run dev`.

The app runs at http://localhost:3000. Only the private password gate is public; the database is accessed through server routes. The shared password grants every friend access to the same lobby, including the ability to create game nights.

## Deploy to Vercel

Import this repository in Vercel, then open **Project Settings → Environment Variables** and add `SITE_PASSWORD`, `SESSION_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Set them for **Production** (and **Preview** too if testing preview deployments); `.env.local` is only for local development and is not sent to Vercel when you push. Use a private password and a `SESSION_SECRET` of at least 32 characters. Use the server-side Supabase service-role/secret key for `SUPABASE_SERVICE_ROLE_KEY`, not the publishable/anon key. Use the same Supabase database and SQL schema for production. After saving the variables, redeploy the latest deployment.

The shared-password screen is a friendly private-lobby gate, not individual accounts. Anyone who knows the password can access the lobby; use a unique password shared only with your friends.
