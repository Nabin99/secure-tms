// Simple test script to verify authentication persistence
const puppeteer = require('puppeteer');

async function testAuthPersistence() {
  console.log('Starting authentication persistence test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the application
    console.log('1. Navigating to http://localhost:4200');
    await page.goto('http://localhost:4200');
    await page.waitForTimeout(2000);
    
    // Check if we're on login page
    console.log('2. Checking if login form is present...');
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('✓ Login form found');
      
      // Fill in login credentials
      console.log('3. Filling in login credentials...');
      await page.type('input[type="email"]', 'admin@acme.com');
      await page.type('input[type="password"]', 'password123');
      
      // Submit login
      console.log('4. Submitting login form...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Check if we're redirected to dashboard
      const currentUrl = page.url();
      console.log('5. Current URL after login:', currentUrl);
      
      if (currentUrl.includes('/dashboard') || !currentUrl.includes('/login')) {
        console.log('✓ Successfully logged in');
        
        // Refresh the page to test persistence
        console.log('6. Refreshing page to test authentication persistence...');
        await page.reload();
        await page.waitForTimeout(3000);
        
        const urlAfterRefresh = page.url();
        console.log('7. URL after refresh:', urlAfterRefresh);
        
        if (urlAfterRefresh.includes('/login')) {
          console.log('❌ Authentication was lost on page refresh');
          return false;
        } else {
          console.log('✅ Authentication persisted after page refresh!');
          return true;
        }
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }
    } else {
      console.log('❌ Login form not found');
      return false;
    }
  } catch (error) {
    console.error('Test error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthPersistence().then(success => {
  console.log(success ? '\n🎉 Test PASSED!' : '\n💥 Test FAILED!');
  process.exit(success ? 0 : 1);
});
