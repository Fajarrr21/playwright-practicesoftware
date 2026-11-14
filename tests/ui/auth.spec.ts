import { test, expect } from '../support/fixtures';
import type { Page } from '@playwright/test';

// Cloudflare sometimes shows a "Verify you are human" page for /account on GitHub's runners.
// A test can't get past that, so skip instead of reporting a false failure.
async function skipIfBotCheck(page: Page) {
  const botCheck = page.getByText('Performing security verification');
  await expect(page.getByTestId('page-title').or(botCheck)).toBeVisible();
  test.skip(await botCheck.isVisible(), 'Blocked by Cloudflare bot check');
}

test.describe('Authentication', () => {
  test('user can log in and sees their account', async ({ page, login, user }) => {
    await login.goto();
    await login.login(user.email, user.password);
    await expect(page).toHaveURL(/\/account$/);
    await skipIfBotCheck(page);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
    await expect(page.getByTestId('nav-menu')).toContainText(`${user.first_name} ${user.last_name}`);
  });

  test('wrong password shows a generic error', async ({ page, login, user }) => {
    await login.goto();
    await login.login(user.email, 'wrong-password');
    await expect(login.loginError).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('client-side validation blocks bad input', async ({ login }) => {
    await login.goto();
    await login.login('not-an-email', '');
    await expect(login.emailError).toHaveText('Email format is invalid');
    await expect(login.passwordError).toHaveText('Password is required');
  });

  test('API token injection skips the login form', async ({ authedPage, user }) => {
    await authedPage.goto('/account');
    await skipIfBotCheck(authedPage);
    await expect(authedPage.getByTestId('nav-menu')).toContainText(user.first_name);
  });

  test('sign out returns to the login page', async ({ authedPage }) => {
    await authedPage.goto('/account');
    await skipIfBotCheck(authedPage);
    await authedPage.getByTestId('nav-menu').click();
    await authedPage.getByTestId('nav-sign-out').click();
    await expect(authedPage).toHaveURL(/\/auth\/login$/);
  });
});
