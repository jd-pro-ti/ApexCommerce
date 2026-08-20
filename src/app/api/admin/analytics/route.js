import { NextResponse } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase-route';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || !supabaseAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const client = createSupabaseRouteClient(token);
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role, status').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin' || adminProfile.status !== 'active') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { data: payouts, error: payoutsError } = await supabaseAdmin.from('seller_paypal_payouts').select('seller_id, order_id, gross_amount, platform_fee_amount, seller_amount, status, created_at').order('created_at', { ascending: true });
    if (payoutsError) throw payoutsError;
    const valid = (payouts || []).filter((item) => item.status !== 'refunded');
    const orderIds = [...new Set(valid.map((item) => item.order_id).filter(Boolean))];
    const sellerIds = [...new Set(valid.map((item) => item.seller_id).filter(Boolean))];
    const [{ data: items }, { data: sellers }, { count: totalUsers }, { count: totalReports }] = await Promise.all([
      orderIds.length ? supabaseAdmin.from('order_items').select('order_id, seller_id, product_id, product_name, quantity, subtotal, status').in('order_id', orderIds) : { data: [] },
      sellerIds.length ? supabaseAdmin.from('profiles').select('id, name, email').in('id', sellerIds) : { data: [] },
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('seller_reports').select('id', { count: 'exact', head: true }),
    ]);
    const sellerMap = new Map((sellers || []).map((seller) => [seller.id, seller]));
    const productMap = new Map();
    const sellerMapTotals = new Map();
    const monthMap = new Map();
    let grossSales = 0; let platformCommission = 0; let sellerPayout = 0;
    for (const payout of valid) {
      const gross = Number(payout.gross_amount || 0); const commission = Number(payout.platform_fee_amount || 0); const payoutAmount = Number(payout.seller_amount || 0);
      grossSales += gross; platformCommission += commission; sellerPayout += payoutAmount;
      const seller = sellerMap.get(payout.seller_id); const sellerTotal = sellerMapTotals.get(payout.seller_id) || { id: payout.seller_id, name: seller?.name || 'Vendedor', orders: 0, sales: 0, commission: 0, payout: 0 };
      sellerTotal.orders += 1; sellerTotal.sales += gross; sellerTotal.commission += commission; sellerTotal.payout += payoutAmount; sellerMapTotals.set(payout.seller_id, sellerTotal);
      const date = new Date(payout.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }); const monthTotal = monthMap.get(monthKey) || { label: month, sales: 0, commission: 0 }; monthTotal.sales += gross; monthTotal.commission += commission; monthMap.set(monthKey, monthTotal);
    }
    for (const item of items || []) {
      if (item.status === 'cancelled') continue;
      const key = item.product_id || item.product_name; const product = productMap.get(key) || { id: key, name: item.product_name || 'Producto', quantity: 0, sales: 0, commission: 0 };
      product.quantity += Number(item.quantity || 0); product.sales += Number(item.subtotal || 0); product.commission += Number(item.subtotal || 0) * 0.15; productMap.set(key, product);
    }
    const sellerResults = [...sellerMapTotals.values()].map((item) => ({ ...item, sales: Number(item.sales.toFixed(2)), commission: Number(item.commission.toFixed(2)), payout: Number(item.payout.toFixed(2)) })).sort((a, b) => b.sales - a.sales);
    const now = new Date();
    const monthly = Array.from({ length: 6 }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; const item = monthMap.get(key) || { label: date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }), sales: 0, commission: 0 }; return { ...item, sales: Number(item.sales.toFixed(2)), commission: Number(item.commission.toFixed(2)) }; });
    return NextResponse.json({ currency: 'MXN', totals: { grossSales, platformCommission, sellerPayout, orders: orderIds.length, sellers: sellerIds.length, products: productMap.size, users: totalUsers || 0, clients: Math.max(0, (totalUsers || 0) - sellerIds.length - 1), reports: totalReports || 0 }, topSeller: sellerResults[0] || null, monthly, sellers: sellerResults, products: [...productMap.values()].map((item) => ({ ...item, sales: Number(item.sales.toFixed(2)), commission: Number(item.commission.toFixed(2)) })).sort((a, b) => b.sales - a.sales).slice(0, 12) });
  } catch (error) { console.error('Admin analytics failed:', error); return NextResponse.json({ error: error.message || 'No se pudieron cargar las analíticas' }, { status: 500 }); }
}
