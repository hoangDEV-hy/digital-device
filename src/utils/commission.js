const COMMISSION_RATE = 0.02;

const toMoney = (value) => Number(parseFloat(value || 0).toFixed(2));

const calculateLineSettlement = (price, quantity = 1) => {
  const gross = toMoney(Number(price || 0) * Number(quantity || 1));
  const commission = toMoney(gross * COMMISSION_RATE);

  return {
    gross,
    commission,
    sellerNet: toMoney(gross - commission),
  };
};

const buildSellerRevenueReport = (sellerRecords = [], paidLines = [], commissionTransactions = []) => {
  const commissionByOrder = new Map();
  for (const transaction of commissionTransactions) {
    const orderId = String(transaction.relatedOrderId);
    commissionByOrder.set(orderId, toMoney((commissionByOrder.get(orderId) || 0) + Number(transaction.amount || 0)));
  }

  const sellerTotals = new Map(sellerRecords.map((seller) => [seller.id, {
    sellerId: seller.id,
    fullName: seller.fullName,
    email: seller.email,
    unitsSold: 0,
    grossRevenue: 0,
    commission: 0,
    netRevenue: 0,
  }]));

  for (const line of paidLines) {
    const seller = line.product?.seller;
    const sellerId = line.product?.sellerId || seller?.id;
    if (!sellerId) continue;
    if (!sellerTotals.has(sellerId)) {
      sellerTotals.set(sellerId, {
        sellerId,
        fullName: seller?.fullName || 'Seller',
        email: seller?.email || '',
        unitsSold: 0,
        grossRevenue: 0,
        commission: 0,
        netRevenue: 0,
      });
    }

    const totals = sellerTotals.get(sellerId);
    const quantity = Number(line.quantity || 1);
    const settlement = calculateLineSettlement(line.price, quantity);
    const commission = commissionByOrder.has(String(line.orderId)) ? settlement.commission : 0;
    totals.unitsSold += quantity;
    totals.grossRevenue = toMoney(totals.grossRevenue + settlement.gross);
    totals.commission = toMoney(totals.commission + commission);
    totals.netRevenue = toMoney(totals.netRevenue + settlement.gross - commission);
  }

  const sellers = [...sellerTotals.values()].sort((left, right) => right.grossRevenue - left.grossRevenue);
  return {
    summary: {
      unitsSold: sellers.reduce((total, seller) => total + seller.unitsSold, 0),
      grossRevenue: toMoney(sellers.reduce((total, seller) => total + seller.grossRevenue, 0)),
      commissionReceived: toMoney(commissionTransactions.reduce((total, item) => total + Number(item.amount || 0), 0)),
      sellerNetRevenue: toMoney(sellers.reduce((total, seller) => total + seller.netRevenue, 0)),
    },
    sellers,
  };
};

module.exports = { COMMISSION_RATE, calculateLineSettlement, buildSellerRevenueReport };