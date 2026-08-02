# Manager Role Integration (Supabase)

This PR adds helper utilities and a seed script to create a manager user in Supabase and protect server routes for manager-only access.

What was added
- .env.example: added SUPABASE_* and MANAGER_* variables
- src/lib/supabaseClient.ts: helper to create server/browser clients
- src/lib/manager.ts: helper to upsert manager profile
- src/middleware/requireManager.ts: Express middleware to protect manager routes
- src/components/ManagerPanel.tsx: React component to show manager UI
- scripts/seedManager.ts: seed script using Supabase admin API to create the manager account

How to use
1. Copy `.env.example` to `.env` and fill in real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role key required for the seed script).
2. Run the seed script (after building if TS project):
   MANAGER_EMAIL=cleopatra.manger@gmail.com MANAGER_PASSWORD=aammss2010 SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seedManager.js

3. Integrate ensureManagerProfile(email) into your login flow. Example (pseudo):

   import { ensureManagerProfile } from '../lib/manager';

   // After verifying credentials:
   await ensureManagerProfile(user.email);

4. Use `requireManager` middleware for any admin routes in your Express server.

Security notes
- Do NOT commit real keys. `.env.example` is only an example.
- The seed script requires the service role key — keep it secret and rotate if leaked.
- For stronger security consider enabling password reset and forcing password change on first login.
