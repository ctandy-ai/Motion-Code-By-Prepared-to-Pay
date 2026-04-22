import { test, expect } from '@playwright/test';

const BASE_URL = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  : 'http://localhost:5000';

const TEST_USER = {
  email: 'dbenton@preparedtoplay.com.au',
  password: 'password'
};

test.describe('Critical User Flows', () => {
  
  test('should load landing page successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Motion Code|Prepared to Play/i);
    
    // Check for key landing page elements
    await expect(page.locator('text=Motion Code')).toBeVisible({ timeout: 10000 });
  });

  test('should handle login flow correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in login form
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    
    // Submit form
    await page.click('[data-testid="button-login"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(page.locator('text=Movement Qualities')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between pages when authenticated', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to Movement Library
    await page.click('[data-testid="link-movement-library"]');
    await expect(page).toHaveURL(/\/exercises/);
    
    // Navigate to Education
    await page.click('[data-testid="link-education"]');
    await expect(page).toHaveURL(/\/education/);
    
    // Navigate back to Dashboard
    await page.click('[data-testid="link-dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should load and play videos on dashboard', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Check for video elements
    const videos = page.locator('video');
    const videoCount = await videos.count();
    expect(videoCount).toBeGreaterThan(0);
    
    // Check that at least one video has a valid src
    const firstVideo = videos.first();
    const src = await firstVideo.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/\/objects\/videos\//);
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Click logout
    await page.click('[data-testid="button-logout"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    
    // Verify we can't access dashboard without auth
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('should display exercises in movement library', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to exercises
    await page.goto(`${BASE_URL}/exercises`);
    
    // Should see exercise cards
    const exerciseCards = page.locator('[data-testid^="card-exercise-"]');
    const cardCount = await exerciseCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const passwordInput = page.locator('[data-testid="input-password"]');
    const toggleButton = page.locator('[data-testid="button-toggle-password"]');
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle
    await toggleButton.click();
    
    // Should now be text type
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    
    // Should be password again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Error Handling', () => {
  
  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('[data-testid="input-email"]', 'wrong@email.com');
    await page.fill('[data-testid="input-password"]', 'wrongpassword');
    await page.click('[data-testid="button-login"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle missing video gracefully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="input-email"]', TEST_USER.email);
    await page.fill('[data-testid="input-password"]', TEST_USER.password);
    await page.click('[data-testid="button-login"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Check console for video errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('video')) {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Videos should either load or fail silently (no crashes)
    expect(page.isClosed()).toBe(false);
  });
});
