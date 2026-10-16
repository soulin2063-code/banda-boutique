/**
 * Phase 0 Security Verification Script
 * Run with: node scripts/test_security.mjs [BASE_URL]
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

async function runTests() {
  console.log(`\n🔒 Running Security Verification against ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  // Test 1: Unauthenticated GET /api/orders -> must be 401
  try {
    const res = await fetch(`${BASE_URL}/api/orders`);
    const data = await res.json();
    if (res.status === 401 && data.code === 'UNAUTHORIZED') {
      console.log('✅ Test 1 PASS: Unauthenticated GET /api/orders returns 401 UNAUTHORIZED');
      passed++;
    } else {
      console.error(`❌ Test 1 FAIL: Expected 401, got ${res.status}:`, data);
      failed++;
    }
  } catch (e) {
    console.error('❌ Test 1 ERROR:', e.message);
    failed++;
  }

  // Test 2: Invalid / Non-admin token in Authorization header -> 401 or 403
  try {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: {
        Authorization: 'Bearer invalid_or_non_admin_token_xyz123',
      },
    });
    const data = await res.json();
    if ((res.status === 401 && data.code === 'UNAUTHORIZED') || (res.status === 403 && data.code === 'FORBIDDEN')) {
      console.log(`✅ Test 2 PASS: Invalid/non-admin token returns ${res.status} ${data.code}`);
      passed++;
    } else {
      console.error(`❌ Test 2 FAIL: Expected 401 or 403, got ${res.status}:`, data);
      failed++;
    }
  } catch (e) {
    console.error('❌ Test 2 ERROR:', e.message);
    failed++;
  }

  // Test 3: Unauthenticated /admin page request -> redirect to /admin/login
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual',
    });
    // In Next.js, redirect will be 307 or 302, location /admin/login
    const location = res.headers.get('location') || '';
    if ((res.status === 307 || res.status === 302 || res.status === 308) && location.includes('/admin/login')) {
      console.log(`✅ Test 3 PASS: Unauthenticated GET /admin redirects to /admin/login (Status: ${res.status}, Location: ${location})`);
      passed++;
    } else {
      console.error(`❌ Test 3 FAIL: Expected redirect to /admin/login, got status ${res.status}, location: ${location}`);
      failed++;
    }
  } catch (e) {
    console.error('❌ Test 3 ERROR:', e.message);
    failed++;
  }

  // Test 4: Public GET /api/products -> 200, but no cost_price or min_stock_threshold
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    if (res.status === 200) {
      const data = await res.json();
      const hasCostPrice = Array.isArray(data) && data.some(p => 
        p.product_variants?.some((v) => v.cost_price !== undefined || v.min_stock_threshold !== undefined)
      );
      if (!hasCostPrice) {
        console.log('✅ Test 4 PASS: Public GET /api/products returns 200 with sensitive fields (cost_price, min_stock_threshold) stripped');
        passed++;
      } else {
        console.error('❌ Test 4 FAIL: Products endpoint exposed cost_price or min_stock_threshold');
        failed++;
      }
    } else {
      console.error(`❌ Test 4 FAIL: Expected 200 for public products, got ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.error('❌ Test 4 ERROR:', e.message);
    failed++;
  }

  // Test 5: Unauthenticated POST /api/products -> 401
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'test-forbidden' }),
    });
    const data = await res.json();
    if (res.status === 401 && data.code === 'UNAUTHORIZED') {
      console.log('✅ Test 5 PASS: Unauthenticated POST /api/products returns 401 UNAUTHORIZED');
      passed++;
    } else {
      console.error(`❌ Test 5 FAIL: Expected 401 for unauthorized product creation, got ${res.status}:`, data);
      failed++;
    }
  } catch (e) {
    console.error('❌ Test 5 ERROR:', e.message);
    failed++;
  }

  console.log(`\nSecurity Checklist Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests();
