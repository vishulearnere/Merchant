const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Payment Link & Webhook Integration Tests...\n');

  try {
    console.log('Test 1: Server Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`);
    if (!healthRes.ok) throw new Error(`Health check failed: ${healthRes.statusText}`);
    console.log('  ✅ Server is healthy.\n');

    console.log('Test 2: Create Payment Link (Amount in paise: 50000 = ₹500)');
    const createRes = await fetch(`${BASE_URL}/payment-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 50000,
        description: 'Test Webhook & Concurrency Suite',
      }),
    });
    if (!createRes.ok) throw new Error(`Link creation failed: ${createRes.statusText}`);
    const link = await createRes.json();
    console.log(`  ✅ Link created: ${link.linkId}, status: ${link.status}, amount: ${link.amount} paise\n`);

    console.log('Test 3: Start Payment (Status should be PENDING)');
    const payRes1 = await fetch(`${BASE_URL}/pay/${link.linkId}`, { method: 'POST' });
    const payment1 = await payRes1.json();
    if (payment1.status !== 'PENDING') throw new Error(`Expected PENDING, got ${payment1.status}`);
    console.log(`  ✅ Payment created: ${payment1.paymentId}, status: ${payment1.status}\n`);

    console.log('Test 4: Second Payment Attempt while PENDING (Should return same payment)');
    const payRes2 = await fetch(`${BASE_URL}/pay/${link.linkId}`, { method: 'POST' });
    const payment2 = await payRes2.json();
    if (payment2.paymentId !== payment1.paymentId) {
      throw new Error(`Expected existing payment ${payment1.paymentId}, got new ${payment2.paymentId}`);
    }
    console.log(`  ✅ Successfully returned in-flight PENDING payment: ${payment2.paymentId}\n`);

    console.log('Test 5: Process First SUCCESS Webhook');
    const eventId = 'evt_test_' + Date.now();
    const webhookRes1 = await fetch(`${BASE_URL}/webhooks/provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'payflow_secret_key_123',
      },
      body: JSON.stringify({
        eventId,
        paymentId: payment1.paymentId,
        status: 'SUCCESS',
      }),
    });
    const webhookData1 = await webhookRes1.json();
    console.log(`  ✅ Webhook processed: ${webhookData1.message}`);

    const checkRes = await fetch(`${BASE_URL}/pay/${link.linkId}`);
    const checkData = await checkRes.json();
    if (checkData.link.status !== 'PAID') throw new Error(`Expected PAID, got ${checkData.link.status}`);
    console.log(`  ✅ Link status verified as PAID\n`);

    console.log('Test 6: Duplicate Webhook (Same eventId arriving twice)');
    const webhookResDuplicate = await fetch(`${BASE_URL}/webhooks/provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        paymentId: payment1.paymentId,
        status: 'SUCCESS',
      }),
    });
    const webhookDataDup = await webhookResDuplicate.json();
    if (!webhookDataDup.isDuplicate) {
      throw new Error(`Expected isDuplicate: true, got: ${JSON.stringify(webhookDataDup)}`);
    }
    console.log(`  ✅ Idempotency confirmed: ${webhookDataDup.message}\n`);

    console.log('Test 7: Out-of-Order Webhook (Provider sends FAILED after SUCCESS for same payment)');
    const outOfOrderEventId = 'evt_ooo_' + Date.now();
    const webhookResOOO = await fetch(`${BASE_URL}/webhooks/provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: outOfOrderEventId,
        paymentId: payment1.paymentId,
        status: 'FAILED',
      }),
    });
    const webhookDataOOO = await webhookResOOO.json();
    console.log(`  ✅ State machine guard: ${webhookDataOOO.message}`);

    const finalCheckRes = await fetch(`${BASE_URL}/pay/${link.linkId}`);
    const finalData = await finalCheckRes.json();
    if (finalData.latestPayment.status !== 'SUCCESS') {
      throw new Error(`CRITICAL: Payment status was overridden to ${finalData.latestPayment.status}`);
    }
    if (finalData.link.status !== 'PAID') {
      throw new Error(`CRITICAL: Link status was overridden to ${finalData.link.status}`);
    }
    console.log(`  ✅ Verified: Payment remains SUCCESS and Link remains PAID. Status never changed back!\n`);

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
  }
}

runTests();
