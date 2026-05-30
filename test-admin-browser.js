const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));

  try {
    // 1. Go to login page
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    console.log('Login page loaded');

    // 2. Fill login form
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 3. Wait for navigation after login
    await page.waitForURL('**/faqs', { timeout: 5000 });
    console.log('Logged in, at:', page.url());

    // 4. Check if Admin link is visible in navbar
    const adminLink = await page.locator('text=Admin').first();
    const adminVisible = await adminLink.isVisible().catch(() => false);
    console.log('Admin link visible in navbar:', adminVisible);

    // 5. Navigate to admin dashboard
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('Admin dashboard URL:', page.url());

    // 6. Check what's on the page
    const bodyText = await page.textContent('body');
    const hasAdminDashboard = bodyText.includes('Admin Dashboard') || bodyText.includes('Total Users');
    console.log('Has admin dashboard content:', hasAdminDashboard);

    // 7. Check for toast errors
    if (errors.length > 0) {
      console.log('Console errors:');
      errors.forEach(e => console.log('  ERROR:', e));
    } else {
      console.log('No console errors');
    }

  } catch (err) {
    console.log('Test error:', err.message);
    if (errors.length > 0) {
      console.log('Console errors:');
      errors.forEach(e => console.log('  ERROR:', e));
    }
  }

  await browser.close();
})();