import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params;
  const { data, error } = await supabase
    .from('shared_account_participants')
    .select('id, user_id, guest_name, joined_at')
    .eq('shared_account_id', Number(awaitedParams.id));
  if (error) return NextResponse.json({ participants: [] });
  // Optionally fetch usernames for user_id
  const userIds = data?.filter((p: any) => p.user_id).map((p: any) => p.user_id) || [];
  let usernames: any[] = [];
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, username')
      .in('id', userIds);
    usernames = users || [];
  }
  const participants = (data || []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    guest_name: p.guest_name,
    username: usernames.find((u: any) => u.id === p.user_id)?.username || null,
    joined_at: p.joined_at
  }));
  return NextResponse.json({ participants });
}
