const assert = require('assert');

const paymentController = require('../src/controllers/paymentController');
const walletController = require('../src/controllers/walletController');
const orderController = require('../src/controllers/orderController');
const { addMoney } = require('../src/utils/money');
const { calculateLineSettlement, buildSellerRevenueReport } = require('../src/utils/commission');

assert.strictEqual(addMoney('0.01', 500000), 500000.01, 'adding a deposit to a DECIMAL string must use numeric addition');
assert.deepStrictEqual(calculateLineSettlement(100000, 3), {
  gross: 300000,
  commission: 6000,
  sellerNet: 294000,
}, 'each paid line should retain 2% commission and credit the seller the remaining 98%');

const orderItems = [
  { productId: 'p1', price: 100000, quantity: 1, Product: { sellerId: 'seller-a' } },
  { productId: 'p2', price: 200000, quantity: 1, Product: { sellerId: 'seller-b' } },
  { productId: 'p3', price: 50000, quantity: 1, Product: { sellerId: 'seller-a' } },
];

const sellerTotals = paymentController.calculateSellerTotals(orderItems);
assert.deepStrictEqual(sellerTotals, {
  'seller-a': 147000,
  'seller-b': 196000,
}, 'seller escrow totals should reflect net revenue after commission');
assert.strictEqual(paymentController.calculatePlatformCommission(orderItems), 7000, 'platform commission must reconcile to per-line seller net totals');
assert.deepStrictEqual(orderController.getSellerBreakdown(orderItems), {
  'seller-a': 147000,
  'seller-b': 196000,
}, 'commissioned orders should release the seller net after fee');
assert.deepStrictEqual(orderController.getSellerBreakdown(orderItems, false), {
  'seller-a': 150000,
  'seller-b': 200000,
}, 'orders paid before commission support must release their original gross escrow');
assert.deepStrictEqual(buildSellerRevenueReport(
  [{ id: 'seller-a', fullName: 'Seller A', email: 'a@example.com' }, { id: 'seller-c', fullName: 'Seller C', email: 'c@example.com' }],
  [
    { orderId: 'new-order', price: 100000, quantity: 1, product: { sellerId: 'seller-a' } },
    { orderId: 'old-order', price: 50000, quantity: 2, product: { sellerId: 'seller-a' } },
  ],
  [{ relatedOrderId: 'new-order', amount: 2000 }],
), {
  summary: { unitsSold: 3, grossRevenue: 200000, commissionReceived: 2000, sellerNetRevenue: 198000 },
  sellers: [
    { sellerId: 'seller-a', fullName: 'Seller A', email: 'a@example.com', unitsSold: 3, grossRevenue: 200000, commission: 2000, netRevenue: 198000 },
    { sellerId: 'seller-c', fullName: 'Seller C', email: 'c@example.com', unitsSold: 0, grossRevenue: 0, commission: 0, netRevenue: 0 },
  ],
}, 'admin report should include zero-sale sellers and only charge commission recorded on new orders');

const buyerWallet = { balance: 500000, escrowBalance: 0 };
const canPay = paymentController.canBuyerAfford(buyerWallet, 350000);
assert.strictEqual(canPay, true, 'buyer should be able to pay when wallet balance covers total');

const insufficientWallet = { balance: 50000, escrowBalance: 0 };
const cannotPay = paymentController.canBuyerAfford(insufficientWallet, 350000);
assert.strictEqual(cannotPay, false, 'buyer should be blocked when balance is insufficient');
assert.ok(paymentController.buildMockPaymentUrl('order-1', 'PENDING-123').includes('/api/payments/mock-ipn?orderId=order-1&status=success'), 'insufficient-balance flow must provide a mock IPN callback for top-up payment');

const releasePlan = walletController.calculateEscrowReleasePlan(orderItems, { 'seller-a': 120000, 'seller-b': 200000 });
assert.deepStrictEqual(releasePlan, {
  'seller-a': 120000,
  'seller-b': 200000,
}, 'release should use the actual escrow funds available per seller');

console.log('Wallet flow test passed');
