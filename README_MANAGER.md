# Manager Role Integration (Supabase)

This PR adds helper utilities and a seed script to create a manager profile in Supabase and protect server routes for manager-only access.

What was added
- .env.example: added SUPABASE_* and MANAGER_EMAIL variable
- src/lib/supabaseClient.ts: helper to create server/browser clients
- src/lib/manager.ts: helper to upsert manager profile
- src/middleware/requireManager.ts: Express middleware to protect manager routes
- src/components/ManagerPanel.tsx: React component to show manager UI
- scripts/seedManager.ts: seed script using Supabase admin API to upsert the manager profile

Changes regarding authentication flow
- The seed script no longer creates a password for the manager account.
- Instead, it upserts a profile row with role='manager' and instructs you to send a magic link (OTP) from the client using the anon key or to use the Supabase dashboard to invite the manager.

How to sign in the manager (magic link / OTP)
- From the client (browser / mobile) using the anon key, send an OTP link to the manager's email:

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await supabase.auth.signInWithOtp({ email: 'cleopatra.manger@gmail.com' });

- The manager will receive an email with a link/code to sign in. Once they sign in, ensure your login flow calls `ensureManagerProfile(user.email)` so the profile is present with role='manager'.

Security notes
- Do NOT commit real keys. `.env.example` is only an example.
- The seed script requires the service role key — keep it secret and rotate if leaked.
