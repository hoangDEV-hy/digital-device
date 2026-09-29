require('dotenv').config();

const base = 'http://localhost:3000';
const { Order } = require('../src/models');

const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    const text = await res.text();
    let body;
    try {
        body = JSON.parse(text);
    } catch {
        body = text;
    }
    return { status: res.status, body };
};

const uniq = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

(async () => {
    const adminLogin = await fetchJson(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'Admin1234' }),
    });

    const adminToken = adminLogin.body?.data?.accessToken;
    if (!adminToken) {
        throw new Error('Admin login failed');
    }

    const sellerEmail = `seller.${uniq()}@test.local`;
    const buyerEmail = `buyer.${uniq()}@test.local`;
    const sellerPass = 'Seller123';
    const buyerPass = 'Buyer123';

    const sellerReg = await fetchJson(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullName: 'Seller QA',
            email: sellerEmail,
            password: sellerPass,
            phone: '0900000101',
            confirmPassword: sellerPass,
        }),
    });

    const sellerToken = (await fetchJson(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sellerEmail, password: sellerPass }),
    })).body?.data?.accessToken;

    const buyerReg = await fetchJson(`${base}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fullName: 'Buyer QA',
            email: buyerEmail,
            password: buyerPass,
            phone: '0900000102',
            confirmPassword: buyerPass,
        }),
    });

    const buyerToken = (await fetchJson(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyerEmail, password: buyerPass }),
    })).body?.data?.accessToken;

    console.log('A1', JSON.stringify({ sellerReg: sellerReg.status, buyerReg: buyerReg.status, sellerToken: !!sellerToken, buyerToken: !!buyerToken }));

    const sellerDeposit = await fetchJson(`${base}/api/wallets/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({ amount: 1500000 }),
    });
    console.log('A2', JSON.stringify(sellerDeposit));

    const sellerContract = await fetchJson(`${base}/api/wallets/register-seller-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({ amount: 1000000 }),
    });
    console.log('A3', JSON.stringify(sellerContract));

    const product = await fetchJson(`${base}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({
            title: 'QA Product 1',
            description: 'desc',
            price: 300000,
            categoryId: '0f87502e-8bce-4bd9-bc48-2d77f6daa209',
            type: 'ebook',
            fileUrl: 'https://example.com/a.pdf',
            thumbnail: 'https://example.com/a.jpg',
        }),
    });
    console.log('A4', JSON.stringify(product));

    const buyerDeposit = await fetchJson(`${base}/api/wallets/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ amount: 200000 }),
    });
    console.log('A5', JSON.stringify(buyerDeposit));

    const addCart = await fetchJson(`${base}/api/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ productId: product.body?.data?.id, quantity: 1 }),
    });
    console.log('A6', JSON.stringify(addCart));

    const checkout = await fetchJson(`${base}/api/cart/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${buyerToken}` },
    });
    console.log('A7', JSON.stringify(checkout));

    const paymentFail = await fetchJson(`${base}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ orderId: checkout.body?.data?.orderId, method: 'mock' }),
    });
    console.log('A8', JSON.stringify(paymentFail));

    const buyerTopup = await fetchJson(`${base}/api/wallets/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ amount: 700000 }),
    });
    console.log('A9', JSON.stringify(buyerTopup));

    const paymentSuccess = await fetchJson(`${base}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ orderId: checkout.body?.data?.orderId, method: 'mock' }),
    });
    console.log('A10', JSON.stringify(paymentSuccess));

    const refund1 = await fetchJson(`${base}/api/wallets/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({
            orderId: checkout.body?.data?.orderId,
            refundAmount: 300000,
            requestedAt: new Date().toISOString(),
        }),
    });
    console.log('A11', JSON.stringify(refund1));

    const buyerWalletAfterRefund = await fetchJson(`${base}/api/wallets/me`, { headers: { Authorization: `Bearer ${buyerToken}` } });
    const sellerWalletAfterRefund = await fetchJson(`${base}/api/wallets/me`, { headers: { Authorization: `Bearer ${sellerToken}` } });
    console.log('A12', JSON.stringify(buyerWalletAfterRefund));
    console.log('A13', JSON.stringify(sellerWalletAfterRefund));

    const product2 = await fetchJson(`${base}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({
            title: 'QA Product 2',
            description: 'desc2',
            price: 300000,
            categoryId: '0f87502e-8bce-4bd9-bc48-2d77f6daa209',
            type: 'ebook',
            fileUrl: 'https://example.com/b.pdf',
            thumbnail: 'https://example.com/b.jpg',
        }),
    });
    console.log('A14', JSON.stringify(product2));

    const addCart2 = await fetchJson(`${base}/api/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ productId: product2.body?.data?.id, quantity: 1 }),
    });
    console.log('A15', JSON.stringify(addCart2));

    const checkout2 = await fetchJson(`${base}/api/cart/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${buyerToken}` },
    });
    console.log('A16', JSON.stringify(checkout2));

    const payment2 = await fetchJson(`${base}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
        body: JSON.stringify({ orderId: checkout2.body?.data?.orderId, method: 'mock' }),
    });
    console.log('A17', JSON.stringify(payment2));

    await Order.update({
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        escrowReleased: false,
    }, { where: { id: checkout2.body?.data?.orderId } });

    const release = await fetchJson(`${base}/api/wallets/escrow/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ orderId: checkout2.body?.data?.orderId }),
    });
    console.log('A18', JSON.stringify(release));

    const withdraw = await fetchJson(`${base}/api/wallets/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
        body: JSON.stringify({ amount: 200000, bankName: 'Vietcombank', bankAccount: '123456789', accountHolder: 'Seller QA' }),
    });
    console.log('A19', JSON.stringify(withdraw));

    const adminList = await fetchJson(`${base}/api/wallets/admin/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('A20', JSON.stringify(adminList.body && adminList.body.data ? { count: adminList.body.data.length, sample: adminList.body.data[0] } : adminList.body));

    const users = (await fetchJson(`${base}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    })).body?.data || [];

    const targetId = users.find((u) => u.email === sellerEmail)?.id;
    const suspend = await fetchJson(`${base}/api/wallets/admin/${targetId}/suspend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('A21', JSON.stringify(suspend));

    const resume = await fetchJson(`${base}/api/wallets/admin/${targetId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('A22', JSON.stringify(resume));

    process.exit(0);
})().catch((err) => {
    console.error('VERIFY_ERROR', err && err.stack ? err.stack : err);
    process.exit(1);
});
