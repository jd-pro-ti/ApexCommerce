import 'server-only'

const NON_REVENUE_STATUSES = new Set(['refunded'])

function amount(value) {
  return Number(Number(value || 0).toFixed(2))
}

function csvValue(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function buildEarningsReport(payouts = [], profiles = []) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]))
  const validPayouts = payouts.filter((payout) => !NON_REVENUE_STATUSES.has(payout.status))
  const bySeller = new Map()

  for (const payout of validPayouts) {
    const seller = profilesById.get(payout.seller_id)
    const current = bySeller.get(payout.seller_id) || {
      sellerId: payout.seller_id,
      sellerName: seller?.name || 'Vendedor',
      sellerEmail: seller?.email || '',
      orders: new Set(),
      grossSales: 0,
      platformCommission: 0,
      sellerPayout: 0,
      held: 0,
      paid: 0,
      failed: 0
    }

    current.orders.add(payout.order_id)
    current.grossSales += Number(payout.gross_amount || 0)
    current.platformCommission += Number(payout.platform_fee_amount || 0)
    current.sellerPayout += Number(payout.seller_amount || 0)
    if (payout.status === 'held') current.held += Number(payout.seller_amount || 0)
    if (payout.status === 'paid') current.paid += Number(payout.seller_amount || 0)
    if (payout.status === 'failed') current.failed += Number(payout.seller_amount || 0)
    bySeller.set(payout.seller_id, current)
  }

  const sellers = [...bySeller.values()].map((seller) => ({
    ...seller,
    orders: seller.orders.size,
    grossSales: amount(seller.grossSales),
    platformCommission: amount(seller.platformCommission),
    sellerPayout: amount(seller.sellerPayout),
    held: amount(seller.held),
    paid: amount(seller.paid),
    failed: amount(seller.failed)
  })).sort((a, b) => b.platformCommission - a.platformCommission)

  const totals = sellers.reduce((result, seller) => ({
    grossSales: result.grossSales + seller.grossSales,
    platformCommission: result.platformCommission + seller.platformCommission,
    sellerPayout: result.sellerPayout + seller.sellerPayout,
    orders: result.orders + seller.orders
  }), { grossSales: 0, platformCommission: 0, sellerPayout: 0, orders: 0 })

  return {
    currency: 'MXN',
    commissionRate: 0.15,
    totals: {
      grossSales: amount(totals.grossSales),
      platformCommission: amount(totals.platformCommission),
      sellerPayout: amount(totals.sellerPayout),
      orders: totals.orders,
      sellers: sellers.length
    },
    sellers
  }
}

export function earningsReportToCsv(report, details = []) {
  const detailHeader = ['Numero de orden', 'Fecha de pago', 'Vendedor', 'Correo vendedor', 'Productos', 'Cantidades', 'Venta bruta MXN', 'Comision Apex 15% MXN', 'Pago vendedor 85% MXN', 'Estado del pedido', 'Estado del pago vendedor', 'PayPal Order ID', 'PayPal Capture ID']
  const detailRows = details.map((detail) => [
    detail.orderNumber,
    detail.paymentDate,
    detail.sellerName,
    detail.sellerEmail,
    detail.products,
    detail.quantities,
    Number(detail.grossAmount || 0).toFixed(2),
    Number(detail.platformFeeAmount || 0).toFixed(2),
    Number(detail.sellerAmount || 0).toFixed(2),
    detail.orderStatus,
    detail.payoutStatus,
    detail.paypalOrderId,
    detail.paypalCaptureId
  ])
  const summaryHeader = ['Vendedor', 'Correo', 'Pedidos', 'Ventas brutas MXN', 'Comision Apex 15% MXN', 'Pago vendedor 85% MXN', 'Retenido MXN', 'Liberado MXN']
  const summaryRows = report.sellers.map((seller) => [
    seller.sellerName,
    seller.sellerEmail,
    seller.orders,
    seller.grossSales.toFixed(2),
    seller.platformCommission.toFixed(2),
    seller.sellerPayout.toFixed(2),
    seller.held.toFixed(2),
    seller.paid.toFixed(2)
  ])
  const totalRow = ['TOTALES', '', report.totals.orders, report.totals.grossSales.toFixed(2), report.totals.platformCommission.toFixed(2), report.totals.sellerPayout.toFixed(2), '', '']
  return '\uFEFF' + [detailHeader, ...detailRows, [], [], summaryHeader, ...summaryRows, totalRow]
    .map((row) => row.map(csvValue).join(',')).join('\r\n')
}
