#!/usr/bin/env node
/**
 * scripts/seedManager.ts
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/scripts/seedManager.js
 *
 * This script upserts a profile row with role = 'manager' for the configured MANAGER_EMAIL
 * in the `profiles` table. It intentionally does NOT create an auth user with a password.
 *
 * To sign the manager in, use Supabase's magic link / OTP flow from the client:
 *   await supabase.auth.signInWithOtp({ email: 'cleopatra.manger@gmail.com' })
 *
 * Or use the Supabase dashboard to invite / send recovery email.
 *
 * WARNING: This script uses the Service Role Key for DB access. Keep it secret.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const managerEmail = process.env.MANAGER_EMAIL;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}
if (!managerEmail) {
  console.error('MANAGER_EMAIL is required');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function run() {
  try {
    // Check if an auth user exists for this email
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const found = allUsers?.find((u: any) => u.email?.toLowerCase() === managerEmail.toLowerCase());

    if (!found) {
      console.log('No auth user found for', managerEmail);
      console.log('This script will not create an auth user with a password.');
      console.log('To let the manager sign in, send a magic link (OTP) from your client app:');
      console.log("  // client-side example (browser)\n  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);\n  await supabase.auth.signInWithOtp({ email: '" + managerEmail + "' });");
      console.log('Or use the Supabase dashboard to invite the user.');
    } else {
      console.log('Auth user already exists:', found.id);
    }

    // Upsert profile with role = 'manager'
    const { error: upsertError } = await supabase.from('profiles').upsert({ email: managerEmail.toLowerCase(), role: 'manager' }, { onConflict: 'email' });
    if (upsertError) throw upsertError;
    console.log('Profile upserted with role=manager');

    console.log('Done. Manager email:', managerEmail);
  } catch (err: any) {
    console.error('Seed manager failed:', err.message || err);
    process.exit(1);
  }
}

run();
