const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function testPasswordAuth() {
  console.log('🧪 Starting Merchant Hashed Password & Authentication Tests...\n');

  try {
    const randomSuffix = Date.now();
    const testEmail = `merchant_${randomSuffix}@teststore.com`;
    const testPassword = 'SecretPassword#123';

    console.log('1. Login with Default Hardcoded Merchant (merchant@payflow.internal / merchant123):');
    const defaultRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'merchant@payflow.internal', password: 'merchant123' }),
    });
    if (!defaultRes.ok) {
      const err = await defaultRes.json();
      throw new Error(`Default merchant login failed: ${err.message}`);
    }
    const defaultData = await defaultRes.json();
    console.log(`  ✅ Default hardcoded merchant authenticated via bcrypt hash! Token: ${defaultData.token.substring(0, 25)}...\n`);

    console.log('2. Login as Hardcoded Merchant with WRONG password (must fail 401):');
    const wrongDefaultRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'merchant@payflow.internal', password: 'wrongPassword99' }),
    });
    if (wrongDefaultRes.status !== 401) {
      throw new Error(`Expected status 401 for wrong password, got: ${wrongDefaultRes.status}`);
    }
    const wrongDefaultData = await wrongDefaultRes.json();
    console.log(`  ✅ Rejected invalid hardcoded merchant password with 401: "${wrongDefaultData.message}"\n`);

    console.log('3. Login with a BRAND NEW merchant (auto-creates merchant in DB with hashed password):');
    const newMerchantRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (!newMerchantRes.ok) {
      const err = await newMerchantRes.json();
      throw new Error(`New merchant login failed: ${err.message}`);
    }
    const newMerchantData = await newMerchantRes.json();
    console.log(`  ✅ Brand new merchant created in DB with hashed password and authenticated: ${newMerchantData.user.email}, uuid: ${newMerchantData.user.id}\n`);

    console.log('4. Login with the newly created merchant using WRONG password (must fail 401):');
    const failRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword999' }),
    });
    if (failRes.status !== 401) {
      throw new Error(`Expected status 401 for wrong password, got: ${failRes.status}`);
    }
    const failData = await failRes.json();
    console.log(`  ✅ Correctly rejected invalid password with 401: "${failData.message}"\n`);

    console.log('5. Login with the newly created merchant using CORRECT password:');
    const successRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (!successRes.ok) {
      const err = await successRes.json();
      throw new Error(`Login with correct password failed: ${err.message}`);
    }
    const successData = await successRes.json();
    console.log(`  ✅ Successfully logged in! JWT token received: ${successData.token.substring(0, 25)}...\n`);

    console.log('🎉 ALL HARDCODED & NEW MERCHANT AUTHENTICATION TESTS PASSED! 🎉');
  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

testPasswordAuth();
