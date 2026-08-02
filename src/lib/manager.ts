import { createServerSupabase } from './supabaseClient';

const MANAGER_EMAIL = process.env.MANAGER_EMAIL?.toLowerCase();

/**
 * Ensure the given email has a profile with role = 'manager' in Supabase profiles table.
 * This function performs an upsert into the 'profiles' table (common pattern).
 * Adjust the table name/columns if your project uses a different schema.
 */
export async function ensureManagerProfile(email: string) {
  if (!MANAGER_EMAIL) throw new Error('MANAGER_EMAIL must be set in env');
  if (email.toLowerCase() !== MANAGER_EMAIL.toLowerCase()) return null;

  const supabase = createServerSupabase();

  // Upsert into `profiles` table. Change to your table name if different (e.g., `users`).
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ email: email.toLowerCase(), role: 'manager' }, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('Failed to upsert manager profile in Supabase:', error);
    throw error;
  }
  return data;
}

/**
 * Check if a given email is the configured manager email.
 */
export function isConfiguredManager(email?: string | null) {
  if (!email) return false;
  if (!MANAGER_EMAIL) return false;
  return email.toLowerCase() === MANAGER_EMAIL.toLowerCase();
}
