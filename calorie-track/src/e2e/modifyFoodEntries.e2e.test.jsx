describe('Food Entry Management E2E Test', () => {
  // Increase timeout for this test suite as E2E actions can be slow
  jest.setTimeout(60000);

  beforeAll(async () => {
    await page.goto('http://localhost:5173/calorieWeb/');
    await page.waitForSelector("button");
  });

  it('creates account, adds multiple food entries with different methods, edits and deletes entries, and verifies historical trends', async () => {
    // Handle alerts
    page.on('dialog', async dialog => {
        //console.log("Alert appeared:", dialog.message());
        await dialog.accept();
    });

    // Sign up / Sign in
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

    await page.click('button[type="submit"]');

    // Wait for main app to load
    await page.waitForSelector('#name');


    /************************************************************
     *                    ADD TEST SECTION                      *
     ************************************************************/
    const foodNameInput = await page.locator('#name');
    await foodNameInput.fill('apple');
    
    await page.waitForSelector('.suggestion-item.usda-suggestion', { timeout: 3000 });

    await page.$$eval('.food-name, [role="option"]', (items, text) => {
        const match = items.find(item => item.textContent.trim() === text);
        if (match) match.click();
        else throw new Error("No dropdown item found with text: " + text);
      }, 'Strudel, apple');
    //console.log("Strudel, apple selected");

    const quantityInput = await page.locator('#quantity');
    await quantityInput.fill('200g');
    
    const addBtn = await page.locator("::-p-text(Add Entry)");
    await addBtn.click();
    await page.waitForSelector(".entry-content", { timeout: 3000 });

    const foodNameInput2 = await page.locator('#name');
    await foodNameInput2.fill('Test Food');

    const manualOption = await page.locator("::-p-text(Enter nutrition data manually)");
    await manualOption.click();

    await page.locator('#calories').fill('95');
    await page.locator('#protein').fill('0.5');
    await page.locator('#fat').fill('0.3');
    await page.locator('#carbs').fill('25');
    
    const addBtn2 = await page.locator("::-p-text(Add Entry)");
    await addBtn2.click();
    await page.waitForSelector("::-p-text(Test Food)");

    await page.waitForSelector('::-p-text(645)');
    await page.waitForSelector('::-p-text(7)');
    await page.waitForSelector('::-p-text(22)');
    await page.waitForSelector('::-p-text(107)');
    console.log("Expected Add Behavior");

    
    /************************************************************
     *                    EDIT TEST SECTION                     *
     ************************************************************/
    const editButton = await page.locator('.edit-btn');
    await editButton.click();

    await page.waitForSelector('#edit-name', { timeout: 3000 });
    await page.locator('#edit-name').fill('Manual Updated Test Food');
    await page.locator('#edit-calories').fill('2000');
    await page.locator('#edit-protein').fill('10');
    await page.locator('#edit-fat').fill('5');
    await page.locator('#edit-carbs').fill('100');
    
    const saveBtn = await page.locator("::-p-text(Update Entry)");
    await saveBtn.click();
    await page.waitForSelector("::-p-text(Manual Updated Test Food)", { timeout: 3000 });
    
    // Verify the updated values
    await page.waitForSelector('::-p-text(2550)');
    await page.waitForSelector('::-p-text(16)');
    await page.waitForSelector('::-p-text(27)');
    await page.waitForSelector('::-p-text(182)');
    console.log("Expected Update Behavior");


    /************************************************************
     *                    DELETE TEST SECTION                   *
     ************************************************************/
    const deleteButton = await page.locator('.delete-btn');
    await deleteButton.click();

    await page.waitForSelector('.entries > ul:nth-child(2) > li');

    // Verify the values after deletion
    const entryCount = await page.$$eval('.entries > ul:nth-child(2) > li', items => items.length);
    expect(entryCount).toBe(1);
    await page.waitForSelector('::-p-text(550)');
    await page.waitForSelector('::-p-text(6)');
    await page.waitForSelector('::-p-text(22)');
    await page.waitForSelector('::-p-text(82)');
    console.log("Expected Deletion Behavior");


    /************************************************************
     *              HISTORICAL TRENDS TEST SECTION              *
     ************************************************************/
    const prevButton = await page.locator("::-p-text(← Previous)");
    await prevButton.click();

    const pastFoodNameInput = await page.locator('#name');
    await pastFoodNameInput.fill('bagel');
    
    await page.waitForSelector('.suggestion-item.usda-suggestion', { timeout: 3000 });

    await page.$$eval('.food-name, [role="option"]', (items, text) => {
        const match = items.find(item => item.textContent.trim() === text);
        if (match) match.click();
        else throw new Error("No dropdown item found with text: " + text);
      }, 'Bagels, multigrain');
    //console.log("Bagels, multigrain selected");

    const pastQuantityInput = await page.locator('#quantity');
    await pastQuantityInput.fill('500g');
    
    const pastAddBtn = await page.locator("::-p-text(Add Entry)");
    await pastAddBtn.click();
    await page.waitForSelector(".entry-content", { timeout: 3000 });
    
    const trendsBtn = await page.locator('.trends-btn');
    await trendsBtn.click();

    await page.waitForSelector('::-p-text(2/7)');
    await page.waitForSelector('::-p-text(251)');
    await page.waitForSelector('::-p-text(8g)');
    await page.waitForSelector('::-p-text(550)');
    await page.waitForSelector('::-p-text(1205)');

    const macrosBtn = await page.locator('::-p-text(Macros)');
    await macrosBtn.click();
    console.log("Expected Trends Behavior");

    console.log("ALL TESTS PASSED ✓");
  });
});
