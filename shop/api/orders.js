import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, email } = req.query;

  if (!user_id && !email) {
    return res.status(400).json({ error: 'user_id or email required' });
  }

  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by user_id or email
    if (user_id) {
      query = query.or(`user_id.eq.${user_id},customer_email.eq.${email || ''}`);
    } else if (email) {
      query = query.eq('customer_email', email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch orders:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ orders: data || [] });
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
