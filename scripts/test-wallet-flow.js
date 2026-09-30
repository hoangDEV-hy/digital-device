const assert = require('assert');

const paymentController = require('../src/controllers/paymentController');
const walletController = require('../src/controllers/walletController');
const { addMoney } = require('../src/utils/money');

assert.strictEqual(addMoney('0.01', 500000), 500000.01, 'adding a deposit to a DECIMAL string must use numeric addition');

const orderItems = [
  { productId: 'p1', price: 100000, quantity: 1, Product: { sellerId: 'seller-a' } },
  { productId: 'p2', price: 200000, quantity: 1, Product: { sellerId: 'seller-b' } },
  { productId: 'p3', price: 50000, quantity: 1, Product: { sellerId: 'seller-a' } },
];

const sellerTotals = paymentController.calculateSellerTotals(orderItems);
assert.deepStrictEqual(sellerTotals, {
  'seller-a': 150000,
  'seller-b': 200000,
}, 'order items must be grouped by seller for escrow hold/release');

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
