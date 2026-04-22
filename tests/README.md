# Motion Code Testing Guide

## Automated Testing System

This testing system ensures Motion Code remains stable and bug-free for paying customers.

## Running Tests

### Quick Test (Manual)
```bash
./run-tests.sh
```

### View Test Results
After running tests, view the detailed HTML report:
```bash
npx playwright show-report test-results/html
```

## What Gets Tested

### ✅ Currently Covered
- **Landing Page**: Loads correctly with proper branding
- **Login Flow**: Users can sign in with email/password
- **Authentication**: Protected routes require login
- **Logout Flow**: Users can log out and are redirected properly
- **Navigation**: All main pages are accessible (Dashboard, Movement Library, Education)
- **Videos**: Dashboard videos load and have correct object storage URLs
- **Movement Library**: Exercises display correctly
- **Password Visibility**: Show/hide password toggle works
- **Invalid Login**: Shows proper error messages
- **Missing Videos**: Page doesn't crash on video errors

### ⚠️ Not Yet Covered (Future Tests Needed)
- Session persistence across page reloads
- Stripe payment integration ($49 one-time payment)
- Exercise upload functionality
- Video autoplay behavior across different browsers/devices
- Workshops early access notifications
- Settings page functionality
- Mobile responsive behavior

## Automated Testing Schedule

### Option 1: GitHub Actions (Recommended for Production)
When you deploy to production, set up GitHub Actions to run tests:
- Every 6 hours automatically
- Before every deployment
- On every code push

### Option 2: Cron Job (For Development)
Add to crontab to run daily at 9 AM and 5 PM:
```bash
0 9,17 * * * cd /path/to/motion-code && ./run-tests.sh >> test-logs/$(date +\%Y-\%m-\%d).log 2>&1
```

### Option 3: Manual Testing
Run tests before:
- Deploying new features
- After fixing bugs
- Before major releases

## Adding New Tests

Edit `tests/e2e/critical-flows.spec.ts` to add new test cases:

```typescript
test('should test new feature', async ({ page }) => {
  // Login if needed
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="input-email"]', TEST_USER.email);
  await page.fill('[data-testid="input-password"]', TEST_USER.password);
  await page.click('[data-testid="button-login"]');
  
  // Test your feature
  await page.click('[data-testid="button-new-feature"]');
  await expect(page.locator('text=Expected Result')).toBeVisible();
});
```

## Test Data

Tests use this account:
- Email: `dbenton@preparedtoplay.com.au`
- Password: `password`

**Important**: Keep this test account active in production!

## Troubleshooting

### Tests Fail to Start
```bash
npx playwright install chromium
```

### Tests Timeout
Increase timeout in `playwright.config.ts`:
```typescript
timeout: 30000, // 30 seconds
```

### Video Tests Fail
Check that videos exist in object storage:
```bash
curl http://localhost:5000/objects/videos/acc_white_1.mp4 -I
```

## Best Practices

1. **Run tests before deployment** - Catch issues early
2. **Keep test data stable** - Don't delete test user
3. **Review failed tests immediately** - Don't ignore failures  
4. **Add tests for new features** - Maintain coverage
5. **Monitor test results** - Set up alerts for failures

## Questions?

Contact: ctandy@preparedtoplay.com.au
