import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('shared_transactions')
    .select('type, amount, category')
    .eq('shared_account_id', Number(params.id));
  if (error) return NextResponse.json({ summary: null });
  let total_ingresos = 0, total_gastos = 0;
  let category_breakdown: any[] = [];
  (data || []).forEach((t: any) => {
    if (t.type === 'ingreso') total_ingresos += t.amount;
    else total_gastos += t.amount;
    let cat = category_breakdown.find(c => c.category === t.category);
    if (!cat) {
      cat = { category: t.category, amount: 0, count: 0 };
      category_breakdown.push(cat);
    }
    cat.amount += t.amount;
    cat.count++;
  });
  return NextResponse.json({ summary: {
    total_ingresos,
    total_gastos,
    balance: total_ingresos - total_gastos,
    category_breakdown
  }});
}
