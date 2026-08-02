import { Request, Response, NextFunction } from 'express';
import { createServerSupabase } from '../lib/supabaseClient';

/**
 * Express middleware that requires the current user to have role 'manager'.
 * It expects authentication middleware earlier in the chain to set req.user with at least { email }.
 * If your project stores session differently, adapt to use req.session or req.auth.
 */
export async function requireManager(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user || !user.email) return res.status(401).json({ error: 'Not authenticated' });

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('email', user.email.toLowerCase())
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching profile for requireManager:', error);
      return res.status(500).json({ error: 'Internal error' });
    }

    if (!data || data.role !== 'manager') {
      return res.status(403).json({ error: 'Requires manager role' });
    }

    next();
  } catch (err) {
    console.error('requireManager middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
