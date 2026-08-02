#!/usr/bin/env node
/**
 * scripts/seedManager.ts
 *
 * Usage:
 *   MANAGER_PASSWORD=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/scripts/seedManager.js
 *
 * This script creates or updates the manager user in Supabase using the Admin API.
 * It will:
 *  - Create the auth user (if missing)
 *  - Upsert a profile row with role = 'manager'
 *
 * WARNING: This script uses the Service Role Key. Keep it secret.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const managerEmail = process.env.MANAGER_EMAIL;
const managerPassword = process.env.MANAGER_PASSWORD;

if (!url || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}
if (!managerEmail) {
  console.error('MANAGER_EMAIL is required');
  process.exit(1);
}
if (!managerPassword) {
  console.error('MANAGER_PASSWORD is required');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function run() {
  try {
    // Create auth user if not exists. Using admin API.
    const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const found = existingUser?.find((u: any) => u.email?.toLowerCase() === managerEmail.toLowerCase());

    if (!found) {
      console.log('Creating auth user for manager:', managerEmail);
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: managerEmail,
        password: managerPassword,
        email_confirm: true,
      });
      if (createError) throw createError;
      console.log('Auth user created:', created?.id);
    } else {
      console.log('Auth user already exists:', found.id);
    }

    // Upsert profile with role = 'manager'
    const { error: upsertError } = await supabase.from('profiles').upsert({ email: managerEmail.toLowerCase(), role: 'manager' }, { onConflict: 'email' });
    if (upsertError) throw upsertError;
    console.log('Profile upserted with role=manager');

    console.log('Done. Manager credentials: ', managerEmail);
  } catch (err: any) {
    console.error('Seed manager failed:', err.message || err);
    process.exit(1);
  }
}

run();
