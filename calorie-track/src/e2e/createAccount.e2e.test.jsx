describe('User Registration Flow', () => {
  // Increase timeout for this test suite as E2E actions can be slow
  jest.setTimeout(60000);

  if (typeof page === 'undefined') {
    // eslint-disable-next-line no-console
    console.warn('Puppeteer `page` global is not available. Skipping E2E tests in this environment.');
    return;
  }

  beforeAll(async () => {
    // Assuming your app starts on localhost:3000
    // We start at the login page as requested, then navigate to sign up
    await page.goto('http://localhost:5173/calorieWeb/');

    await page.waitForSelector("button");
  });

  it('create a new account, make sure entries are separated by date, accesses user settings, and signs out', async () => {
    
    const landingButton = await page.locator("::-p-text(Sign In / Sign Up)");
    await landingButton.click();

    await page.waitForSelector('form');

    const createAccountButton = await page.locator("::-p-text(Need an account?)");
    await createAccountButton.click();

    await page.waitForSelector('input[placeholder="Display Name (optional)"]');

    const uniqueEmail = `testuser${Date.now()}@example.com`;

    await page.type('input[type="email"]', uniqueEmail);
    await page.type('input[type="password"]', 'TestPassword123!');
    await page.type('input[placeholder="Display Name (optional)"]', 'Test User');

    // Accept the browser alert that notifies about verification email
    page.once('dialog', async dialog => {
      try { await dialog.accept(); } catch (e) { /* ignore */ }
    });
    await page.click('button[type="submit"]');

    const prevButton = await page.locator("::-p-text(← Previous)");
    await prevButton.click();

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = yesterday.toISOString().slice(0, 10);
    const dateObj = new Date(dateStr + 'T00:00:00');
    
    const expectedText = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });

    await page.waitForSelector(`::-p-text(${expectedText})`);

    const foodNameInput = await page.locator('#name');
    await foodNameInput.fill('Test Apple');

    // Ensure the suggestions dropdown is visible and the manual entry item is scrolled into view
    await page.waitForSelector('.food-suggestions-dropdown');
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.suggestion-item'));
      const manual = items.find(el => el.textContent && el.textContent.includes('Enter nutrition data manually'));
      if (manual) {
        manual.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    });
    // Click via evaluate to avoid locator scrolling issues in headless/test runners
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.suggestion-item'));
      const manual = items.find(el => el.textContent && el.textContent.includes('Enter nutrition data manually'));
      if (manual) manual.click();
    });
    
    const quantityInput = await page.locator('#quantity');
    await quantityInput.fill('1 item');

    await page.locator('#calories').fill('95');
    await page.locator('#protein').fill('0.5');
    await page.locator('#fat').fill('0.3');
    await page.locator('#carbs').fill('25');

    const addBtn = await page.locator("::-p-text(Add Entry)");
    await addBtn.click();

    await page.waitForSelector("::-p-text(Test Apple)");

    const nextButton = await page.locator("::-p-text(Next →)");
    await nextButton.click();

    const settingsButton = await page.locator("::-p-text(Settings)");
    await settingsButton.click();
    await page.waitForSelector("::-p-text(No entries yet)");

    await page.waitForSelector("::-p-text(User Settings)");

    const resendBtn = await page.$('.resend-button');
    if (resendBtn) {
      await resendBtn.click();
      // Wait for either the success message, a generic failure, or a rate-limit message.
      // We poll the settings message area because the exact error text can vary (e.g. "Too many requests").
      await page.waitForFunction(() => {
        const nodes = Array.from(document.querySelectorAll('.settings-message'));
        const texts = nodes.map(n => (n.textContent || '').trim());
        return texts.some(t =>
          t.includes('Verification email sent') ||
          t.includes('Failed to send verification email') ||
          /too many requests/i.test(t)
        );
      }, { timeout: 7000 });
    }

    const nameInput = await page.locator('input[placeholder="Enter display name"]');
    await nameInput.fill('Updated User Name');
    const updateNameBtn = await page.locator("::-p-text(Update Display Name)");
    await updateNameBtn.click();
    await page.waitForSelector("::-p-text(Display name updated successfully!)");

    const emailInput = await page.locator('input[placeholder="Enter email"]');
    await emailInput.fill(`updated_${uniqueEmail}`);
    const updateEmailBtn = await page.locator("::-p-text(Update Email)");
    await updateEmailBtn.click();
    await page.waitForSelector("::-p-text(Verification sent to the new email. Please check that inbox (and spam) and click the verification link to complete the change.)");
    
    const passInput = await page.locator('input[placeholder="New password (min 6 characters)"]');
    await passInput.fill('NewPass123!');
    const confirmInput = await page.locator('input[placeholder="Confirm new password"]');
    await confirmInput.fill('NewPass123!');
    const updatePassBtn = await page.locator("::-p-text(Update Password)");
    await updatePassBtn.click();
    await page.waitForSelector("::-p-text(Password updated successfully!)");
    
    await page.click('.close-btn');
    await page.waitForSelector("::-p-text(User Settings)", { hidden: true });


    const signOutBtn = await page.locator("::-p-text(Sign Out)");

    await signOutBtn.click();
    await page.waitForSelector("::-p-text(Sign In / Sign Up)");
  });
});