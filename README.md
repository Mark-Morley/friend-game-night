# Co-op Lobby

A private game-night planner for friends. Create upcoming sessions, set the game/platform/time and player limit, and let friends claim a spot with their gamer tag.

## Run locally

1. Install Node.js 20 or newer.
2. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
3. Copy `.env.example` to `.env.local`.
4. Set `SITE_PASSWORD` to a long, private crew password.
5. Set `SESSION_SECRET` to a random value of at least 32 characters.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project settings. Keep the service-role key secret; it must only be used by the server.
7. Run `npm install`, then `npm run dev`.

The app runs at http://localhost:3000. Only the private password gate is public; the database is accessed through server routes. The shared password grants every friend access to the same lobby, including the ability to create game nights.

## Deploy to Vercel

Import this repository in Vercel, add the four environment variables above to the project settings, then deploy. Use the same Supabase database and SQL schema for production. Redeploy after changing environment variables.

The shared-password screen is a friendly private-lobby gate, not individual accounts. Anyone who knows the password can access the lobby; use a unique password shared only with your friends.
