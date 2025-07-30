import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', `%${q}%`)
      .limit(10);
    if (error) {
      console.error('Supabase user search error:', error);
      return NextResponse.json({ users: [] });
    }
    return NextResponse.json({ users: data || [] });
  } catch (err) {
    console.error('User search error:', err);
    return NextResponse.json({ users: [] });
  }
}
